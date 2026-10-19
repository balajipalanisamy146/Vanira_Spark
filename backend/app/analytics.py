from sqlalchemy import text
from app.database import engine


# =========================================================
# SALES SUMMARY
# =========================================================

def get_sales_summary():

    query = text("""
        WITH anchor AS (
            SELECT COALESCE(MAX(sale_date), CURRENT_DATE) AS max_date FROM sales
        ),
        bounds AS (
            SELECT
                max_date,
                (max_date - INTERVAL '6 days')::date AS current_start,
                max_date AS current_end,
                (max_date - INTERVAL '13 days')::date AS prev_start,
                (max_date - INTERVAL '7 days')::date AS prev_end
            FROM anchor
        )
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_sales,
            COALESCE(SUM(profit), 0) AS total_profit,
            COUNT(DISTINCT invoice_id) AS total_orders,
            COALESCE(SUM(quantity), 0) AS total_quantity,
            COALESCE(SUM(total_amount) FILTER (
                WHERE sale_date BETWEEN bounds.current_start AND bounds.current_end
            ), 0) AS current_week_sales,
            COALESCE(SUM(total_amount) FILTER (
                WHERE sale_date BETWEEN bounds.prev_start AND bounds.prev_end
            ), 0) AS previous_week_sales,
            COALESCE(SUM(profit) FILTER (
                WHERE sale_date BETWEEN bounds.current_start AND bounds.current_end
            ), 0) AS current_week_profit,
            COALESCE(SUM(profit) FILTER (
                WHERE sale_date BETWEEN bounds.prev_start AND bounds.prev_end
            ), 0) AS previous_week_profit,
            COUNT(DISTINCT invoice_id) FILTER (
                WHERE sale_date BETWEEN bounds.current_start AND bounds.current_end
            ) AS current_week_orders,
            COUNT(DISTINCT invoice_id) FILTER (
                WHERE sale_date BETWEEN bounds.prev_start AND bounds.prev_end
            ) AS previous_week_orders,
            bounds.max_date,
            bounds.current_start,
            bounds.current_end,
            bounds.prev_start,
            bounds.prev_end
        FROM sales
        CROSS JOIN bounds
        GROUP BY bounds.max_date, bounds.current_start, bounds.current_end, bounds.prev_start, bounds.prev_end
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().first()

    if not result:
        return {
            "total_sales": 0.0,
            "total_profit": 0.0,
            "total_orders": 0,
            "total_quantity": 0,
            "profit_margin": 0.0,
            "sales_change": None,
            "sales_change_label": "N/A",
            "sales_change_positive": None,
            "orders_change": None,
            "orders_change_positive": None,
            "profit_change": None,
            "profit_change_positive": None,
            "margin_change": "0.00 pp",
            "margin_change_positive": True,
        }

    total_sales = float(result["total_sales"] or 0)
    total_profit = float(result["total_profit"] or 0)

    profit_margin = (
        (total_profit / total_sales) * 100
        if total_sales > 0
        else 0
    )
    current_week_sales = float(result["current_week_sales"] or 0)
    previous_week_sales = float(result["previous_week_sales"] or 0)
    current_week_profit = float(result["current_week_profit"] or 0)
    previous_week_profit = float(result["previous_week_profit"] or 0)
    current_week_orders = int(result["current_week_orders"] or 0)
    previous_week_orders = int(result["previous_week_orders"] or 0)
    current_week_margin = (
        current_week_profit / current_week_sales * 100
        if current_week_sales > 0
        else 0
    )
    previous_week_margin = (
        previous_week_profit / previous_week_sales * 100
        if previous_week_sales > 0
        else 0
    )

    sales_change = _percentage_change(current_week_sales, previous_week_sales)
    orders_change = _percentage_change(current_week_orders, previous_week_orders)
    profit_change = _percentage_change(current_week_profit, previous_week_profit)
    margin_change = round(current_week_margin - previous_week_margin, 2)

    return {
        "total_sales": round(total_sales, 2),
        "total_profit": round(total_profit, 2),
        "total_orders": int(result["total_orders"] or 0),
        "total_quantity": int(result["total_quantity"] or 0),
        "profit_margin": round(profit_margin, 2),
        "sales_change": f"{sales_change:+.2f}%" if sales_change is not None else "N/A",
        "sales_change_positive": sales_change >= 0 if sales_change is not None else None,
        "orders_change": f"{orders_change:+.2f}%" if orders_change is not None else "N/A",
        "orders_change_positive": orders_change >= 0 if orders_change is not None else None,
        "profit_change": f"{profit_change:+.2f}%" if profit_change is not None else "N/A",
        "profit_change_positive": profit_change >= 0 if profit_change is not None else None,
        "margin_change": f"{margin_change:+.2f} pp",
        "margin_change_positive": margin_change >= 0,
        "reporting_period": "All-Time",
        "comparison_window": f"{result['current_start']} to {result['current_end']} vs {result['prev_start']} to {result['prev_end']}",
        "latest_data_date": result["max_date"].isoformat() if result["max_date"] else None,
    }


def _percentage_change(current, previous):
    if previous == 0:
        if current == 0:
            return None
        return 100.0

    return round((current - previous) / abs(previous) * 100, 2)


# =========================================================
# DAILY SALES TREND
# =========================================================

def get_sales_trend():

    query = text("""
        WITH date_range AS (
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '14 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            )::date AS sale_date
        ), daily_sales AS (
            SELECT sale_date, SUM(total_amount) AS sales
            FROM sales
            WHERE sale_date BETWEEN CURRENT_DATE - INTERVAL '14 days' AND CURRENT_DATE
            GROUP BY sale_date
        )
        SELECT
            date_range.sale_date,
            COALESCE(daily_sales.sales, 0) AS sales
        FROM date_range
        LEFT JOIN daily_sales USING (sale_date)
        ORDER BY date_range.sale_date
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "date": row["sale_date"].isoformat(),
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# WEEKLY SALES TREND
# =========================================================

def get_weekly_sales_trend():

    query = text("""
        WITH month_bounds AS (
            SELECT
                DATE_TRUNC('month', CURRENT_DATE)::date AS month_start,
                (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date AS month_end
        ), week_numbers AS (
            SELECT generate_series(
                1,
                CEIL(EXTRACT(DAY FROM month_end) / 7.0)::integer
            ) AS week_number
            FROM month_bounds
        ), weekly_sales AS (
            SELECT
                CEIL(EXTRACT(DAY FROM sale_date) / 7.0)::integer AS week_number,
                SUM(total_amount) AS sales
            FROM sales
            CROSS JOIN month_bounds
            WHERE sale_date BETWEEN month_start AND LEAST(month_end, CURRENT_DATE)
            GROUP BY week_number
        )
        SELECT
            'Week ' || week_numbers.week_number AS period,
            COALESCE(weekly_sales.sales, 0) AS sales
        FROM week_numbers
        LEFT JOIN weekly_sales USING (week_number)
        ORDER BY week_numbers.week_number
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "period": row["period"],
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# MONTHLY SALES TREND
# =========================================================

def get_monthly_sales_trend():

    query = text("""
        WITH month_numbers AS (
            SELECT generate_series(1, 12) AS month_number
        ), monthly_sales AS (
            SELECT
                EXTRACT(MONTH FROM sale_date)::integer AS month_number,
                SUM(total_amount) AS sales
            FROM sales
            WHERE sale_date >= DATE_TRUNC('year', CURRENT_DATE)::date
              AND sale_date <= CURRENT_DATE
            GROUP BY month_number
        )
        SELECT
            TO_CHAR(MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::integer, month_numbers.month_number, 1), 'Mon') AS period,
            COALESCE(monthly_sales.sales, 0) AS sales
        FROM month_numbers
        LEFT JOIN monthly_sales USING (month_number)
        ORDER BY month_numbers.month_number
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "period": row["period"],
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# YEARLY SALES TREND
# =========================================================

def get_yearly_sales_trend():

    query = text("""
        SELECT
            DATE_TRUNC('year', sale_date) AS year,
            SUM(total_amount) AS sales
        FROM sales
        GROUP BY year
        ORDER BY year
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "period": row["year"].strftime("%Y"),
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# TOP PRODUCTS
# =========================================================

def get_top_products():

    query = text("""
        SELECT
            product_name,
            SUM(quantity) AS quantity_sold,
            SUM(total_amount) AS sales
        FROM sales
        GROUP BY product_name
        ORDER BY sales DESC
        LIMIT 10
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "product_name": row["product_name"],
            "quantity_sold": int(row["quantity_sold"] or 0),
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# SALES BY CATEGORY
# =========================================================

def get_category_sales():

    query = text("""
        SELECT
            COALESCE(NULLIF(TRIM(product_category), ''), 'Unknown') AS category,
            COALESCE(SUM(total_amount), 0) AS sales,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity
        FROM sales
        GROUP BY
            COALESCE(NULLIF(TRIM(product_category), ''), 'Unknown')
        ORDER BY sales DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    total_sales = sum(float(r["sales"] or 0) for r in result)

    return [
        {
            "category": row["category"],
            "sales": round(float(row["sales"] or 0), 2),
            "revenue": round(float(row["sales"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
            "orders": int(row["orders"] or 0),
            "quantity": int(row["quantity"] or 0),
            "profit_margin": round((float(row["profit"] or 0) / float(row["sales"] or 1) * 100), 2) if float(row["sales"] or 0) > 0 else 0.0,
            "share_percentage": round((float(row["sales"] or 0) / total_sales * 100), 2) if total_sales > 0 else 0.0,
        }
        for row in result
    ]


# =========================================================
# SALES BY BRAND
# =========================================================

def get_brand_sales():

    query = text("""
        SELECT
            COALESCE(NULLIF(TRIM(brand), ''), 'Unknown') AS brand,
            COALESCE(SUM(total_amount), 0) AS sales
        FROM sales
        GROUP BY
            COALESCE(NULLIF(TRIM(brand), ''), 'Unknown')
        ORDER BY sales DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "brand": row["brand"],
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# SALES BY CITY
# =========================================================

def get_city_sales():

    query = text("""
        SELECT
            COALESCE(NULLIF(TRIM(city), ''), 'Unknown') AS city,
            COALESCE(SUM(total_amount), 0) AS sales
        FROM sales
        GROUP BY
            COALESCE(NULLIF(TRIM(city), ''), 'Unknown')
        ORDER BY sales DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "city": row["city"],
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# SALES BY GENDER
# =========================================================

def get_gender_sales():

    query = text("""
        SELECT
            COALESCE(NULLIF(TRIM(gender), ''), 'Unknown') AS gender,
            COALESCE(SUM(total_amount), 0) AS sales
        FROM sales
        GROUP BY
            COALESCE(NULLIF(TRIM(gender), ''), 'Unknown')
        ORDER BY sales DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "gender": row["gender"],
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# SALES BY PAYMENT METHOD
# =========================================================

def get_payment_method_sales():

    query = text("""
        SELECT
            COALESCE(
                NULLIF(TRIM(payment_method), ''),
                'Unknown'
            ) AS payment_method,
            COALESCE(SUM(total_amount), 0) AS sales
        FROM sales
        GROUP BY
            COALESCE(
                NULLIF(TRIM(payment_method), ''),
                'Unknown'
            )
        ORDER BY sales DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "payment_method": row["payment_method"],
            "sales": round(float(row["sales"] or 0), 2)
        }
        for row in result
    ]


# =========================================================
# SALES KPIs
# =========================================================

def get_sales_kpis():

    query = text("""
        WITH bounds AS (
            SELECT
                DATE_TRUNC('month', CURRENT_DATE)::date AS current_month_start,
                CURRENT_DATE AS today,
                (DATE_TRUNC('month', CURRENT_DATE)::date - INTERVAL '1 month')::date AS previous_month_start,
                (DATE_TRUNC('month', CURRENT_DATE)::date - 1) AS previous_month_last_day
        )
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COUNT(DISTINCT invoice_id) AS total_orders,
            COALESCE(SUM(profit), 0) AS total_profit,
            COALESCE(SUM(total_amount) FILTER (
                WHERE sale_date BETWEEN bounds.current_month_start AND bounds.today
            ), 0) AS current_month_revenue,
            COUNT(DISTINCT invoice_id) FILTER (
                WHERE sale_date BETWEEN bounds.current_month_start AND bounds.today
            ) AS current_month_orders,
            COALESCE(SUM(profit) FILTER (
                WHERE sale_date BETWEEN bounds.current_month_start AND bounds.today
            ), 0) AS current_month_profit,
            COALESCE(SUM(total_amount) FILTER (
                WHERE sale_date BETWEEN bounds.previous_month_start AND
                    bounds.previous_month_start + LEAST(
                        EXTRACT(DAY FROM bounds.today)::integer,
                        EXTRACT(DAY FROM bounds.previous_month_last_day)::integer
                    ) - 1
            ), 0) AS previous_month_revenue,
            COUNT(DISTINCT invoice_id) FILTER (
                WHERE sale_date BETWEEN bounds.previous_month_start AND
                    bounds.previous_month_start + LEAST(
                        EXTRACT(DAY FROM bounds.today)::integer,
                        EXTRACT(DAY FROM bounds.previous_month_last_day)::integer
                    ) - 1
            ) AS previous_month_orders,
            COALESCE(SUM(profit) FILTER (
                WHERE sale_date BETWEEN bounds.previous_month_start AND
                    bounds.previous_month_start + LEAST(
                        EXTRACT(DAY FROM bounds.today)::integer,
                        EXTRACT(DAY FROM bounds.previous_month_last_day)::integer
                    ) - 1
            ), 0) AS previous_month_profit
        FROM sales
        CROSS JOIN bounds
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().first()

    total_revenue = float(
        result["total_revenue"] or 0
    )

    total_orders = int(
        result["total_orders"] or 0
    )

    total_profit = float(
        result["total_profit"] or 0
    )

    avg_order_value = (
        total_revenue / total_orders
        if total_orders > 0
        else 0
    )

    profit_margin = (
        (total_profit / total_revenue) * 100
        if total_revenue > 0
        else 0
    )

    current_month_revenue = float(result["current_month_revenue"] or 0)
    current_month_orders = int(result["current_month_orders"] or 0)
    current_month_profit = float(result["current_month_profit"] or 0)
    previous_month_revenue = float(result["previous_month_revenue"] or 0)
    previous_month_orders = int(result["previous_month_orders"] or 0)
    previous_month_profit = float(result["previous_month_profit"] or 0)

    current_month_aov = (
        current_month_revenue / current_month_orders
        if current_month_orders > 0
        else 0
    )
    previous_month_aov = (
        previous_month_revenue / previous_month_orders
        if previous_month_orders > 0
        else 0
    )
    current_month_margin = (
        current_month_profit / current_month_revenue * 100
        if current_month_revenue > 0
        else 0
    )
    previous_month_margin = (
        previous_month_profit / previous_month_revenue * 100
        if previous_month_revenue > 0
        else 0
    )

    revenue_change = _percentage_change(current_month_revenue, previous_month_revenue)
    orders_change = _percentage_change(current_month_orders, previous_month_orders)
    aov_change = _percentage_change(current_month_aov, previous_month_aov)
    profit_change = _percentage_change(current_month_profit, previous_month_profit)
    margin_change = round(current_month_margin - previous_month_margin, 2)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "avg_order_value": round(avg_order_value, 2),
        "total_profit": round(total_profit, 2),
        "profit_margin": round(profit_margin, 2),
        "revenue_change": f"{revenue_change:+.2f}%",
        "revenue_change_positive": revenue_change >= 0,
        "orders_change": f"{orders_change:+.2f}%",
        "orders_change_positive": orders_change >= 0,
        "aov_change": f"{aov_change:+.2f}%",
        "aov_change_positive": aov_change >= 0,
        "profit_change": f"{profit_change:+.2f}%",
        "profit_change_positive": profit_change >= 0,
        "margin_change": f"{margin_change:+.2f} pp",
        "margin_change_positive": margin_change >= 0,
    }

def get_top_profitable_products():
    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(MAX(product_category), 'Unknown') AS category,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity_sold
        FROM sales
        WHERE product_name IS NOT NULL AND TRIM(product_name) <> ''
        GROUP BY product_name
        ORDER BY profit DESC
        LIMIT 10
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "product_name": row["product_name"],
            "brand": row["brand"],
            "category": row["category"],
            "profit": round(float(row["profit"] or 0), 2),
            "revenue": round(float(row["revenue"] or 0), 2),
            "orders": int(row["orders"] or 0),
            "quantity_sold": int(row["quantity_sold"] or 0),
            "profit_margin": round((float(row["profit"] or 0) / float(row["revenue"] or 1) * 100), 2) if float(row["revenue"] or 0) > 0 else 0.0,
        }
        for row in result
    ]


def get_least_profitable_products():
    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(MAX(product_category), 'Unknown') AS category,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity_sold
        FROM sales
        WHERE product_name IS NOT NULL AND TRIM(product_name) <> ''
        GROUP BY product_name
        ORDER BY profit ASC
        LIMIT 10
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "product_name": row["product_name"],
            "brand": row["brand"],
            "category": row["category"],
            "profit": round(float(row["profit"] or 0), 2),
            "revenue": round(float(row["revenue"] or 0), 2),
            "orders": int(row["orders"] or 0),
            "quantity_sold": int(row["quantity_sold"] or 0),
            "profit_margin": round((float(row["profit"] or 0) / float(row["revenue"] or 1) * 100), 2) if float(row["revenue"] or 0) > 0 else 0.0,
        }
        for row in result
    ]


def get_category_profit():
    query = text("""
        SELECT
            COALESCE(
                NULLIF(TRIM(product_category), ''),
                'Unknown'
            ) AS category,
            COALESCE(SUM(profit), 0) AS profit
        FROM sales
        GROUP BY
            COALESCE(
                NULLIF(TRIM(product_category), ''),
                'Unknown'
            )
        ORDER BY profit DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "category": row["category"],
            "profit": round(float(row["profit"] or 0), 2)
        }
        for row in result
    ]


def get_profit_trend():
    query = text("""
        WITH date_range AS (
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '29 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            )::date AS sale_date
        ), daily_profit AS (
            SELECT
                sale_date,
                COALESCE(SUM(profit), 0) AS profit
            FROM sales
            WHERE sale_date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE
            GROUP BY sale_date
        )
        SELECT
            date_range.sale_date,
            COALESCE(daily_profit.profit, 0) AS profit
        FROM date_range
        LEFT JOIN daily_profit USING (sale_date)
        ORDER BY date_range.sale_date
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "date": row["sale_date"].isoformat(),
            "profit": round(float(row["profit"] or 0), 2)
        }
        for row in result
    ]

def get_repeat_purchase_rate():
    query = text("""
        WITH customer_orders AS (
            SELECT
                customer_id,
                COUNT(DISTINCT invoice_id) AS order_count
            FROM sales
            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''
            GROUP BY customer_id
        )
        SELECT
            COUNT(*) AS total_customers,
            COUNT(*) FILTER (
                WHERE order_count > 1
            ) AS repeat_customers
        FROM customer_orders
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().first()

    total_customers = int(result["total_customers"] or 0)
    repeat_customers = int(result["repeat_customers"] or 0)

    repeat_rate = (
        (repeat_customers / total_customers) * 100
        if total_customers > 0
        else 0
    )

    return {
        "total_customers": total_customers,
        "repeat_customers": repeat_customers,
        "repeat_purchase_rate": round(repeat_rate, 2)
    }


def get_average_basket_size():
    query = text("""
        SELECT
            COUNT(DISTINCT invoice_id) AS total_orders,
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COALESCE(SUM(quantity), 0) AS total_items
        FROM sales
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().first()

    total_orders = int(result["total_orders"] or 0)
    total_revenue = float(result["total_revenue"] or 0)
    total_items = int(result["total_items"] or 0)

    average_order_value = (
        total_revenue / total_orders
        if total_orders > 0
        else 0
    )

    average_items_per_order = (
        total_items / total_orders
        if total_orders > 0
        else 0
    )

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_items": total_items,
        "average_order_value": round(
            average_order_value,
            2
        ),
        "average_items_per_order": round(
            average_items_per_order,
            2
        )
    }


def get_new_vs_returning_revenue():
    query = text("""
        WITH customer_orders AS (
            SELECT
                customer_id,
                invoice_id,
                MIN(sale_date) AS order_date,
                ROW_NUMBER() OVER (
                    PARTITION BY customer_id
                    ORDER BY
                        MIN(sale_date),
                        invoice_id
                ) AS order_rank
            FROM sales
            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''
            GROUP BY
                customer_id,
                invoice_id
        ),

        classified_orders AS (
            SELECT
                customer_id,
                invoice_id,
                order_date,
                CASE
                    WHEN order_rank = 1
                        THEN 'New Customers'
                    ELSE 'Returning Customers'
                END AS customer_type
            FROM customer_orders
        ),

        order_revenue AS (
            SELECT
                s.customer_id,
                s.invoice_id,
                COALESCE(SUM(s.total_amount), 0) AS revenue
            FROM sales s
            WHERE s.customer_id IS NOT NULL
              AND TRIM(s.customer_id) <> ''
            GROUP BY
                s.customer_id,
                s.invoice_id
        )

        SELECT
            c.customer_type,
            COALESCE(SUM(o.revenue), 0) AS revenue
        FROM classified_orders c
        INNER JOIN order_revenue o
            ON c.customer_id = o.customer_id
           AND c.invoice_id = o.invoice_id
        GROUP BY c.customer_type
        ORDER BY revenue DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().all()

    return [
        {
            "customer_type": row["customer_type"],
            "revenue": round(
                float(row["revenue"] or 0),
                2
            )
        }
        for row in result
    ]

def get_customer_revenue_contribution():
    query = text("""
        WITH customer_revenue AS (
            SELECT
                customer_id,
                COALESCE(SUM(total_amount), 0) AS revenue
            FROM sales
            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''
            GROUP BY customer_id
        )
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN revenue = 0 THEN 0
                        ELSE revenue
                    END
                ),
                0
            ) AS customer_revenue
        FROM customer_revenue
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().first()

    customer_revenue = float(
        result["customer_revenue"] or 0
    )

    return {
        "customer_revenue": round(
            customer_revenue,
            2
        )
    }