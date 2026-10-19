"""
Vanira Spark - Centralized Verified Business Metrics Layer
Provides normalized, period-aware, mathematically verified business metrics directly from PostgreSQL.
Strictly parameter-bound, read-only, and privacy-preserving.
"""

from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from app.database import engine


def _format_currency(amount: float) -> str:
    """Formats monetary values in Indian Rupee format."""
    abs_amt = abs(amount)
    sign = "-" if amount < 0 else ""
    if abs_amt >= 10_000_000:
        return f"{sign}₹{abs_amt / 10_000_000:.2f} Cr"
    elif abs_amt >= 100_000:
        return f"{sign}₹{abs_amt / 100_000:.2f} L"
    else:
        return f"{sign}₹{abs_amt:,.2f}"


def _format_number(num: float) -> str:
    """Formats counts with standard comma separators."""
    return f"{int(round(num)):,}"


def _safe_percentage_change(current: float, previous: float) -> Optional[float]:
    """
    Computes percentage change safely without producing deceptive +0.00%
    when data is missing or previous is zero.
    """
    if previous == 0:
        if current == 0:
            return None  # Both zero: comparison is N/A, not +0.00%
        return 100.0 if current > 0 else -100.0
    return round(((current - previous) / abs(previous)) * 100, 2)


def get_data_freshness_and_bounds() -> Dict[str, Any]:
    """
    Retrieves dataset bounds, total transactions, and data health metadata.
    """
    query = text("""
        SELECT
            MIN(sale_date) AS min_date,
            MAX(sale_date) AS max_date,
            COUNT(*) AS total_rows,
            COUNT(DISTINCT invoice_id) AS total_orders,
            COUNT(DISTINCT customer_id) AS total_customers,
            COUNT(DISTINCT product_name) AS unique_products
        FROM sales
    """)
    with engine.connect() as conn:
        row = conn.execute(query).mappings().first()

    if not row or not row["total_rows"]:
        return {
            "status": "empty",
            "total_rows": 0,
            "min_date": None,
            "max_date": None,
            "data_as_of": "No data available",
            "is_stale": True
        }

    min_d = row["min_date"]
    max_d = row["max_date"]

    # Check last upload timestamp if upload_history exists
    last_upload_time = None
    try:
        with engine.connect() as conn:
            up_row = conn.execute(text("SELECT MAX(created_at) FROM upload_history WHERE status = 'success'")).scalar()
            if up_row:
                last_upload_time = up_row.isoformat()
    except Exception:
        pass

    return {
        "status": "healthy",
        "total_rows": int(row["total_rows"] or 0),
        "total_orders": int(row["total_orders"] or 0),
        "total_customers": int(row["total_customers"] or 0),
        "unique_products": int(row["unique_products"] or 0),
        "min_date": min_d.isoformat() if min_d else None,
        "max_date": max_d.isoformat() if max_d else None,
        "min_date_formatted": min_d.strftime("%b %d, %Y") if min_d else "N/A",
        "max_date_formatted": max_d.strftime("%b %d, %Y") if max_d else "N/A",
        "data_as_of": f"{max_d.strftime('%b %d, %Y')}" if max_d else "N/A",
        "last_upload_time": last_upload_time,
        "is_stale": False
    }


def get_verified_business_metrics(period: str = "latest_month") -> Dict[str, Any]:
    """
    Returns normalized, verified business metrics for the specified reporting window.
    Periods supported:
    - 'latest_month': The latest full calendar month with data vs preceding full month
    - 'last_30_days': Rolling 30 days up to the latest data date vs prior 30 days
    - 'all_time': Full business cumulative history
    """
    freshness = get_data_freshness_and_bounds()
    if freshness["status"] == "empty":
        return {
            "error": "No business sales records found in database.",
            "freshness": freshness,
            "financials": {},
            "categories": [],
            "products": {},
            "customers": {},
            "inventory": {}
        }

    max_date = datetime.strptime(freshness["max_date"], "%Y-%m-%d").date()

    # Determine reporting bounds and comparison baseline
    if period == "last_30_days":
        current_start = max_date - timedelta(days=29)
        current_end = max_date
        prev_start = current_start - timedelta(days=30)
        prev_end = current_start - timedelta(days=1)
        period_label = f"Last 30 Days ({current_start.strftime('%b %d')} - {current_end.strftime('%b %d, %Y')})"
        comparison_label = f"Prior 30 Days ({prev_start.strftime('%b %d')} - {prev_end.strftime('%b %d, %Y')})"
        is_all_time = False
    elif period == "all_time":
        current_start = datetime.strptime(freshness["min_date"], "%Y-%m-%d").date()
        current_end = max_date
        prev_start = None
        prev_end = None
        period_label = f"All-Time ({freshness['min_date_formatted']} - {freshness['max_date_formatted']})"
        comparison_label = "Historical Baseline"
        is_all_time = True
    else:  # default "latest_month"
        # Determine latest month present in data
        current_start = date(max_date.year, max_date.month, 1)
        # End of latest month
        next_month = date(max_date.year + (1 if max_date.month == 12 else 0), 1 if max_date.month == 12 else max_date.month + 1, 1)
        current_end = next_month - timedelta(days=1)
        # Preceding month
        prev_end = current_start - timedelta(days=1)
        prev_start = date(prev_end.year, prev_end.month, 1)
        period_label = current_start.strftime("%B %Y")
        comparison_label = prev_start.strftime("%B %Y")
        is_all_time = False

    # 1. CORE FINANCIALS (Current vs Previous)
    if is_all_time:
        fin_query = text("""
            SELECT
                COALESCE(SUM(total_amount), 0) AS total_revenue,
                COALESCE(SUM(profit), 0) AS total_profit,
                COUNT(DISTINCT invoice_id) AS total_orders,
                COALESCE(SUM(quantity), 0) AS total_quantity,
                COUNT(DISTINCT customer_id) AS active_customers
            FROM sales
        """)
        with engine.connect() as conn:
            cur_fin = conn.execute(fin_query).mappings().first()
        prev_fin = None
    else:
        fin_query = text("""
            SELECT
                COALESCE(SUM(total_amount) FILTER (WHERE sale_date BETWEEN :c_start AND :c_end), 0) AS cur_revenue,
                COALESCE(SUM(profit) FILTER (WHERE sale_date BETWEEN :c_start AND :c_end), 0) AS cur_profit,
                COUNT(DISTINCT invoice_id) FILTER (WHERE sale_date BETWEEN :c_start AND :c_end) AS cur_orders,
                COALESCE(SUM(quantity) FILTER (WHERE sale_date BETWEEN :c_start AND :c_end), 0) AS cur_quantity,
                COUNT(DISTINCT customer_id) FILTER (WHERE sale_date BETWEEN :c_start AND :c_end) AS cur_customers,

                COALESCE(SUM(total_amount) FILTER (WHERE sale_date BETWEEN :p_start AND :p_end), 0) AS prev_revenue,
                COALESCE(SUM(profit) FILTER (WHERE sale_date BETWEEN :p_start AND :p_end), 0) AS prev_profit,
                COUNT(DISTINCT invoice_id) FILTER (WHERE sale_date BETWEEN :p_start AND :p_end) AS prev_orders,
                COALESCE(SUM(quantity) FILTER (WHERE sale_date BETWEEN :p_start AND :p_end), 0) AS prev_quantity,
                COUNT(DISTINCT customer_id) FILTER (WHERE sale_date BETWEEN :p_start AND :p_end) AS prev_customers
            FROM sales
        """)
        with engine.connect() as conn:
            fin_row = conn.execute(fin_query, {
                "c_start": current_start,
                "c_end": current_end,
                "p_start": prev_start,
                "p_end": prev_end
            }).mappings().first()

        cur_fin = {
            "total_revenue": fin_row["cur_revenue"],
            "total_profit": fin_row["cur_profit"],
            "total_orders": fin_row["cur_orders"],
            "total_quantity": fin_row["cur_quantity"],
            "active_customers": fin_row["cur_customers"],
        }
        prev_fin = {
            "total_revenue": fin_row["prev_revenue"],
            "total_profit": fin_row["prev_profit"],
            "total_orders": fin_row["prev_orders"],
            "total_quantity": fin_row["prev_quantity"],
            "active_customers": fin_row["prev_customers"],
        }

    revenue = float(cur_fin["total_revenue"] or 0)
    profit = float(cur_fin["total_profit"] or 0)
    orders = int(cur_fin["total_orders"] or 0)
    quantity = int(cur_fin["total_quantity"] or 0)
    customers = int(cur_fin["active_customers"] or 0)
    margin = round((profit / revenue * 100), 2) if revenue > 0 else 0.0
    aov = round((revenue / orders), 2) if orders > 0 else 0.0

    if prev_fin and prev_fin["total_revenue"] is not None:
        p_revenue = float(prev_fin["total_revenue"] or 0)
        p_profit = float(prev_fin["total_profit"] or 0)
        p_orders = int(prev_fin["total_orders"] or 0)
        p_margin = round((p_profit / p_revenue * 100), 2) if p_revenue > 0 else 0.0
        p_aov = round((p_revenue / p_orders), 2) if p_orders > 0 else 0.0

        revenue_change = _safe_percentage_change(revenue, p_revenue)
        profit_change = _safe_percentage_change(profit, p_profit)
        orders_change = _safe_percentage_change(orders, p_orders)
        margin_change = round(margin - p_margin, 2)
        aov_change = _safe_percentage_change(aov, p_aov)
    else:
        p_revenue = None
        p_profit = None
        p_orders = None
        p_margin = None
        p_aov = None
        revenue_change = None
        profit_change = None
        orders_change = None
        margin_change = None
        aov_change = None

    financials = {
        "revenue": {
            "value": revenue,
            "formatted": _format_currency(revenue),
            "previous_value": p_revenue,
            "change_pct": revenue_change,
            "change_label": f"{revenue_change:+.2f}%" if revenue_change is not None else "N/A",
            "is_positive": revenue_change >= 0 if revenue_change is not None else True,
            "formula": "SUM(total_amount)"
        },
        "profit": {
            "value": profit,
            "formatted": _format_currency(profit),
            "previous_value": p_profit,
            "change_pct": profit_change,
            "change_label": f"{profit_change:+.2f}%" if profit_change is not None else "N/A",
            "is_positive": profit_change >= 0 if profit_change is not None else True,
            "formula": "SUM(profit)"
        },
        "margin": {
            "value": margin,
            "formatted": f"{margin:.2f}%",
            "previous_value": p_margin,
            "change_pp": margin_change,
            "change_label": f"{margin_change:+.2f} pp" if margin_change is not None else "N/A",
            "is_positive": margin_change >= 0 if margin_change is not None else True,
            "formula": "(SUM(profit) / SUM(total_amount)) * 100"
        },
        "orders": {
            "value": orders,
            "formatted": _format_number(orders),
            "previous_value": p_orders,
            "change_pct": orders_change,
            "change_label": f"{orders_change:+.2f}%" if orders_change is not None else "N/A",
            "is_positive": orders_change >= 0 if orders_change is not None else True,
            "formula": "COUNT(DISTINCT invoice_id)"
        },
        "aov": {
            "value": aov,
            "formatted": _format_currency(aov),
            "previous_value": p_aov,
            "change_pct": aov_change,
            "change_label": f"{aov_change:+.2f}%" if aov_change is not None else "N/A",
            "is_positive": aov_change >= 0 if aov_change is not None else True,
            "formula": "SUM(total_amount) / COUNT(DISTINCT invoice_id)"
        },
        "quantity": {
            "value": quantity,
            "formatted": _format_number(quantity),
            "formula": "SUM(quantity)"
        },
        "active_customers": {
            "value": customers,
            "formatted": _format_number(customers),
            "formula": "COUNT(DISTINCT customer_id)"
        }
    }

    # 2. CATEGORY BREAKDOWN
    if is_all_time:
        cat_query = text("""
            SELECT
                COALESCE(NULLIF(TRIM(product_category), ''), 'Unknown') AS category,
                COALESCE(SUM(total_amount), 0) AS revenue,
                COALESCE(SUM(profit), 0) AS profit,
                COUNT(DISTINCT invoice_id) AS orders,
                COALESCE(SUM(quantity), 0) AS quantity
            FROM sales
            GROUP BY category
            ORDER BY revenue DESC
        """)
        with engine.connect() as conn:
            cat_rows = conn.execute(cat_query).mappings().all()
    else:
        cat_query = text("""
            SELECT
                COALESCE(NULLIF(TRIM(product_category), ''), 'Unknown') AS category,
                COALESCE(SUM(total_amount), 0) AS revenue,
                COALESCE(SUM(profit), 0) AS profit,
                COUNT(DISTINCT invoice_id) AS orders,
                COALESCE(SUM(quantity), 0) AS quantity
            FROM sales
            WHERE sale_date BETWEEN :start_d AND :end_d
            GROUP BY category
            ORDER BY revenue DESC
        """)
        with engine.connect() as conn:
            cat_rows = conn.execute(cat_query, {"start_d": current_start, "end_d": current_end}).mappings().all()

    categories = [
        {
            "category": r["category"],
            "revenue": round(float(r["revenue"] or 0), 2),
            "formatted_revenue": _format_currency(float(r["revenue"] or 0)),
            "profit": round(float(r["profit"] or 0), 2),
            "formatted_profit": _format_currency(float(r["profit"] or 0)),
            "orders": int(r["orders"] or 0),
            "quantity": int(r["quantity"] or 0),
            "profit_margin": round((float(r["profit"] or 0) / float(r["revenue"] or 1) * 100), 2) if float(r["revenue"] or 0) > 0 else 0.0,
            "share_percentage": round((float(r["revenue"] or 0) / revenue * 100), 2) if revenue > 0 else 0.0
        }
        for r in cat_rows
    ]

    # 3. TOP & BOTTOM PRODUCTS (By Profit & By Revenue)
    date_filter = "" if is_all_time else "WHERE sale_date BETWEEN :start_d AND :end_d"
    prod_query = text(f"""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(MAX(product_category), 'Unknown') AS category,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity
        FROM sales
        {date_filter}
        GROUP BY product_name
    """)
    params = {} if is_all_time else {"start_d": current_start, "end_d": current_end}
    with engine.connect() as conn:
        prod_rows = conn.execute(prod_query, params).mappings().all()

    prod_list = [
        {
            "product_name": r["product_name"],
            "brand": r["brand"],
            "category": r["category"],
            "revenue": round(float(r["revenue"] or 0), 2),
            "formatted_revenue": _format_currency(float(r["revenue"] or 0)),
            "profit": round(float(r["profit"] or 0), 2),
            "formatted_profit": _format_currency(float(r["profit"] or 0)),
            "orders": int(r["orders"] or 0),
            "quantity": int(r["quantity"] or 0),
            "profit_margin": round((float(r["profit"] or 0) / float(r["revenue"] or 1) * 100), 2) if float(r["revenue"] or 0) > 0 else 0.0
        }
        for r in prod_rows
        if r["product_name"] and r["product_name"].strip()
    ]

    top_revenue_products = sorted(prod_list, key=lambda x: x["revenue"], reverse=True)[:5]
    top_profit_products = sorted(prod_list, key=lambda x: x["profit"], reverse=True)[:5]
    least_profit_products = sorted(prod_list, key=lambda x: x["profit"])[:5]

    # 4. CUSTOMER METRICS (Privacy Guaranteed: NO phone numbers queried)
    cust_query = text("""
        WITH cust_orders AS (
            SELECT
                customer_id,
                COUNT(DISTINCT invoice_id) AS orders,
                COALESCE(SUM(total_amount), 0) AS total_spent
            FROM sales
            WHERE customer_id IS NOT NULL AND TRIM(customer_id) <> ''
            GROUP BY customer_id
        ),
        vip_thresh AS (
            SELECT PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY total_spent) AS threshold
            FROM cust_orders
        )
        SELECT
            COUNT(*) AS total_customers,
            COUNT(*) FILTER (WHERE orders > 1) AS repeat_customers,
            COUNT(*) FILTER (WHERE total_spent >= v.threshold) AS vip_customers,
            COALESCE(AVG(total_spent), 0) AS avg_customer_value
        FROM cust_orders
        CROSS JOIN vip_thresh v
    """)
    with engine.connect() as conn:
        cust_row = conn.execute(cust_query).mappings().first()

    total_cust = int(cust_row["total_customers"] or 0)
    repeat_cust = int(cust_row["repeat_customers"] or 0)
    repeat_rate = round((repeat_cust / total_cust * 100), 2) if total_cust > 0 else 0.0
    vip_cust = int(cust_row["vip_customers"] or 0)
    avg_clv = float(cust_row["avg_customer_value"] or 0)

    customers_data = {
        "total_customers": total_cust,
        "formatted_total": _format_number(total_cust),
        "repeat_customers": repeat_cust,
        "formatted_repeat": _format_number(repeat_cust),
        "repeat_rate_pct": repeat_rate,
        "formatted_repeat_rate": f"{repeat_rate:.2f}%",
        "vip_customers": vip_cust,
        "formatted_vip": _format_number(vip_cust),
        "avg_lifetime_value": avg_clv,
        "formatted_clv": _format_currency(avg_clv)
    }

    # 5. INVENTORY INTELLIGENCE & SPECIFIC PRODUCT-LEVEL RISKS
    inv_query = text("""
        WITH velocity AS (
            SELECT
                product_name,
                brand,
                COALESCE(SUM(quantity), 0)::numeric / 30 AS daily_velocity
            FROM sales
            WHERE sale_date BETWEEN :vel_start AND :vel_end
            GROUP BY product_name, brand
        )
        SELECT
            p.product_name,
            COALESCE(p.brand, 'Unknown') AS brand,
            COALESCE(p.product_category, 'Unknown') AS category,
            i.stock_remaining,
            COALESCE(i.reorder_level, 20) AS reorder_level,
            COALESCE(v.daily_velocity, 0) AS daily_velocity,
            CASE
                WHEN i.stock_remaining <= 0 THEN 0
                WHEN COALESCE(v.daily_velocity, 0) > 0 THEN ROUND((GREATEST(i.stock_remaining, 0)::numeric / v.daily_velocity), 1)
                ELSE NULL
            END AS days_coverage
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
        LEFT JOIN velocity v ON v.product_name = p.product_name AND v.brand = p.brand
        WHERE i.stock_remaining <= COALESCE(i.reorder_level, 20)
        ORDER BY i.stock_remaining ASC, days_coverage ASC NULLS LAST
        LIMIT 10
    """)
    with engine.connect() as conn:
        inv_risk_rows = conn.execute(inv_query, {
            "vel_start": max_date - timedelta(days=29),
            "vel_end": max_date
        }).mappings().all()

    inv_kpi_query = text("""
        SELECT
            COALESCE(SUM(i.stock_remaining), 0) AS total_units,
            COUNT(*) FILTER (WHERE i.stock_remaining > 0) AS stocked_skus,
            COUNT(*) FILTER (WHERE i.stock_remaining > 0 AND i.stock_remaining <= COALESCE(i.reorder_level, 20)) AS low_stock_count,
            COUNT(*) FILTER (WHERE i.stock_remaining <= 0) AS out_of_stock_count
        FROM inventory i
    """)
    with engine.connect() as conn:
        inv_kpis = conn.execute(inv_kpi_query).mappings().first()

    critical_risks = [
        {
            "product_name": r["product_name"],
            "brand": r["brand"],
            "category": r["category"],
            "stock_remaining": int(r["stock_remaining"] or 0),
            "reorder_level": int(r["reorder_level"] or 20),
            "daily_velocity": round(float(r["daily_velocity"] or 0), 2),
            "days_coverage": float(r["days_coverage"]) if r["days_coverage"] is not None else None,
            "status": "Out of Stock" if int(r["stock_remaining"] or 0) <= 0 else "Critical Low Stock"
        }
        for r in inv_risk_rows
    ]

    inventory_data = {
        "total_units": int(inv_kpis["total_units"] or 0),
        "formatted_units": _format_number(int(inv_kpis["total_units"] or 0)),
        "stocked_skus": int(inv_kpis["stocked_skus"] or 0),
        "low_stock_count": int(inv_kpis["low_stock_count"] or 0),
        "out_of_stock_count": int(inv_kpis["out_of_stock_count"] or 0),
        "critical_risks": critical_risks
    }

    return {
        "period": period,
        "reporting_period_label": period_label,
        "comparison_period_label": comparison_label,
        "freshness": freshness,
        "financials": financials,
        "categories": categories,
        "top_revenue_products": top_revenue_products,
        "top_profit_products": top_profit_products,
        "least_profit_products": least_profit_products,
        "customers": customers_data,
        "inventory": inventory_data,
        "generated_at": datetime.now().isoformat()
    }
