from sqlalchemy import text
from app.database import engine


# HELPER
# =========================================================

def fetch_all(query, params=None):
    with engine.connect() as connection:
        result = connection.execute(
            query,
            params or {}
        )
        return result.mappings().all()

def fetch_one(query, params=None):
    with engine.connect() as connection:
        result = connection.execute(
            query,
            params or {}
        )
        return result.mappings().first()

# =========================================================
# 1. CUSTOMER KPIs
# =========================================================

def customer_kpis():

    query = text("""
        WITH customer_metrics AS (
            SELECT
                customer_id,
                COUNT(DISTINCT invoice_id) AS orders,
                COALESCE(SUM(total_amount), 0) AS revenue
            FROM sales
            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''
            GROUP BY customer_id
        ),

        revenue_threshold AS (
            SELECT
                PERCENTILE_CONT(0.75)
                WITHIN GROUP (
                    ORDER BY revenue
                ) AS vip_threshold
            FROM customer_metrics
        ),

        order_metrics AS (
            SELECT
                COUNT(DISTINCT invoice_id) AS total_orders,
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM sales
        )

        SELECT
            COUNT(*) AS total_customers,
            COUNT(*) FILTER (WHERE orders > 1) AS repeat_customers,
            COUNT(*) FILTER (WHERE revenue >= vip_threshold) AS vip_customers,
            COALESCE(
                order_metrics.total_revenue / NULLIF(order_metrics.total_orders, 0),
                0
            ) AS avg_order_value
        FROM customer_metrics,
             revenue_threshold,
             order_metrics
        GROUP BY
            order_metrics.total_revenue,
            order_metrics.total_orders
    """)

    row = fetch_one(query)

    if not row:
        return {
            "total_customers": 0,
            "vip_customers": 0,
            "repeat_customers": 0,
            "avg_order_value": 0,
        }

    return {
        "total_customers": int(row["total_customers"] or 0),
        "vip_customers": int(row["vip_customers"] or 0),
        "repeat_customers": int(row["repeat_customers"] or 0),
        "avg_order_value": round(float(row["avg_order_value"] or 0), 2),
    }


# =========================================================
# 2. CUSTOMER GROWTH
# =========================================================

def customer_growth():

    query = text("""
        SELECT
            DATE_TRUNC(
                'month',
                first_purchase
            ) AS month,

            COUNT(*) AS new_customers

        FROM (
            SELECT
                customer_id,
                MIN(sale_date) AS first_purchase

            FROM sales

            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''

            GROUP BY customer_id
        ) customers

        GROUP BY month

        ORDER BY month
    """)

    rows = fetch_all(query)

    return [
        {
            "month": row["month"].strftime("%Y-%m"),
            "new_customers": int(
                row["new_customers"] or 0
            )
        }
        for row in rows
    ]


# =========================================================
# 3. CUSTOMER SEGMENTS
# =========================================================

def customer_segments():

    query = text("""
        WITH customer_metrics AS (

            SELECT
                customer_id,

                COUNT(DISTINCT invoice_id)
                    AS orders,

                COALESCE(
                    SUM(total_amount),
                    0
                ) AS revenue,

                MIN(sale_date)
                    AS first_purchase,

                MAX(sale_date)
                    AS last_purchase

            FROM sales

            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''

            GROUP BY customer_id
        ),

        threshold AS (

            SELECT
                PERCENTILE_CONT(0.75)
                WITHIN GROUP (
                    ORDER BY revenue
                ) AS vip_threshold

            FROM customer_metrics
        )

        SELECT

            COUNT(*) FILTER (
                WHERE first_purchase >=
                    CURRENT_DATE - INTERVAL '30 days'
            ) AS new_customers,

            COUNT(*) FILTER (
                WHERE orders > 1
            ) AS returning_customers,

            COUNT(*) FILTER (
                WHERE revenue >= vip_threshold
            ) AS high_value_customers,

            COUNT(*) FILTER (
                WHERE orders > 1
                  AND last_purchase <
                      CURRENT_DATE - INTERVAL '30 days'
                  AND last_purchase >=
                      CURRENT_DATE - INTERVAL '90 days'
            ) AS at_risk_customers,

            COUNT(*) FILTER (
                WHERE last_purchase <
                    CURRENT_DATE - INTERVAL '90 days'
            ) AS inactive_customers

        FROM customer_metrics,
             threshold
    """)

    row = fetch_one(query)

    if not row:
        return {
            "new_customers": 0,
            "returning_customers": 0,
            "high_value_customers": 0,
            "at_risk_customers": 0,
            "inactive_customers": 0
        }

    return {
        "new_customers": int(
            row["new_customers"] or 0
        ),
        "returning_customers": int(
            row["returning_customers"] or 0
        ),
        "high_value_customers": int(
            row["high_value_customers"] or 0
        ),
        "at_risk_customers": int(
            row["at_risk_customers"] or 0
        ),
        "inactive_customers": int(
            row["inactive_customers"] or 0
        )
    }


# =========================================================
# 4. TOP CUSTOMERS
# =========================================================

def top_customers():

    query = text("""
        SELECT

            customer_id,

            MAX(customer_name)
                AS customer_name,

            MAX(city)
                AS city,

            COUNT(DISTINCT invoice_id)
                AS orders,

            COALESCE(
                SUM(total_amount),
                0
            ) AS revenue,

            COALESCE(
                SUM(profit),
                0
            ) AS profit,

            MAX(sale_date)
                AS last_purchase

        FROM sales

        WHERE customer_id IS NOT NULL
          AND TRIM(customer_id) <> ''

        GROUP BY customer_id

        ORDER BY revenue DESC

        LIMIT 10
    """)

    rows = fetch_all(query)

    return [
        {
            "customer_id": row["customer_id"],
            "customer_name": row["customer_name"] or "Unknown",
            "city": row["city"] or "Unknown",
            "orders": int(row["orders"] or 0),
            "revenue": round(
                float(row["revenue"] or 0),
                2
            ),
            "profit": round(
                float(row["profit"] or 0),
                2
            ),
            "last_purchase": (
                row["last_purchase"].isoformat()
                if row["last_purchase"]
                else None
            )
        }
        for row in rows
    ]


# =========================================================
# 5. CUSTOMER REVENUE
# =========================================================

def customer_revenue():

    query = text("""
        SELECT

            customer_id,

            MAX(customer_name)
                AS customer_name,

            COALESCE(
                SUM(total_amount),
                0
            ) AS revenue

        FROM sales

        WHERE customer_id IS NOT NULL
          AND TRIM(customer_id) <> ''

        GROUP BY customer_id

        ORDER BY revenue DESC

        LIMIT 20
    """)

    rows = fetch_all(query)

    return [
        {
            "customer_id": row["customer_id"],
            "customer_name": row["customer_name"] or "Unknown",
            "revenue": round(
                float(row["revenue"] or 0),
                2
            )
        }
        for row in rows
    ]


# =========================================================
# 6. PURCHASE BEHAVIOUR
# =========================================================

def purchase_behavior():

    query = text("""
        WITH customer_metrics AS (

            SELECT

                customer_id,

                COUNT(DISTINCT invoice_id)
                    AS orders,

                COALESCE(
                    SUM(quantity),
                    0
                ) AS items,

                COALESCE(
                    SUM(total_amount),
                    0
                ) AS revenue

            FROM sales

            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''

            GROUP BY customer_id
        ),

        overall AS (

            SELECT

                COUNT(DISTINCT invoice_id)
                    AS total_orders,

                COALESCE(
                    SUM(total_amount),
                    0
                ) AS total_revenue,

                COALESCE(
                    SUM(quantity),
                    0
                ) AS total_items

            FROM sales
        )

        SELECT

            COALESCE(
                AVG(customer_metrics.orders),
                0
            ) AS avg_orders_per_customer,

            COALESCE(
                AVG(customer_metrics.items),
                0
            ) AS avg_items_per_customer,

            COALESCE(
                AVG(customer_metrics.revenue),
                0
            ) AS avg_revenue_per_customer,

            COALESCE(
                overall.total_revenue
                / NULLIF(
                    overall.total_orders,
                    0
                ),
                0
            ) AS average_basket,

            COALESCE(
                (
                    COUNT(*) FILTER (
                        WHERE customer_metrics.orders > 1
                    )::NUMERIC
                    /
                    NULLIF(COUNT(*), 0)
                ) * 100,
                0
            ) AS repeat_purchase_rate

        FROM customer_metrics,
             overall

        GROUP BY
            overall.total_revenue,
            overall.total_orders
    """)

    row = fetch_one(query)

    if not row:
        return {
            "avg_orders_per_customer": 0,
            "avg_items_per_customer": 0,
            "avg_revenue_per_customer": 0,
            "average_basket": 0,
            "repeat_purchase_rate": 0
        }

    return {
        "avg_orders_per_customer": round(
            float(
                row["avg_orders_per_customer"] or 0
            ),
            2
        ),
        "avg_items_per_customer": round(
            float(
                row["avg_items_per_customer"] or 0
            ),
            2
        ),
        "avg_revenue_per_customer": round(
            float(
                row["avg_revenue_per_customer"] or 0
            ),
            2
        ),
        "average_basket": round(
            float(
                row["average_basket"] or 0
            ),
            2
        ),
        "repeat_purchase_rate": round(
            float(
                row["repeat_purchase_rate"] or 0
            ),
            2
        )
    }


# =========================================================
# 7. CUSTOMER LIFETIME VALUE
# =========================================================

def customer_lifetime_value():

    query = text("""
        WITH customer_metrics AS (

            SELECT

                customer_id,

                COUNT(DISTINCT invoice_id)
                    AS orders,

                COALESCE(
                    SUM(total_amount),
                    0
                ) AS revenue,

                COALESCE(
                    SUM(profit),
                    0
                ) AS profit,

                MIN(sale_date)
                    AS first_purchase,

                MAX(sale_date)
                    AS last_purchase

            FROM sales

            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''

            GROUP BY customer_id
        )

        SELECT

            COALESCE(
                AVG(revenue),
                0
            ) AS avg_customer_revenue,

            COALESCE(
                AVG(profit),
                0
            ) AS avg_customer_profit,

            COALESCE(
                AVG(orders),
                0
            ) AS avg_customer_orders,

            COALESCE(
                AVG(
                    CASE
                        WHEN last_purchase > first_purchase
                        THEN EXTRACT(
                            DAY FROM
                            (
                                last_purchase
                                -
                                first_purchase
                            )
                        )
                        ELSE 0
                    END
                ),
                0
            ) AS avg_lifespan_days

        FROM customer_metrics
    """)

    row = fetch_one(query)

    if not row:
        return {
            "avg_customer_revenue": 0,
            "avg_customer_profit": 0,
            "avg_customer_orders": 0,
            "avg_lifespan_days": 0,
            "estimated_clv": 0
        }

    avg_revenue = float(
        row["avg_customer_revenue"] or 0
    )

    avg_profit = float(
        row["avg_customer_profit"] or 0
    )

    avg_orders = float(
        row["avg_customer_orders"] or 0
    )

    # Simple historical CLV estimate
    estimated_clv = (
        avg_profit
        if avg_profit > 0
        else avg_revenue
    )

    return {
        "avg_customer_revenue": round(
            avg_revenue,
            2
        ),
        "avg_customer_profit": round(
            avg_profit,
            2
        ),
        "avg_customer_orders": round(
            avg_orders,
            2
        ),
        "avg_lifespan_days": round(
            float(
                row["avg_lifespan_days"] or 0
            ),
            2
        ),
        "estimated_clv": round(
            estimated_clv,
            2
        )
    }


# =========================================================
# 8. CUSTOMER RETENTION
# =========================================================

def customer_retention():

    query = text("""
        WITH customer_orders AS (

            SELECT

                customer_id,

                COUNT(DISTINCT invoice_id)
                    AS orders,

                MIN(sale_date)
                    AS first_purchase,

                MAX(sale_date)
                    AS last_purchase

            FROM sales

            WHERE customer_id IS NOT NULL
              AND TRIM(customer_id) <> ''

            GROUP BY customer_id
        )

        SELECT

            COUNT(*) AS total_customers,

            COUNT(*) FILTER (
                WHERE orders > 1
            ) AS retained_customers,

            COALESCE(
                (
                    COUNT(*) FILTER (
                        WHERE orders > 1
                    )::NUMERIC
                    /
                    NULLIF(COUNT(*), 0)
                ) * 100,
                0
            ) AS retention_rate

        FROM customer_orders
    """)

    row = fetch_one(query)

    if not row:
        return {
            "total_customers": 0,
            "retained_customers": 0,
            "retention_rate": 0
        }

    return {
        "total_customers": int(
            row["total_customers"] or 0
        ),
        "retained_customers": int(
            row["retained_customers"] or 0
        ),
        "retention_rate": round(
            float(
                row["retention_rate"] or 0
            ),
            2
        )
    }


# =========================================================
# 9. CUSTOMER SEARCH
# =========================================================

def search_customers(search=""):

    query = text("""
        SELECT

            customer_id,

            MAX(customer_name)
                AS customer_name,

            MAX(city)
                AS city,

            MAX(mobile_number)
                AS mobile_number,

            COUNT(DISTINCT invoice_id)
                AS orders,

            COALESCE(
                SUM(total_amount),
                0
            ) AS revenue,

            COALESCE(
                SUM(profit),
                0
            ) AS profit,

            MAX(sale_date)
                AS last_purchase

        FROM sales

        WHERE customer_id IS NOT NULL
          AND TRIM(customer_id) <> ''

          AND (
                :search = ''
                OR customer_id ILIKE :pattern
                OR customer_name ILIKE :pattern
          )

        GROUP BY customer_id

        ORDER BY revenue DESC

        LIMIT 50
    """)

    rows = fetch_all(
        query,
        {
            "search": search,
            "pattern": f"%{search}%"
        }
    )

    return [
        {
            "customer_id": row["customer_id"],
            "customer_name": row["customer_name"] or "Unknown",
            "city": row["city"] or "Unknown",
            "mobile_number": row["mobile_number"] or "",
            "orders": int(row["orders"] or 0),
            "revenue": round(
                float(row["revenue"] or 0),
                2
            ),
            "profit": round(
                float(row["profit"] or 0),
                2
            ),
            "last_purchase": (
                row["last_purchase"].isoformat()
                if row["last_purchase"]
                else None
            )
        }
        for row in rows
    ]


# =========================================================
# 10. INDIVIDUAL CUSTOMER DETAILS
# =========================================================

def customer_details(customer_id):

    profile_query = text("""
        SELECT

            customer_id,

            MAX(customer_name)
                AS customer_name,

            MAX(mobile_number)
                AS mobile_number,

            MAX(gender)
                AS gender,

            MAX(age)
                AS age,

            MAX(city)
                AS city,

            COUNT(DISTINCT invoice_id)
                AS orders,

            COALESCE(
                SUM(quantity),
                0
            ) AS items,

            COALESCE(
                SUM(total_amount),
                0
            ) AS total_spend,

            COALESCE(
                SUM(profit),
                0
            ) AS total_profit,

            MIN(sale_date)
                AS first_purchase,

            MAX(sale_date)
                AS last_purchase

        FROM sales

        WHERE customer_id = :customer_id

        GROUP BY customer_id
    """)

    profile = fetch_one(
        profile_query,
        {
            "customer_id": customer_id
        }
    )

    if not profile:
        return None

    history_query = text("""
        SELECT

            invoice_id,

            sale_date,

            product_category,

            product_name,

            brand,

            quantity,

            total_amount,

            profit,

            payment_method

        FROM sales

        WHERE customer_id = :customer_id

        ORDER BY sale_date DESC

        LIMIT 100
    """)

    history = fetch_all(
        history_query,
        {
            "customer_id": customer_id
        }
    )

    return {
        "profile": {
            "customer_id":
                profile["customer_id"],

            "customer_name":
                profile["customer_name"] or "Unknown",

            "mobile_number":
                profile["mobile_number"] or "",

            "gender":
                profile["gender"] or "",

            "age":
                int(profile["age"])
                if profile["age"] is not None
                else None,

            "city":
                profile["city"] or "Unknown",

            "orders":
                int(profile["orders"] or 0),

            "items":
                int(profile["items"] or 0),

            "total_spend":
                round(
                    float(
                        profile["total_spend"] or 0
                    ),
                    2
                ),

            "total_profit":
                round(
                    float(
                        profile["total_profit"] or 0
                    ),
                    2
                ),

            "first_purchase":
                (
                    profile["first_purchase"].isoformat()
                    if profile["first_purchase"]
                    else None
                ),

            "last_purchase":
                (
                    profile["last_purchase"].isoformat()
                    if profile["last_purchase"]
                    else None
                )
        },

        "purchase_history": [
            {
                "invoice_id":
                    row["invoice_id"],

                "sale_date":
                    (
                        row["sale_date"].isoformat()
                        if row["sale_date"]
                        else None
                    ),

                "product_category":
                    row["product_category"]
                    or "Unknown",

                "product_name":
                    row["product_name"]
                    or "Unknown",

                "brand":
                    row["brand"]
                    or "Unknown",

                "quantity":
                    int(row["quantity"] or 0),

                "total_amount":
                    round(
                        float(
                            row["total_amount"] or 0
                        ),
                        2
                    ),

                "profit":
                    round(
                        float(
                            row["profit"] or 0
                        ),
                        2
                    ),

                "payment_method":
                    row["payment_method"]
                    or "Unknown"
            }
            for row in history
        ]
    }

def purchase_behaviour():

    query = text("""
        WITH customer_orders AS (
            SELECT
                customer_id,
                COUNT(DISTINCT invoice_id) AS orders,
                SUM(total_amount) AS revenue
            FROM sales
            WHERE customer_id IS NOT NULL
            GROUP BY customer_id
        ),

        repeat_customers AS (
            SELECT COUNT(*) AS repeat_count
            FROM customer_orders
            WHERE orders > 1
        ),

        totals AS (
            SELECT
                COUNT(DISTINCT invoice_id) AS total_orders,
                COUNT(DISTINCT customer_id) AS total_customers,
                SUM(quantity) AS total_quantity,
                SUM(total_amount) AS total_revenue
            FROM sales
        )

        SELECT
            t.total_orders,
            t.total_customers,
            t.total_quantity,
            t.total_revenue,
            r.repeat_count
        FROM totals t
        CROSS JOIN repeat_customers r
    """)

    row = fetch_one(query)

    if not row:
        return {}

    total_orders = int(row["total_orders"] or 0)
    total_customers = int(row["total_customers"] or 0)
    total_quantity = float(row["total_quantity"] or 0)
    total_revenue = float(row["total_revenue"] or 0)
    repeat_count = int(row["repeat_count"] or 0)

    return {
        "order_frequency": round(total_orders / total_customers, 2) if total_customers else 0,
        "avg_basket_value": round(total_revenue / total_orders, 2) if total_orders else 0,
        "avg_items_per_order": round(total_quantity / total_orders, 2) if total_orders else 0,
        "repeat_purchase_rate": round((repeat_count / total_customers) * 100, 2) if total_customers else 0,
        "revenue_per_customer": round(total_revenue / total_customers, 2) if total_customers else 0,
    }

def customer_lifetime_value():

    query = text("""
        SELECT
            customer_id,
            customer_name,

            COUNT(DISTINCT invoice_id) AS orders,

            SUM(total_amount) AS revenue,

            SUM(profit) AS profit,

            AVG(total_amount) AS avg_order_value

        FROM sales

        WHERE customer_id IS NOT NULL

        GROUP BY
            customer_id,
            customer_name

        ORDER BY revenue DESC

        LIMIT 20
    """)

    rows = fetch_all(query)

    if not rows:
        return []

    results = []

    for row in rows:
        revenue = float(
            row["revenue"] or 0
        )

        orders = int(
            row["orders"] or 0
        )

        avg_order = float(
            row["avg_order_value"] or 0
        )

        profit = float(
            row["profit"] or 0
        )

        clv = avg_order * orders

        results.append({
            "customer_id": row["customer_id"],
            "customer_name": row["customer_name"],
            "orders": orders,
            "revenue": round(revenue, 2),
            "profit": round(profit, 2),
            "clv": round(clv, 2)
        })

    return results

def customer_retention():

    query = text("""
        WITH customer_orders AS (

            SELECT
                customer_id,
                MIN(sale_date) AS first_purchase,
                MAX(sale_date) AS last_purchase,
                COUNT(DISTINCT invoice_id) AS orders

            FROM sales

            WHERE customer_id IS NOT NULL

            GROUP BY customer_id
        )

        SELECT *
        FROM customer_orders
    """)

    rows = fetch_all(query)

    if not rows:
        return {
            "retention_rate": 0,
            "active_customers": 0,
            "returning_customers": 0,
            "lost_customers": 0
        }

    total_customers = len(rows)

    returning_customers = sum(
        1 for row in rows
        if int(row["orders"] or 0) > 1
    )

    last_purchase_dates = [
        row["last_purchase"]
        for row in rows
        if row["last_purchase"] is not None
    ]

    latest_date = max(last_purchase_dates) if last_purchase_dates else None

    if latest_date is None:
        return {
            "retention_rate": 0,
            "active_customers": 0,
            "returning_customers": returning_customers,
            "lost_customers": 0
        }

    active_customers = sum(
        1 for row in rows
        if row["last_purchase"] is not None and
        (latest_date - row["last_purchase"]).days <= 90
    )

    lost_customers = sum(
        1 for row in rows
        if row["last_purchase"] is not None and
        (latest_date - row["last_purchase"]).days > 180
    )

    retention_rate = (
        (returning_customers / total_customers) * 100
        if total_customers > 0
        else 0
    )

    return {
        "retention_rate": round(retention_rate, 2),
        "active_customers": active_customers,
        "returning_customers": returning_customers,
        "lost_customers": lost_customers
    }

def search_customers(search=""):

    query = text("""
        SELECT

            c.customer_id,
            c.customer_name,
            c.mobile_number,

            COUNT(
                DISTINCT s.invoice_id
            ) AS orders,

            COALESCE(
                SUM(s.total_amount),
                0
            ) AS revenue,

            MAX(s.sale_date)
                AS last_purchase

        FROM customers c

        LEFT JOIN sales s

        ON c.customer_id =
           s.customer_id

        WHERE

            LOWER(c.customer_name)
            LIKE LOWER(:search)

            OR

            LOWER(c.customer_id)
            LIKE LOWER(:search)

            OR

            c.mobile_number
            LIKE :search

        GROUP BY

            c.customer_id,
            c.customer_name,
            c.mobile_number

        ORDER BY revenue DESC

        LIMIT 20
    """)

    rows = fetch_all(
        query,
        {"search": f"%{search}%"}
    )

    return [
        {
            key: ("" if value is None else value)
            for key, value in row.items()
        }
        for row in rows
    ]

def customer_profile(customer_id):

    query = text("""
        WITH customer_orders AS (
            SELECT
                customer_id,
                invoice_id,
                MIN(sale_date) AS sale_date,
                SUM(total_amount) AS order_revenue,
                SUM(profit) AS order_profit
            FROM sales
            WHERE customer_id = :customer_id
            GROUP BY
                customer_id,
                invoice_id
        )

        SELECT
            c.customer_id,
            c.customer_name,
            c.mobile_number,
            c.gender,
            c.age,
            c.city,
            c.created_at,

            COUNT(o.invoice_id) AS orders,

            COALESCE(SUM(o.order_revenue), 0) AS revenue,

            COALESCE(SUM(o.order_profit), 0) AS profit,

            COALESCE(
                SUM(o.order_revenue) / NULLIF(COUNT(o.invoice_id), 0),
                0
            ) AS avg_order_value,

            MIN(o.sale_date) AS first_purchase,

            MAX(o.sale_date) AS last_purchase

        FROM customers c

        LEFT JOIN customer_orders o
            ON c.customer_id = o.customer_id

        WHERE c.customer_id = :customer_id

        GROUP BY
            c.customer_id,
            c.customer_name,
            c.mobile_number,
            c.gender,
            c.age,
            c.city,
            c.created_at
    """)

    row = fetch_one(
        query,
        {"customer_id": customer_id}
    )

    if row is None:
        return {}

    return {
        "customer_id": row["customer_id"],
        "customer_name": row["customer_name"],
        "mobile_number": row["mobile_number"],
        "gender": row["gender"],
        "age": row["age"],
        "city": row["city"],
        "created_at": (
            str(row["created_at"])
            if row["created_at"] is not None
            else ""
        ),

        "orders": int(row["orders"] or 0),

        "revenue": round(
            float(row["revenue"] or 0),
            2
        ),

        "profit": round(
            float(row["profit"] or 0),
            2
        ),

        "avg_order_value": round(
            float(row["avg_order_value"] or 0),
            2
        ),

        "first_purchase": (
            str(row["first_purchase"])
            if row["first_purchase"] is not None
            else ""
        ),

        "last_purchase": (
            str(row["last_purchase"])
            if row["last_purchase"] is not None
            else ""
        ),
    }

def customer_purchase_history(
    customer_id
):

    query = text("""
        SELECT

            invoice_id,
            sale_date,
            product_name,

            quantity,

            total_amount,

            profit

        FROM sales

        WHERE customer_id =
              :customer_id

        ORDER BY sale_date DESC

        LIMIT 100
    """)

    rows = fetch_all(
        query,
        {
            "customer_id": customer_id
        }
    )

    return [
        {
            key: ("" if value is None else value)
            for key, value in row.items()
        }
        for row in rows
    ]

def customer_spending_trend(
    customer_id
):

    query = text("""
        SELECT

            DATE_TRUNC(
                'month',
                sale_date
            ) AS month,

            SUM(total_amount)
                AS revenue

        FROM sales

        WHERE customer_id =
              :customer_id

        GROUP BY month

        ORDER BY month
    """)

    rows = fetch_all(
        query,
        {
            "customer_id": customer_id
        }
    )

    if not rows:
        return []

    return [
        {
            "month": row["month"].strftime("%Y-%m"),
            "revenue": round(float(row["revenue"] or 0), 2)
        }
        for row in rows
    ]