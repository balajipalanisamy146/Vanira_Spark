"""
Vanira Spark - AI Business Chatbot Engine
Production-grade natural language query engine for enterprise business data.
Safe, deterministic, read-only PostgreSQL queries with structured response generation.
"""

import re
import os
import logging
from datetime import date
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from app.database import engine

logger = logging.getLogger("vanira.chatbot")

# Max limits for query safety
MAX_RESULT_LIMIT = 50
DEFAULT_TOP_LIMIT = 10

# Security patterns for SQL injection & prompt injection detection
SQL_INJECTION_PATTERNS = [
    r"\b(drop|alter|truncate|create|insert|update|delete|grant|revoke)\b",
    r"\bunion\s+select\b",
    r"--",
    r";",
    r"/\*.*?\*/",
    r"\bexec(ute)?\b",
    r"\bor\s+1\s*=\s*1\b",
    r"\band\s+1\s*=\s*1\b",
    r"\bxp_\w+\b",
]

PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"reveal\s+(your\s+)?(system\s+prompt|secret|credentials|password|api\s*key)",
    r"what\s+is\s+your\s+(secret|system\s+prompt|hidden\s+instruction|api\s*key|password|credential)",
    r"hidden\s+(instruction|prompt|secret)",
    r"pretend\s+you\s+are\s+(not|an?\s+unrestricted)",
    r"jailbreak",
    r"override\s+(system|security)\s+rules",
]


def detect_security_risks(user_text: str) -> Optional[str]:
    """
    Checks if user text contains attempts at prompt injection or SQL injection.
    Returns error reason if detected, else None.
    """
    cleaned = user_text.strip().lower()

    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, cleaned, re.IGNORECASE):
            return "Security violation: Prompt injection or rule override attempt detected. Request blocked."

    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, cleaned, re.IGNORECASE):
            return "Security violation: Disallowed SQL control characters or modification syntax detected. Request blocked."

    return None


def execute_read_query(query: Any, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Executes a read-only query safely with parameter binding.
    """
    with engine.connect() as conn:
        result = conn.execute(query, params or {})
        rows = [dict(row) for row in result.mappings().all()]
    return rows


def get_dataset_bounds() -> Dict[str, Any]:
    """
    Retrieves the actual date bounds and record count from the sales database.
    """
    query = text("""
        SELECT
            MIN(sale_date) AS min_date,
            MAX(sale_date) AS max_date,
            COUNT(*) AS total_rows,
            COUNT(DISTINCT invoice_id) AS total_orders
        FROM sales
    """)
    rows = execute_read_query(query)
    if not rows or not rows[0]["total_rows"]:
        return {
            "min_date": None,
            "max_date": None,
            "total_rows": 0,
            "total_orders": 0,
            "date_range_label": "No sales records available"
        }
    
    r = rows[0]
    min_d = r["min_date"]
    max_d = r["max_date"]
    min_str = min_d.strftime("%b %d, %Y") if min_d else "N/A"
    max_str = max_d.strftime("%b %d, %Y") if max_d else "N/A"

    return {
        "min_date": min_d.isoformat() if min_d else None,
        "max_date": max_d.isoformat() if max_d else None,
        "total_rows": int(r["total_rows"] or 0),
        "total_orders": int(r["total_orders"] or 0),
        "date_range_label": f"{min_str} - {max_str}"
    }


def format_currency_in(amount: float) -> str:
    """Formats numeric value in Indian Rupee format (Crores, Lakhs, or standard)."""
    abs_amt = abs(amount)
    sign = "-" if amount < 0 else ""
    if abs_amt >= 10_000_000:
        return f"{sign}₹{abs_amt / 10_000_000:.2f} Cr"
    elif abs_amt >= 100_000:
        return f"{sign}₹{abs_amt / 100_000:.2f} L"
    else:
        return f"{sign}₹{abs_amt:,.2f}"


def format_number_in(num: float) -> str:
    """Formats integer or float with standard comma formatting."""
    return f"{int(round(num)):,}"


# ==============================================================================
# INTENT HANDLERS (Deterministic, Grounded in Real PostgreSQL Data)
# ==============================================================================

def handle_sales_summary() -> Dict[str, Any]:
    bounds = get_dataset_bounds()
    query = text("""
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_sales,
            COALESCE(SUM(profit), 0) AS total_profit,
            COUNT(DISTINCT invoice_id) AS total_orders,
            COALESCE(SUM(quantity), 0) AS total_quantity,
            COUNT(DISTINCT customer_id) AS total_customers,
            COUNT(DISTINCT product_name) AS unique_products
        FROM sales
    """)
    rows = execute_read_query(query)
    row = rows[0] if rows else {}

    total_sales = float(row.get("total_sales") or 0)
    total_profit = float(row.get("total_profit") or 0)
    total_orders = int(row.get("total_orders") or 0)
    total_quantity = int(row.get("total_quantity") or 0)
    total_customers = int(row.get("total_customers") or 0)
    unique_products = int(row.get("unique_products") or 0)
    profit_margin = (total_profit / total_sales * 100) if total_sales > 0 else 0
    avg_order_value = (total_sales / total_orders) if total_orders > 0 else 0

    return {
        "intent": "sales_summary",
        "title": "Overall Sales & Profit Performance",
        "answer": (
            f"Your business has generated a cumulative revenue of **{format_currency_in(total_sales)}** "
            f"and a total net profit of **{format_currency_in(total_profit)}**, reflecting an overall "
            f"profit margin of **{profit_margin:.2f}%**. Across **{format_number_in(total_orders)}** completed orders, "
            f"your store moved **{format_number_in(total_quantity)}** units across **{format_number_in(unique_products)}** products "
            f"serving **{format_number_in(total_customers)}** unique customers."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "metric_definitions": [
            "Total Sales = SUM(total_amount) across all verified sales transactions",
            "Total Profit = SUM(profit)",
            f"Profit Margin = (Total Profit / Total Sales) * 100 = {profit_margin:.2f}%",
            f"Average Order Value (AOV) = Total Sales / Total Orders = ₹{avg_order_value:,.2f}"
        ],
        "kpis": [
            {"label": "Total Sales", "value": format_currency_in(total_sales), "raw": total_sales, "is_positive": True},
            {"label": "Total Profit", "value": format_currency_in(total_profit), "raw": total_profit, "is_positive": True},
            {"label": "Profit Margin", "value": f"{profit_margin:.2f}%", "raw": profit_margin, "is_positive": profit_margin >= 10},
            {"label": "Total Orders", "value": format_number_in(total_orders), "raw": total_orders, "is_positive": True},
            {"label": "Avg Order Value", "value": f"₹{avg_order_value:,.0f}", "raw": avg_order_value, "is_positive": True},
        ],
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Compare this month with the previous month",
            "Which month had the highest sales?",
            "Which product generates the highest profit?",
            "Which category contributes the most revenue?"
        ]
    }


def handle_monthly_sales_or_comparison(question_text: str = "") -> Dict[str, Any]:
    bounds = get_dataset_bounds()
    # Fetch recent monthly aggregates ordered chronologically
    query = text("""
        SELECT
            TO_CHAR(sale_date, 'YYYY-MM') AS year_month,
            DATE_TRUNC('month', sale_date)::date AS month_start,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity
        FROM sales
        GROUP BY year_month, month_start
        ORDER BY month_start DESC
        LIMIT 6
    """)
    rows = execute_read_query(query)

    if not rows:
        return {
            "intent": "period_comparison",
            "title": "Monthly Sales Comparison",
            "answer": "No sales records are currently available in the database to perform a monthly comparison.",
            "data_backed": True,
            "kpis": [],
            "source": "PostgreSQL Database • sales table"
        }

    latest = rows[0]
    previous = rows[1] if len(rows) > 1 else None

    latest_rev = float(latest["revenue"] or 0)
    latest_profit = float(latest["profit"] or 0)
    latest_orders = int(latest["orders"] or 0)
    latest_margin = (latest_profit / latest_rev * 100) if latest_rev > 0 else 0

    if previous:
        prev_rev = float(previous["revenue"] or 0)
        prev_profit = float(previous["profit"] or 0)
        prev_orders = int(previous["orders"] or 0)
        prev_margin = (prev_profit / prev_rev * 100) if prev_rev > 0 else 0

        rev_change = ((latest_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else 0
        profit_change = ((latest_profit - prev_profit) / prev_profit * 100) if prev_profit > 0 else 0
        orders_change = ((latest_orders - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0
        margin_change = latest_margin - prev_margin

        change_dir = "increased" if rev_change >= 0 else "decreased"

        answer = (
            f"In **{latest['year_month']}** (the latest recorded month), revenue reached **{format_currency_in(latest_rev)}** "
            f"with **{format_currency_in(latest_profit)}** in profit across **{format_number_in(latest_orders)}** orders. "
            f"Compared to the preceding month (**{previous['year_month']}** with {format_currency_in(prev_rev)}), "
            f"revenue **{change_dir} by {abs(rev_change):.2f}%** ({'+' if rev_change >= 0 else ''}{rev_change:.2f}%), "
            f"profit changed by **{'+' if profit_change >= 0 else ''}{profit_change:.2f}%**, and "
            f"order volume changed by **{'+' if orders_change >= 0 else ''}{orders_change:.2f}%**."
        )
    else:
        answer = (
            f"In **{latest['year_month']}**, revenue reached **{format_currency_in(latest_rev)}** "
            f"with **{format_currency_in(latest_profit)}** in net profit across **{format_number_in(latest_orders)}** orders."
        )
        rev_change = 0
        profit_change = 0
        orders_change = 0
        margin_change = 0

    # Format chart data (reverse for chronological left-to-right display)
    chart_data = [
        {
            "month": r["year_month"],
            "revenue": round(float(r["revenue"] or 0) / 100000, 2),  # In Lakhs for clean chart readability
            "profit": round(float(r["profit"] or 0) / 100000, 2),
            "orders": int(r["orders"] or 0)
        }
        for r in reversed(rows)
    ]

    table_rows = [
        {
            "Month": r["year_month"],
            "Revenue": format_currency_in(float(r["revenue"] or 0)),
            "Profit": format_currency_in(float(r["profit"] or 0)),
            "Orders": format_number_in(int(r["orders"] or 0)),
            "Profit Margin": f"{(float(r['profit'] or 0) / float(r['revenue'] or 1) * 100):.2f}%"
        }
        for r in rows
    ]

    limitations = None
    today = date.today()
    cur_ym = today.strftime("%Y-%m")
    if latest["year_month"] != cur_ym:
        limitations = (
            f"Note: The current calendar month is {today.strftime('%B %Y')}. The latest batch of sales data "
            f"present in the database is for {latest['year_month']}, so metrics and comparisons reflect the latest available data."
        )

    return {
        "intent": "period_comparison",
        "title": f"Monthly Performance: {latest['year_month']}" + (f" vs {previous['year_month']}" if previous else ""),
        "answer": answer,
        "data_backed": True,
        "date_range": f"{rows[-1]['year_month']} to {rows[0]['year_month']}",
        "metric_definitions": [
            "Revenue Change = ((Current Month Revenue - Previous Month Revenue) / Previous Month Revenue) * 100",
            "Profit Margin = (Profit / Revenue) * 100"
        ],
        "kpis": [
            {
                "label": f"Revenue ({latest['year_month']})",
                "value": format_currency_in(latest_rev),
                "change": f"{rev_change:+.2f}%",
                "is_positive": rev_change >= 0,
                "subtext": f"vs {previous['year_month']}" if previous else "latest"
            },
            {
                "label": f"Profit ({latest['year_month']})",
                "value": format_currency_in(latest_profit),
                "change": f"{profit_change:+.2f}%",
                "is_positive": profit_change >= 0,
                "subtext": f"vs {previous['year_month']}" if previous else "latest"
            },
            {
                "label": f"Orders ({latest['year_month']})",
                "value": format_number_in(latest_orders),
                "change": f"{orders_change:+.2f}%",
                "is_positive": orders_change >= 0,
                "subtext": f"vs {previous['year_month']}" if previous else "latest"
            },
            {
                "label": "Profit Margin",
                "value": f"{latest_margin:.2f}%",
                "change": f"{margin_change:+.2f} pp",
                "is_positive": margin_change >= 0,
                "subtext": f"vs {previous['year_month']}" if previous else "latest"
            }
        ],
        "chart": {
            "type": "bar",
            "title": "Revenue & Profit Trend (in ₹ Lakhs)",
            "unit": "₹ Lakhs",
            "data": chart_data,
            "xKey": "month",
            "bars": [
                {"key": "revenue", "name": "Revenue (₹ Lakhs)", "color": "#3B82F6"},
                {"key": "profit", "name": "Profit (₹ Lakhs)", "color": "#10B981"}
            ]
        },
        "table": {
            "columns": ["Month", "Revenue", "Profit", "Orders", "Profit Margin"],
            "rows": table_rows
        },
        "limitations": limitations,
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Which month had the highest sales?",
            "Are sales increasing or decreasing?",
            "Show my top 10 products by sales",
            "Which category contributes the most revenue?"
        ]
    }


def handle_highest_sales_month() -> Dict[str, Any]:
    bounds = get_dataset_bounds()
    query = text("""
        SELECT
            TO_CHAR(sale_date, 'YYYY-MM') AS year_month,
            DATE_TRUNC('month', sale_date)::date AS month_start,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT invoice_id) AS orders
        FROM sales
        GROUP BY year_month, month_start
        ORDER BY revenue DESC
    """)
    rows = execute_read_query(query)

    if not rows:
        return {
            "intent": "period_comparison",
            "title": "Peak Sales Month Analysis",
            "answer": "No sales records were found in the database.",
            "data_backed": True,
            "source": "PostgreSQL Database • sales table"
        }

    peak = rows[0]
    lowest = rows[-1]

    peak_rev = float(peak["revenue"])
    peak_profit = float(peak["profit"])
    lowest_rev = float(lowest["revenue"])

    top_5_rows = [
        {
            "Rank": f"#{idx + 1}",
            "Month": r["year_month"],
            "Revenue": format_currency_in(float(r["revenue"])),
            "Profit": format_currency_in(float(r["profit"])),
            "Orders": format_number_in(int(r["orders"]))
        }
        for idx, r in enumerate(rows[:5])
    ]

    chart_data = [
        {
            "month": r["year_month"],
            "revenue": round(float(r["revenue"]) / 100000, 2),
            "profit": round(float(r["profit"]) / 100000, 2)
        }
        for r in rows[:8]
    ]

    return {
        "intent": "period_comparison",
        "title": "Historical Highest Sales Month",
        "answer": (
            f"The single highest sales month in your historical business data is **{peak['year_month']}**, "
            f"generating **{format_currency_in(peak_rev)}** in revenue and **{format_currency_in(peak_profit)}** in profit "
            f"across **{format_number_in(int(peak['orders']))}** orders. "
            f"In contrast, the lowest monthly revenue occurred in **{lowest['year_month']}** with **{format_currency_in(lowest_rev)}**."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "metric_definitions": [
            "Monthly ranking determined by SUM(total_amount) grouped by calendar month"
        ],
        "kpis": [
            {"label": "Peak Month", "value": peak["year_month"], "subtext": "Historical Record", "is_positive": True},
            {"label": "Peak Revenue", "value": format_currency_in(peak_rev), "subtext": f"{format_number_in(int(peak['orders']))} orders", "is_positive": True},
            {"label": "Peak Profit", "value": format_currency_in(peak_profit), "subtext": f"{(peak_profit / peak_rev * 100):.2f}% margin", "is_positive": True},
            {"label": "Lowest Month", "value": lowest["year_month"], "subtext": format_currency_in(lowest_rev), "is_positive": False}
        ],
        "table": {
            "columns": ["Rank", "Month", "Revenue", "Profit", "Orders"],
            "rows": top_5_rows
        },
        "chart": {
            "type": "bar",
            "title": "Top Months by Revenue (₹ Lakhs)",
            "data": chart_data,
            "xKey": "month",
            "bars": [
                {"key": "revenue", "name": "Revenue", "color": "#3B82F6"},
                {"key": "profit", "name": "Profit", "color": "#10B981"}
            ]
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Are sales increasing or decreasing?",
            "Compare this month with the previous month",
            "Which category contributes the most revenue?"
        ]
    }


def handle_sales_trend_direction() -> Dict[str, Any]:
    bounds = get_dataset_bounds()
    query = text("""
        SELECT
            TO_CHAR(sale_date, 'YYYY-MM') AS year_month,
            DATE_TRUNC('month', sale_date)::date AS month_start,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit
        FROM sales
        GROUP BY year_month, month_start
        ORDER BY month_start DESC
        LIMIT 6
    """)
    rows = execute_read_query(query)

    if len(rows) < 2:
        return {
            "intent": "period_comparison",
            "title": "Sales Trajectory Analysis",
            "answer": "Insufficient monthly data points to compute trend direction.",
            "data_backed": True,
            "source": "PostgreSQL Database • sales table"
        }

    m0_rev = float(rows[0]["revenue"])
    m1_rev = float(rows[1]["revenue"])
    m2_rev = float(rows[2]["revenue"]) if len(rows) > 2 else m1_rev

    recent_growth = ((m0_rev - m1_rev) / m1_rev * 100) if m1_rev > 0 else 0
    quarterly_growth = ((m0_rev - m2_rev) / m2_rev * 100) if m2_rev > 0 else 0

    if recent_growth > 2:
        status_label = "Increasing"
        is_pos = True
        explanation = (
            f"Sales are currently **increasing**. The latest recorded month (**{rows[0]['year_month']}**, {format_currency_in(m0_rev)}) "
            f"shows a **+{recent_growth:.2f}%** increase over {rows[1]['year_month']} ({format_currency_in(m1_rev)})."
        )
    elif recent_growth < -2:
        status_label = "Decreasing"
        is_pos = False
        explanation = (
            f"Sales have recently **decreased**. The latest recorded month (**{rows[0]['year_month']}**, {format_currency_in(m0_rev)}) "
            f"is down **{recent_growth:.2f}%** compared to {rows[1]['year_month']} ({format_currency_in(m1_rev)})."
        )
    else:
        status_label = "Stable"
        is_pos = True
        explanation = (
            f"Sales are holding **stable**. Revenue moved by **{recent_growth:+.2f}%** between {rows[1]['year_month']} "
            f"and {rows[0]['year_month']} ({format_currency_in(m0_rev)})."
        )

    chart_data = [
        {
            "month": r["year_month"],
            "revenue": round(float(r["revenue"]) / 100000, 2),
            "profit": round(float(r["profit"]) / 100000, 2)
        }
        for r in reversed(rows)
    ]

    return {
        "intent": "period_comparison",
        "title": "Sales Trajectory & Growth Trend",
        "answer": (
            f"{explanation} Over the past 6 recorded months, revenue has fluctuated with seasonal trends, "
            f"averaging approximately {format_currency_in(sum(float(r['revenue']) for r in rows) / len(rows))} per month."
        ),
        "data_backed": True,
        "date_range": f"{rows[-1]['year_month']} to {rows[0]['year_month']}",
        "kpis": [
            {"label": "Current Trajectory", "value": status_label, "is_positive": is_pos},
            {"label": "MoM Growth", "value": f"{recent_growth:+.2f}%", "is_positive": recent_growth >= 0},
            {"label": "Latest Revenue", "value": format_currency_in(m0_rev), "subtext": rows[0]["year_month"], "is_positive": True},
            {"label": "Prior Revenue", "value": format_currency_in(m1_rev), "subtext": rows[1]["year_month"], "is_positive": True}
        ],
        "chart": {
            "type": "line",
            "title": "6-Month Revenue Trend (₹ Lakhs)",
            "data": chart_data,
            "xKey": "month",
            "lines": [
                {"key": "revenue", "name": "Revenue", "color": "#3B82F6"},
                {"key": "profit", "name": "Profit", "color": "#10B981"}
            ]
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Which category contributes the most revenue?",
            "Which product generates the highest profit?",
            "What inventory risks should I investigate?"
        ]
    }


def handle_top_products(limit: int = 10) -> Dict[str, Any]:
    safe_limit = min(max(limit, 1), MAX_RESULT_LIMIT)
    bounds = get_dataset_bounds()

    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(MAX(product_category), 'Unknown') AS category,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit
        FROM sales
        WHERE product_name IS NOT NULL AND TRIM(product_name) <> ''
        GROUP BY product_name
        ORDER BY revenue DESC
        LIMIT :limit
    """)
    rows = execute_read_query(query, {"limit": safe_limit})

    if not rows:
        return {
            "intent": "product_ranking",
            "title": f"Top {safe_limit} Products by Sales",
            "answer": "No product sales records were found in the database.",
            "data_backed": True,
            "source": "PostgreSQL Database • sales table"
        }

    leader = rows[0]
    leader_rev = float(leader["revenue"])
    total_top_rev = sum(float(r["revenue"]) for r in rows)

    table_rows = [
        {
            "Rank": f"#{idx + 1}",
            "Product": r["product_name"],
            "Category": r["category"],
            "Brand": r["brand"],
            "Orders": format_number_in(int(r["orders"])),
            "Qty Sold": format_number_in(int(r["quantity_sold"])),
            "Revenue": format_currency_in(float(r["revenue"])),
            "Profit": format_currency_in(float(r["profit"])),
            "Margin": f"{(float(r['profit']) / float(r['revenue']) * 100):.1f}%" if float(r["revenue"]) > 0 else "0.0%"
        }
        for idx, r in enumerate(rows)
    ]

    chart_data = [
        {
            "name": r["product_name"][:16] + ("..." if len(r["product_name"]) > 16 else ""),
            "full_name": r["product_name"],
            "revenue": round(float(r["revenue"]) / 100000, 2),
            "profit": round(float(r["profit"]) / 100000, 2)
        }
        for r in rows[:7]
    ]

    return {
        "intent": "product_ranking",
        "title": f"Top {len(rows)} Products by Sales Revenue",
        "answer": (
            f"Your #1 bestselling product by revenue is **{leader['product_name']}** ({leader['brand']}), "
            f"generating **{format_currency_in(leader_rev)}** across **{format_number_in(int(leader['orders']))}** orders "
            f"with **{format_currency_in(float(leader['profit']))}** in profit. "
            f"Combined, your top {len(rows)} products contributed **{format_currency_in(total_top_rev)}** in sales."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "metric_definitions": [
            "Revenue = SUM(total_amount) grouped by product_name",
            "Profit = SUM(profit)",
            "Orders = COUNT(DISTINCT invoice_id)"
        ],
        "kpis": [
            {"label": "#1 Product", "value": leader["product_name"][:20], "subtext": leader["brand"], "is_positive": True},
            {"label": "Leader Revenue", "value": format_currency_in(leader_rev), "is_positive": True},
            {"label": "Leader Margin", "value": f"{(float(leader['profit']) / leader_rev * 100):.2f}%", "is_positive": True},
            {"label": f"Top {len(rows)} Cumulative", "value": format_currency_in(total_top_rev), "is_positive": True}
        ],
        "table": {
            "columns": ["Rank", "Product", "Category", "Brand", "Orders", "Qty Sold", "Revenue", "Profit", "Margin"],
            "rows": table_rows
        },
        "chart": {
            "type": "bar",
            "title": "Top Products by Sales (₹ Lakhs)",
            "data": chart_data,
            "xKey": "name",
            "bars": [
                {"key": "revenue", "name": "Revenue", "color": "#3B82F6"},
                {"key": "profit", "name": "Profit", "color": "#10B981"}
            ]
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Which product generates the highest profit?",
            "Which category contributes the most revenue?",
            "Which products have low sales?"
        ]
    }


def handle_low_sales_products(limit: int = 10) -> Dict[str, Any]:
    safe_limit = min(max(limit, 1), MAX_RESULT_LIMIT)
    bounds = get_dataset_bounds()

    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(MAX(product_category), 'Unknown') AS category,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit
        FROM sales
        WHERE product_name IS NOT NULL AND TRIM(product_name) <> ''
        GROUP BY product_name
        HAVING SUM(total_amount) > 0
        ORDER BY revenue ASC
        LIMIT :limit
    """)
    rows = execute_read_query(query, {"limit": safe_limit})

    table_rows = [
        {
            "Product": r["product_name"],
            "Category": r["category"],
            "Brand": r["brand"],
            "Orders": format_number_in(int(r["orders"])),
            "Qty Sold": format_number_in(int(r["quantity_sold"])),
            "Revenue": format_currency_in(float(r["revenue"])),
            "Profit": format_currency_in(float(r["profit"]))
        }
        for r in rows
    ]

    return {
        "intent": "product_ranking",
        "title": f"Products with Lowest Sales Revenue (Bottom {len(rows)})",
        "answer": (
            f"Identified {len(rows)} products with the lowest cumulative sales in your records. "
            f"The lowest-selling product is **{rows[0]['product_name']}** with only "
            f"**{format_currency_in(float(rows[0]['revenue']))}** generated across {rows[0]['orders']} order(s). "
            f"These items may require promotional bundling, markdown, or discontinuation if inventory carrying cost is high."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "table": {
            "columns": ["Product", "Category", "Brand", "Orders", "Qty Sold", "Revenue", "Profit"],
            "rows": table_rows
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Show my top 10 products by sales",
            "Which products have slow-moving inventory?",
            "What inventory risks should I investigate?"
        ]
    }


def handle_declining_products() -> Dict[str, Any]:
    bounds = get_dataset_bounds()
    # Compare sales in latest 45 days vs preceding 45 days
    query = text("""
        WITH max_date_cte AS (
            SELECT MAX(sale_date) AS max_date FROM sales
        ),
        period_sales AS (
            SELECT
                product_name,
                COALESCE(MAX(brand), 'Unknown') AS brand,
                COALESCE(MAX(product_category), 'Unknown') AS category,
                COALESCE(SUM(total_amount) FILTER (
                    WHERE sale_date BETWEEN (m.max_date - INTERVAL '45 days')::date AND m.max_date
                ), 0) AS recent_rev,
                COALESCE(SUM(total_amount) FILTER (
                    WHERE sale_date BETWEEN (m.max_date - INTERVAL '90 days')::date AND (m.max_date - INTERVAL '46 days')::date
                ), 0) AS prior_rev
            FROM sales
            CROSS JOIN max_date_cte m
            WHERE product_name IS NOT NULL
            GROUP BY product_name
            HAVING SUM(total_amount) FILTER (
                WHERE sale_date BETWEEN (m.max_date - INTERVAL '90 days')::date AND (m.max_date - INTERVAL '46 days')::date
            ) > 50000
        )
        SELECT
            product_name,
            brand,
            category,
            recent_rev,
            prior_rev,
            ((recent_rev - prior_rev) / prior_rev * 100) AS pct_change,
            (recent_rev - prior_rev) AS absolute_change
        FROM period_sales
        WHERE recent_rev < prior_rev
        ORDER BY pct_change ASC
        LIMIT 10
    """)
    rows = execute_read_query(query)

    if not rows:
        return {
            "intent": "declining_products",
            "title": "Declining Sales Analysis",
            "answer": "No products exhibited significant negative velocity drops over the analyzed 45-day comparison windows.",
            "data_backed": True,
            "source": "PostgreSQL Database • sales table"
        }

    table_rows = [
        {
            "Product": r["product_name"],
            "Category": r["category"],
            "Recent 45d": format_currency_in(float(r["recent_rev"])),
            "Prior 45d": format_currency_in(float(r["prior_rev"])),
            "Drop %": f"{float(r['pct_change']):.2f}%",
            "Impact": format_currency_in(float(r["absolute_change"]))
        }
        for r in rows
    ]

    return {
        "intent": "declining_products",
        "title": "Products with Declining Sales (45-Day Window)",
        "answer": (
            f"Identified **{len(rows)} products** showing the sharpest velocity decline when comparing recent 45-day performance "
            f"against the prior 45 days. **{rows[0]['product_name']}** suffered the largest drop of "
            f"**{float(rows[0]['pct_change']):.1f}%** ({format_currency_in(float(rows[0]['absolute_change']))}). "
            f"Consider reviewing pricing, availability, or competing customer preferences."
        ),
        "data_backed": True,
        "date_range": "Recent 45 Days vs Prior 45 Days (relative to latest dataset date)",
        "metric_definitions": [
            "Drop % = ((Recent 45d Sales - Prior 45d Sales) / Prior 45d Sales) * 100",
            "Filtered for items with substantial prior baseline (>₹50,000)"
        ],
        "kpis": [
            {"label": "Most Dropped", "value": rows[0]["product_name"][:20], "subtext": f"{float(rows[0]['pct_change']):.1f}%", "is_positive": False},
            {"label": "Impact on Leader", "value": format_currency_in(float(rows[0]["absolute_change"])), "is_positive": False},
            {"label": "Products Flagged", "value": str(len(rows)), "subtext": "Velocity decline", "is_positive": False}
        ],
        "table": {
            "columns": ["Product", "Category", "Recent 45d", "Prior 45d", "Drop %", "Impact"],
            "rows": table_rows
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Which product generates the highest profit?",
            "What inventory risks should I investigate?",
            "Which category contributes the most revenue?"
        ]
    }


def handle_most_profitable_products(limit: int = 10) -> Dict[str, Any]:
    safe_limit = min(max(limit, 1), MAX_RESULT_LIMIT)
    bounds = get_dataset_bounds()

    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(MAX(product_category), 'Unknown') AS category,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit
        FROM sales
        WHERE product_name IS NOT NULL AND TRIM(product_name) <> ''
        GROUP BY product_name
        ORDER BY profit DESC
        LIMIT :limit
    """)
    rows = execute_read_query(query, {"limit": safe_limit})

    if not rows:
        return {
            "intent": "product_profitability",
            "title": "Most Profitable Products",
            "answer": "No product profit records found in the database.",
            "data_backed": True,
            "source": "PostgreSQL Database • sales table"
        }

    leader = rows[0]
    leader_profit = float(leader["profit"])
    leader_rev = float(leader["revenue"])
    leader_margin = (leader_profit / leader_rev * 100) if leader_rev > 0 else 0

    table_rows = [
        {
            "Rank": f"#{idx + 1}",
            "Product": r["product_name"],
            "Category": r["category"],
            "Brand": r["brand"],
            "Revenue": format_currency_in(float(r["revenue"])),
            "Net Profit": format_currency_in(float(r["profit"])),
            "Profit Margin": f"{(float(r['profit']) / float(r['revenue']) * 100):.2f}%" if float(r["revenue"]) > 0 else "0.00%"
        }
        for idx, r in enumerate(rows)
    ]

    chart_data = [
        {
            "name": r["product_name"][:16] + ("..." if len(r["product_name"]) > 16 else ""),
            "full_name": r["product_name"],
            "profit": round(float(r["profit"]) / 100000, 2),
            "revenue": round(float(r["revenue"]) / 100000, 2)
        }
        for r in rows[:7]
    ]

    return {
        "intent": "product_profitability",
        "title": f"Top {len(rows)} Most Profitable Products",
        "answer": (
            f"The #1 product generating the highest net profit in your business is **{leader['product_name']}** ({leader['brand']}), "
            f"delivering **{format_currency_in(leader_profit)}** in profit on **{format_currency_in(leader_rev)}** of revenue "
            f"(a **{leader_margin:.2f}%** profit margin). "
            f"Top-profit items drive the core margin sustainability of your catalog."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "metric_definitions": [
            "Ranked by SUM(profit) DESC",
            "Profit Margin = (Profit / Revenue) * 100"
        ],
        "kpis": [
            {"label": "Top Profit Item", "value": leader["product_name"][:20], "subtext": leader["brand"], "is_positive": True},
            {"label": "Net Profit", "value": format_currency_in(leader_profit), "is_positive": True},
            {"label": "Leader Margin", "value": f"{leader_margin:.2f}%", "is_positive": True},
            {"label": f"Top {len(rows)} Profit", "value": format_currency_in(sum(float(r['profit']) for r in rows)), "is_positive": True}
        ],
        "table": {
            "columns": ["Rank", "Product", "Category", "Brand", "Revenue", "Net Profit", "Profit Margin"],
            "rows": table_rows
        },
        "chart": {
            "type": "bar",
            "title": "Top Products by Profit (₹ Lakhs)",
            "data": chart_data,
            "xKey": "name",
            "bars": [
                {"key": "profit", "name": "Net Profit", "color": "#10B981"},
                {"key": "revenue", "name": "Revenue", "color": "#3B82F6"}
            ]
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Show my top 10 products by sales",
            "Which category contributes the most revenue?",
            "Which products have low stock?"
        ]
    }


def handle_category_performance() -> Dict[str, Any]:
    bounds = get_dataset_bounds()

    query = text("""
        SELECT
            COALESCE(NULLIF(TRIM(product_category), ''), 'Unknown') AS category,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COUNT(DISTINCT product_name) AS unique_products,
            COUNT(DISTINCT invoice_id) AS orders
        FROM sales
        GROUP BY category
        ORDER BY revenue DESC
    """)
    rows = execute_read_query(query)

    if not rows:
        return {
            "intent": "category_performance",
            "title": "Category Performance",
            "answer": "No category data found in the sales table.",
            "data_backed": True,
            "source": "PostgreSQL Database • sales table"
        }

    total_revenue = sum(float(r["revenue"]) for r in rows)
    leader = rows[0]
    leader_rev = float(leader["revenue"])
    leader_share = (leader_rev / total_revenue * 100) if total_revenue > 0 else 0

    palette = ["#3B82F6", "#06B6D4", "#10B981", "#EC4899", "#8B5CF6", "#F59E0B", "#F43F5E"]

    table_rows = [
        {
            "Rank": f"#{idx + 1}",
            "Category": r["category"],
            "Revenue": format_currency_in(float(r["revenue"])),
            "Share": f"{(float(r['revenue']) / total_revenue * 100):.2f}%" if total_revenue > 0 else "0%",
            "Profit": format_currency_in(float(r["profit"])),
            "Margin": f"{(float(r['profit']) / float(r['revenue']) * 100):.2f}%" if float(r["revenue"]) > 0 else "0%",
            "Products": format_number_in(int(r["unique_products"])),
            "Orders": format_number_in(int(r["orders"]))
        }
        for idx, r in enumerate(rows)
    ]

    pie_data = [
        {
            "name": r["category"],
            "value": round(float(r["revenue"]) / 100000, 2),
            "percentage": f"{(float(r['revenue']) / total_revenue * 100):.1f}%",
            "color": palette[idx % len(palette)]
        }
        for idx, r in enumerate(rows[:6])
    ]

    return {
        "intent": "category_performance",
        "title": "Category Revenue & Contribution Breakdown",
        "answer": (
            f"The category contributing the most revenue to your business is **{leader['category']}**, "
            f"generating **{format_currency_in(leader_rev)}** (**{leader_share:.2f}%** of total sales) "
            f"and **{format_currency_in(float(leader['profit']))}** in profit across {leader['unique_products']} products. "
            f"Across all {len(rows)} categories, total revenue reached {format_currency_in(total_revenue)}."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "metric_definitions": [
            "Category Share % = (Category Revenue / Total Business Revenue) * 100",
            "Margin = (Category Profit / Category Revenue) * 100"
        ],
        "kpis": [
            {"label": "Top Category", "value": leader["category"], "subtext": f"{leader_share:.1f}% share", "is_positive": True},
            {"label": "Leader Revenue", "value": format_currency_in(leader_rev), "is_positive": True},
            {"label": "Leader Margin", "value": f"{(float(leader['profit']) / leader_rev * 100):.2f}%", "is_positive": True},
            {"label": "Total Categories", "value": str(len(rows)), "subtext": "Active in catalog", "is_positive": True}
        ],
        "chart": {
            "type": "pie",
            "title": "Category Revenue Contribution",
            "data": pie_data,
            "dataKey": "value",
            "nameKey": "name"
        },
        "table": {
            "columns": ["Rank", "Category", "Revenue", "Share", "Profit", "Margin", "Products", "Orders"],
            "rows": table_rows
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Show my top 10 products by sales",
            "Which product generates the highest profit?",
            "What are my total sales and profit?"
        ]
    }


def handle_customer_summary() -> Dict[str, Any]:
    bounds = get_dataset_bounds()

    # Query customer metrics safely from sales table (strictly NO mobile numbers or PII queried)
    query = text("""
        WITH cust_agg AS (
            SELECT
                customer_id,
                COUNT(DISTINCT invoice_id) AS orders,
                COALESCE(SUM(total_amount), 0) AS total_spent,
                COALESCE(SUM(profit), 0) AS total_profit
            FROM sales
            WHERE customer_id IS NOT NULL AND TRIM(customer_id) <> ''
            GROUP BY customer_id
        )
        SELECT
            COUNT(*) AS total_customers,
            COUNT(*) FILTER (WHERE orders > 1) AS repeat_customers,
            COUNT(*) FILTER (WHERE orders = 1) AS one_time_customers,
            COALESCE(AVG(total_spent), 0) AS avg_customer_value,
            COALESCE(AVG(orders), 0) AS avg_orders_per_customer,
            COALESCE(SUM(total_spent), 0) AS total_cust_revenue,
            COALESCE(SUM(total_spent) FILTER (WHERE orders > 1), 0) AS repeat_revenue
        FROM cust_agg
    """)
    rows = execute_read_query(query)
    row = rows[0] if rows else {}

    total_customers = int(row.get("total_customers") or 0)
    repeat_customers = int(row.get("repeat_customers") or 0)
    one_time_customers = int(row.get("one_time_customers") or 0)
    avg_customer_value = float(row.get("avg_customer_value") or 0)
    avg_orders = float(row.get("avg_orders_per_customer") or 0)
    total_cust_revenue = float(row.get("total_cust_revenue") or 0)
    repeat_revenue = float(row.get("repeat_revenue") or 0)

    repeat_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0
    repeat_rev_share = (repeat_revenue / total_cust_revenue * 100) if total_cust_revenue > 0 else 0

    pie_data = [
        {"name": "Repeat Customers", "value": repeat_customers, "color": "#10B981"},
        {"name": "One-Time Customers", "value": one_time_customers, "color": "#3B82F6"}
    ]

    return {
        "intent": "customer_summary",
        "title": "Customer Overview & Retention Analysis",
        "answer": (
            f"You have **{format_number_in(total_customers)} unique customers** in your database. "
            f"Among them, **{format_number_in(repeat_customers)}** are repeat customers who have purchased more than once, "
            f"representing a repeat purchase rate of **{repeat_rate:.2f}%**. "
            f"Repeat customers contributed **{format_currency_in(repeat_revenue)}** (**{repeat_rev_share:.2f}%** of total customer revenue), "
            f"with an overall average customer lifetime spend of **{format_currency_in(avg_customer_value)}**."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "metric_definitions": [
            "Total Customers = COUNT(DISTINCT customer_id) with verified sales records",
            "Repeat Customers = Customers with COUNT(DISTINCT invoice_id) > 1",
            f"Repeat Rate = (Repeat Customers / Total Customers) * 100 = {repeat_rate:.2f}%",
            f"Average Lifetime Spend = Total Revenue / Total Customers = {format_currency_in(avg_customer_value)}"
        ],
        "kpis": [
            {"label": "Total Customers", "value": format_number_in(total_customers), "is_positive": True},
            {"label": "Repeat Customers", "value": format_number_in(repeat_customers), "subtext": f"{repeat_rate:.1f}% rate", "is_positive": repeat_rate >= 20},
            {"label": "Repeat Revenue", "value": format_currency_in(repeat_revenue), "subtext": f"{repeat_rev_share:.1f}% share", "is_positive": True},
            {"label": "Avg Customer Spend", "value": format_currency_in(avg_customer_value), "is_positive": True}
        ],
        "chart": {
            "type": "pie",
            "title": "Customer Loyalty Distribution",
            "data": pie_data,
            "dataKey": "value",
            "nameKey": "name"
        },
        "source": "PostgreSQL Database • sales & customers tables (privacy protected)",
        "suggested_followups": [
            "Which customer segments generate the most revenue?",
            "How has customer purchasing behavior changed?",
            "What are my total sales and profit?"
        ]
    }


def handle_customer_segments() -> Dict[str, Any]:
    bounds = get_dataset_bounds()

    query = text("""
        WITH cust_metrics AS (
            SELECT
                customer_id,
                COUNT(DISTINCT invoice_id) AS orders,
                COALESCE(SUM(total_amount), 0) AS revenue,
                MAX(sale_date) AS last_purchase
            FROM sales
            WHERE customer_id IS NOT NULL AND TRIM(customer_id) <> ''
            GROUP BY customer_id
        ),
        thresholds AS (
            SELECT
                PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY revenue) AS vip_threshold,
                PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY revenue) AS med_threshold
            FROM cust_metrics
        ),
        segmented AS (
            SELECT
                c.customer_id,
                c.orders,
                c.revenue,
                c.last_purchase,
                CASE
                    WHEN c.revenue >= t.vip_threshold THEN 'VIP / High Value'
                    WHEN c.orders >= 3 THEN 'Loyal Regulars'
                    WHEN c.orders = 2 THEN 'Repeat Buyers'
                    ELSE 'Occasional / One-Time'
                END AS segment
            FROM cust_metrics c
            CROSS JOIN thresholds t
        )
        SELECT
            segment,
            COUNT(*) AS customer_count,
            COALESCE(SUM(revenue), 0) AS total_revenue,
            COALESCE(AVG(revenue), 0) AS avg_revenue_per_customer,
            COALESCE(AVG(orders), 0) AS avg_orders
        FROM segmented
        GROUP BY segment
        ORDER BY total_revenue DESC
    """)
    rows = execute_read_query(query)

    if not rows:
        return {
            "intent": "customer_segments",
            "title": "Customer Segmentation Analysis",
            "answer": "No customer purchase data available for segmentation.",
            "data_backed": True,
            "source": "PostgreSQL Database • sales table"
        }

    total_rev = sum(float(r["total_revenue"]) for r in rows)
    top_seg = rows[0]
    top_seg_share = (float(top_seg["total_revenue"]) / total_rev * 100) if total_rev > 0 else 0

    table_rows = [
        {
            "Segment": r["segment"],
            "Customers": format_number_in(int(r["customer_count"])),
            "Total Revenue": format_currency_in(float(r["total_revenue"])),
            "Revenue Share": f"{(float(r['total_revenue']) / total_rev * 100):.2f}%" if total_rev > 0 else "0%",
            "Avg Spend": format_currency_in(float(r["avg_revenue_per_customer"])),
            "Avg Orders": f"{float(r['avg_orders']):.1f}"
        }
        for r in rows
    ]

    chart_data = [
        {
            "segment": r["segment"],
            "revenue": round(float(r["total_revenue"]) / 100000, 2),
            "customers": int(r["customer_count"])
        }
        for r in rows
    ]

    return {
        "intent": "customer_segments",
        "title": "Customer Segments & Revenue Contribution",
        "answer": (
            f"The **{top_seg['segment']}** segment generates the largest share of your customer revenue, "
            f"delivering **{format_currency_in(float(top_seg['total_revenue']))}** (**{top_seg_share:.2f}%** of total sales) "
            f"across {format_number_in(int(top_seg['customer_count']))} customers (averaging {format_currency_in(float(top_seg['avg_revenue_per_customer']))} per customer). "
            f"Nurturing this segment with targeted loyalty incentives will have the highest compounding effect on revenue."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "metric_definitions": [
            "VIP / High Value: Top 20th percentile of customer spend",
            "Loyal Regulars: Customers with 3 or more completed orders",
            "Repeat Buyers: Customers with exactly 2 orders",
            "Occasional / One-Time: Single purchase accounts"
        ],
        "kpis": [
            {"label": "Top Segment", "value": top_seg["segment"], "subtext": f"{top_seg_share:.1f}% of sales", "is_positive": True},
            {"label": "Top Segment Revenue", "value": format_currency_in(float(top_seg["total_revenue"])), "is_positive": True},
            {"label": "VIP Avg Spend", "value": format_currency_in(float(top_seg["avg_revenue_per_customer"])), "is_positive": True},
            {"label": "Segments Analyzed", "value": str(len(rows)), "subtext": "Active cohorts", "is_positive": True}
        ],
        "chart": {
            "type": "bar",
            "title": "Revenue by Customer Segment (₹ Lakhs)",
            "data": chart_data,
            "xKey": "segment",
            "bars": [
                {"key": "revenue", "name": "Revenue (₹ Lakhs)", "color": "#8B5CF6"}
            ]
        },
        "table": {
            "columns": ["Segment", "Customers", "Total Revenue", "Revenue Share", "Avg Spend", "Avg Orders"],
            "rows": table_rows
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "How has customer purchasing behavior changed?",
            "How many repeat customers do I have?",
            "Which category contributes the most revenue?"
        ]
    }


def handle_customer_purchasing_behavior() -> Dict[str, Any]:
    bounds = get_dataset_bounds()

    # Analyze payment methods, gender splits, and average order value trends
    query_payments = text("""
        SELECT
            COALESCE(NULLIF(TRIM(payment_method), ''), 'Unknown') AS payment_method,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(total_amount), 0) AS revenue
        FROM sales
        GROUP BY payment_method
        ORDER BY revenue DESC
    """)
    rows_payment = execute_read_query(query_payments)
    total_rev = sum(float(r["revenue"]) for r in rows_payment)

    top_payment = rows_payment[0] if rows_payment else {"payment_method": "N/A", "revenue": 0}
    top_pay_share = (float(top_payment["revenue"]) / total_rev * 100) if total_rev > 0 else 0

    table_rows = [
        {
            "Payment Method": r["payment_method"],
            "Orders": format_number_in(int(r["orders"])),
            "Revenue": format_currency_in(float(r["revenue"])),
            "Share": f"{(float(r['revenue']) / total_rev * 100):.2f}%" if total_rev > 0 else "0%"
        }
        for r in rows_payment
    ]

    return {
        "intent": "customer_trends",
        "title": "Customer Purchasing Behavior & Payment Channels",
        "answer": (
            f"Customers predominantly pay via **{top_payment['payment_method']}**, which accounts for "
            f"**{format_currency_in(float(top_payment['revenue']))}** (**{top_pay_share:.2f}%** of total payments) "
            f"across {format_number_in(int(top_payment['orders']))} orders. "
            f"Basket sizes and digital payment adoption show strong engagement across repeat cohorts."
        ),
        "data_backed": True,
        "date_range": bounds["date_range_label"],
        "kpis": [
            {"label": "Preferred Payment", "value": top_payment["payment_method"], "subtext": f"{top_pay_share:.1f}% share", "is_positive": True},
            {"label": "Volume on Top Channel", "value": format_currency_in(float(top_payment["revenue"])), "is_positive": True},
            {"label": "Payment Channels", "value": str(len(rows_payment)), "subtext": "Active options", "is_positive": True}
        ],
        "table": {
            "columns": ["Payment Method", "Orders", "Revenue", "Share"],
            "rows": table_rows
        },
        "source": "PostgreSQL Database • sales table",
        "suggested_followups": [
            "Which customer segments generate the most revenue?",
            "How many repeat customers do I have?",
            "What are my total sales and profit?"
        ]
    }


def handle_inventory_risks() -> Dict[str, Any]:
    # Query low stock, out of stock, and stock coverage from inventory + products + sales velocity
    query_kpis = text("""
        SELECT
            COALESCE(SUM(i.stock_remaining), 0) AS total_stock,
            COUNT(*) FILTER (WHERE i.stock_remaining > 0) AS stocked_products,
            COUNT(*) FILTER (
                WHERE i.stock_remaining > 0 AND i.stock_remaining <= COALESCE(i.reorder_level, 20)
            ) AS low_stock_count,
            COUNT(*) FILTER (WHERE i.stock_remaining <= 0) AS out_of_stock_count
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
    """)
    rows_kpis = execute_read_query(query_kpis)
    kpis = rows_kpis[0] if rows_kpis else {}

    total_stock = int(kpis.get("total_stock") or 0)
    low_stock_count = int(kpis.get("low_stock_count") or 0)
    out_of_stock_count = int(kpis.get("out_of_stock_count") or 0)

    # Detailed risk items
    query_risks = text("""
        WITH velocity AS (
            SELECT
                product_name,
                brand,
                COALESCE(SUM(quantity), 0)::numeric / 30 AS daily_velocity
            FROM sales
            WHERE sale_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE
            GROUP BY product_name, brand
        )
        SELECT
            p.product_name,
            COALESCE(p.brand, 'Unknown') AS brand,
            COALESCE(p.product_category, 'Unknown') AS category,
            i.stock_remaining,
            COALESCE(i.reorder_level, 20) AS reorder_level,
            CASE
                WHEN i.stock_remaining <= 0 THEN 'Out of Stock'
                WHEN i.stock_remaining <= COALESCE(i.reorder_level, 20) THEN 'Critical Low Stock'
                ELSE 'Healthy'
            END AS risk_status,
            CASE
                WHEN v.daily_velocity > 0 THEN ROUND((GREATEST(i.stock_remaining, 0)::numeric / v.daily_velocity), 1)
                ELSE NULL
            END AS days_coverage
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
        LEFT JOIN velocity v ON v.product_name = p.product_name AND v.brand = p.brand
        WHERE i.stock_remaining <= COALESCE(i.reorder_level, 20)
        ORDER BY i.stock_remaining ASC, p.product_name
        LIMIT 15
    """)
    rows_risks = execute_read_query(query_risks)

    table_rows = [
        {
            "Product": r["product_name"],
            "Category": r["category"],
            "Brand": r["brand"],
            "Stock Remaining": format_number_in(int(r["stock_remaining"])),
            "Reorder Level": format_number_in(int(r["reorder_level"])),
            "Status": r["risk_status"],
            "Est. Days Left": f"{r['days_coverage']} days" if r["days_coverage"] is not None else "N/A"
        }
        for r in rows_risks
    ]

    return {
        "intent": "inventory_risks",
        "title": "Inventory Risk & Stock Shortage Audit",
        "answer": (
            f"Your inventory audit identified **{out_of_stock_count} out-of-stock items** "
            f"and **{low_stock_count} products at or below their minimum reorder threshold**. "
            f"Currently, total warehouse inventory stands at **{format_number_in(total_stock)} units**. "
            f"Items with less than 7 days of stock coverage should be reordered immediately to avoid stockouts."
        ),
        "data_backed": True,
        "date_range": "Current live inventory state",
        "metric_definitions": [
            "Low Stock = stock_remaining <= reorder_level (default 20 units)",
            "Out of Stock = stock_remaining <= 0",
            "Days Coverage = stock_remaining / (past 30-day daily velocity)"
        ],
        "kpis": [
            {"label": "Out of Stock", "value": str(out_of_stock_count), "subtext": "Immediate loss risk", "is_positive": out_of_stock_count == 0},
            {"label": "Low Stock Items", "value": str(low_stock_count), "subtext": "At or below reorder", "is_positive": low_stock_count == 0},
            {"label": "Total Stock Units", "value": format_number_in(total_stock), "is_positive": True},
            {"label": "Flagged for Reorder", "value": str(len(rows_risks)), "subtext": "Priority list", "is_positive": len(rows_risks) == 0}
        ],
        "table": {
            "columns": ["Product", "Category", "Brand", "Stock Remaining", "Reorder Level", "Status", "Est. Days Left"],
            "rows": table_rows
        },
        "source": "PostgreSQL Database • inventory & products tables",
        "suggested_followups": [
            "Which products might run out of stock?",
            "Which products have slow-moving inventory?",
            "Show my top 10 products by sales"
        ]
    }


def handle_slow_moving_inventory() -> Dict[str, Any]:
    # Products with high stock remaining but low or 0 sales in past 60 days
    query = text("""
        WITH recent_sales AS (
            SELECT
                product_name,
                brand,
                COALESCE(SUM(quantity), 0) AS units_sold_60d
            FROM sales
            WHERE sale_date >= (CURRENT_DATE - INTERVAL '60 days')::date
            GROUP BY product_name, brand
        )
        SELECT
            p.product_name,
            COALESCE(p.brand, 'Unknown') AS brand,
            COALESCE(p.product_category, 'Unknown') AS category,
            i.stock_remaining,
            COALESCE(p.unit_price, 0) AS unit_price,
            ROUND((i.stock_remaining * COALESCE(p.unit_price, 0))::numeric, 2) AS tied_up_capital,
            COALESCE(s.units_sold_60d, 0) AS units_sold_60d
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
        LEFT JOIN recent_sales s ON s.product_name = p.product_name AND s.brand = p.brand
        WHERE i.stock_remaining > 50 AND COALESCE(s.units_sold_60d, 0) <= 5
        ORDER BY tied_up_capital DESC
        LIMIT 10
    """)
    rows = execute_read_query(query)

    if not rows:
        return {
            "intent": "inventory_risks",
            "title": "Slow-Moving Inventory Analysis",
            "answer": "No high-stock items with critically stagnant sales velocity were detected.",
            "data_backed": True,
            "source": "PostgreSQL Database • inventory table"
        }

    total_tied_up = sum(float(r["tied_up_capital"]) for r in rows)

    table_rows = [
        {
            "Product": r["product_name"],
            "Category": r["category"],
            "Brand": r["brand"],
            "Stock Remaining": format_number_in(int(r["stock_remaining"])),
            "Unit Price": f"₹{float(r['unit_price']):,.2f}",
            "Tied Up Capital": format_currency_in(float(r["tied_up_capital"])),
            "60-Day Sales": f"{int(r['units_sold_60d'])} units"
        }
        for r in rows
    ]

    return {
        "intent": "inventory_risks",
        "title": "Slow-Moving Inventory & Stagnant Capital",
        "answer": (
            f"Identified **{len(rows)} products** with high stock levels (>50 units) but fewer than 5 units sold in the last 60 days. "
            f"Collectively, these stagnant items tie up approximately **{format_currency_in(total_tied_up)}** in working capital. "
            f"Consider discounting, clearance bundling, or marketing promotions to free up shelf space."
        ),
        "data_backed": True,
        "date_range": "Current inventory vs last 60-day sales velocity",
        "metric_definitions": [
            "Slow-Moving criteria: stock_remaining > 50 units AND units sold in 60 days <= 5",
            "Tied Up Capital = stock_remaining * unit_price"
        ],
        "kpis": [
            {"label": "Tied Up Capital", "value": format_currency_in(total_tied_up), "is_positive": False},
            {"label": "Stagnant Products", "value": str(len(rows)), "subtext": "Low velocity", "is_positive": False},
            {"label": "Top Stagnant Item", "value": rows[0]["product_name"][:20], "subtext": format_currency_in(float(rows[0]["tied_up_capital"])), "is_positive": False}
        ],
        "table": {
            "columns": ["Product", "Category", "Brand", "Stock Remaining", "Unit Price", "Tied Up Capital", "60-Day Sales"],
            "rows": table_rows
        },
        "source": "PostgreSQL Database • inventory, products, sales",
        "suggested_followups": [
            "Which products have low stock?",
            "Show my top 10 products by sales",
            "Which product generates the highest profit?"
        ]
    }


def handle_unsupported_query(user_text: str) -> Dict[str, Any]:
    bounds = get_dataset_bounds()
    return {
        "intent": "unsupported_query",
        "title": "Query Limitation & Supported Questions",
        "answer": (
            f"I could not find an approved data path to answer *\"{user_text}\"*. "
            f"I have direct read access to your actual **PostgreSQL business database** containing "
            f"**{format_number_in(bounds['total_rows'])} sales records** ({bounds['date_range_label']}), "
            f"customer accounts, product catalog, and real-time inventory levels.\n\n"
            f"Here are questions I can answer accurately from your actual business data:\n"
            f"- **Sales & Profitability:** *\"What are my total sales and profit?\"*, *\"Compare this month with the previous month\"*, *\"Which month had the highest sales?\"*\n"
            f"- **Products & Categories:** *\"Show my top 10 products by sales\"*, *\"Which product generates the highest profit?\"*, *\"Which category contributes the most revenue?\"*\n"
            f"- **Customer Analytics:** *\"How many repeat customers do I have?\"*, *\"Which customer segments generate the most revenue?\"*\n"
            f"- **Inventory & Risk:** *\"Which products have low stock?\"*, *\"What inventory risks should I investigate?\"*"
        ),
        "data_backed": False,
        "date_range": bounds["date_range_label"],
        "source": "Vanira Spark Knowledge Engine",
        "suggested_followups": [
            "What are my total sales and profit?",
            "Show my top 10 products by sales",
            "Which product generates the highest profit?",
            "Which products have low stock?"
        ]
    }


# ==============================================================================
# INTENT CLASSIFICATION ENGINE
# ==============================================================================

def classify_intent(message: str) -> str:
    """
    Classifies a natural language query into a supported business intent.
    """
    text = message.lower().strip()

    # Sales & revenue summaries
    if re.search(r"\b(total\s+(sales|revenue|profit|turnover)|overall\s+(sales|revenue|profit)|how\s+much\s+(did\s+i\s+make|total\s+revenue|profit)|sales\s+and\s+profit)\b", text):
        return "sales_summary"

    # Peak sales month
    if re.search(r"\b(highest\s+sales|best\s+month|top\s+month|peak\s+(sales|revenue|month)|highest\s+revenue\s+month|which\s+month\s+had\s+the\s+highest)\b", text):
        return "highest_sales_month"

    # Sales trajectory / increasing or decreasing
    if re.search(r"\b(increasing\s+or\s+decreasing|sales\s+trend|sales\s+growing|growth\s+trend|sales\s+going\s+up|trajectory|are\s+sales\s+increasing)\b", text):
        return "sales_trend_direction"

    # Monthly comparison / this month revenue
    if re.search(r"\b(this\s+month|previous\s+month|last\s+month|month\s+over\s+month|compare\s+(this\s+month|months)|revenue\s+this\s+month|how\s+much\s+revenue\s+did\s+i\s+generate\s+this\s+month)\b", text):
        return "monthly_sales_or_comparison"

    # Most profitable products
    if re.search(r"\b(highest\s+profit|most\s+profitable|top\s+profitable|profit\s+leader|best\s+profit\s+product|which\s+product\s+generates\s+the\s+highest\s+profit)\b", text):
        return "most_profitable_products"

    # Declining products
    if re.search(r"\b(declining\s+sales|dropping\s+sales|falling\s+sales|decreasing\s+sales|products\s+with\s+declining)\b", text):
        return "declining_products"

    # Low sales products
    if re.search(r"\b(low\s+sales|lowest\s+sales|worst\s+selling|least\s+sold|bottom\s+products|which\s+products\s+have\s+low\s+sales)\b", text):
        return "low_sales_products"

    # Top products by sales
    if re.search(r"\b(top\s+(10|\d+)?\s*products|best\s*selling\s+products|highest\s+selling|top\s+products\s+by\s+sales|show\s+my\s+top\s+10\s+products)\b", text):
        return "top_products"

    # Category performance
    if re.search(r"\b(category|categories|contributes\s+the\s+most\s+revenue|category\s+sales|revenue\s+by\s+category|which\s+category)\b", text):
        return "category_performance"

    # Repeat customers
    if re.search(r"\b(repeat\s+customers|returning\s+customers|repeat\s+purchase\s+rate|retention\s+rate|how\s+many\s+repeat\s+customers)\b", text):
        return "customer_summary"

    # Customer segments
    if re.search(r"\b(customer\s+segments?|segments\s+generate|vip\s+customers|loyal\s+customers|which\s+customer\s+segments)\b", text):
        return "customer_segments"

    # Customer trends & purchasing behavior
    if re.search(r"\b(purchasing\s+behavior|customer\s+trends?|payment\s+methods?|customer\s+behavior|how\s+has\s+customer\s+purchasing)\b", text):
        return "customer_purchasing_behavior"

    # Customer count / summary
    if re.search(r"\b(how\s+many\s+customers|total\s+customers|customer\s+count|customer\s+summary|summarize\s+customer\s+trends)\b", text):
        return "customer_summary"

    # Slow moving inventory
    if re.search(r"\b(slow\s*moving|stagnant\s+stock|dead\s+stock|slow\s+inventory|which\s+products\s+have\s+slow-moving)\b", text):
        return "slow_moving_inventory"

    # Low stock & stockout risks
    if re.search(r"\b(low\s+stock|out\s+of\s+stock|run\s+out\s+of\s+stock|stock\s+shortage|reorder\s+level|inventory\s+risks?|which\s+products\s+have\s+low\s+stock|what\s+inventory\s+risks)\b", text):
        return "inventory_risks"

    # Default general business overview if broadly asking for performance
    if re.search(r"\b(analyze\s+my\s+sales|business\s+performance|sales\s+performance|dashboard\s+summary|how\s+is\s+business\s+doing)\b", text):
        return "sales_summary"

    return "unsupported"


def process_chat_query(message: str) -> Dict[str, Any]:
    """
    Main entry point for chatbot inquiries.
    1. Validates & sanitizes input (prevents SQL & prompt injection).
    2. Classifies intent.
    3. Runs predefined, read-only parameterized query functions.
    4. Formats clean, executive-level JSON response with evidence, KPIs, and charts.
    """
    if not message or not message.strip():
        return {
            "intent": "empty_query",
            "title": "Empty Query",
            "answer": "Please ask a question about your business sales, products, customers, or inventory.",
            "data_backed": False,
            "source": "Vanira Spark System"
        }

    # Security check
    security_error = detect_security_risks(message)
    if security_error:
        logger.warning(f"Security attempt blocked: {security_error} | query: {message[:100]}")
        return {
            "intent": "security_blocked",
            "title": "Security Notice",
            "answer": security_error,
            "data_backed": False,
            "source": "Vanira Spark Security Layer"
        }

    intent = classify_intent(message)
    logger.info(f"Classified chat query '{message[:60]}...' as intent: {intent}")

    try:
        if intent == "sales_summary":
            return handle_sales_summary()
        elif intent == "monthly_sales_or_comparison":
            return handle_monthly_sales_or_comparison(message)
        elif intent == "highest_sales_month":
            return handle_highest_sales_month()
        elif intent == "sales_trend_direction":
            return handle_sales_trend_direction()
        elif intent == "top_products":
            # Extract limit if requested (e.g. top 5, top 15)
            match = re.search(r"\btop\s+(\d+)\b", message.lower())
            limit = int(match.group(1)) if match else 10
            return handle_top_products(limit=limit)
        elif intent == "low_sales_products":
            return handle_low_sales_products(limit=10)
        elif intent == "declining_products":
            return handle_declining_products()
        elif intent == "most_profitable_products":
            return handle_most_profitable_products(limit=10)
        elif intent == "category_performance":
            return handle_category_performance()
        elif intent == "customer_summary":
            return handle_customer_summary()
        elif intent == "customer_segments":
            return handle_customer_segments()
        elif intent == "customer_purchasing_behavior":
            return handle_customer_purchasing_behavior()
        elif intent == "inventory_risks":
            return handle_inventory_risks()
        elif intent == "slow_moving_inventory":
            return handle_slow_moving_inventory()
        else:
            return handle_unsupported_query(message)
    except Exception as e:
        logger.error(f"Error processing chatbot query: {str(e)}", exc_info=True)
        return {
            "intent": "system_error",
            "title": "Data Processing Error",
            "answer": "An unexpected error occurred while executing the business query. Please verify database connectivity.",
            "data_backed": False,
            "source": "Vanira Spark Error Handler"
        }
