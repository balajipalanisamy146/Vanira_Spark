from sqlalchemy import text
from app.database import engine


def execute_query(query, params=None):
    with engine.connect() as connection:
        result = connection.execute(query, params or {})
        rows = result.mappings().all()

    return rows


# ---------------------------------------------------------
# PRODUCT KPIs
# ---------------------------------------------------------

def product_kpis():

    query = text("""
        SELECT
            COUNT(DISTINCT product_name) AS total_products,

            COUNT(
                DISTINCT CASE
                    WHEN quantity > 0
                    THEN product_name
                END
            ) AS active_products,

            COUNT(DISTINCT product_category) AS total_categories,

            COUNT(DISTINCT brand) AS total_brands

        FROM sales

        WHERE product_name IS NOT NULL
          AND TRIM(product_name) <> ''
    """)

    rows = execute_query(query)

    if not rows:
        return {
            "total_products": 0,
            "active_products": 0,
            "total_categories": 0,
            "total_brands": 0,
        }

    row = rows[0]

    return {
        "total_products": int(row["total_products"] or 0),
        "active_products": int(row["active_products"] or 0),
        "total_categories": int(row["total_categories"] or 0),
        "total_brands": int(row["total_brands"] or 0),
    }


# ---------------------------------------------------------
# TOP PRODUCTS BY REVENUE
# ---------------------------------------------------------

def top_products():

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

        WHERE product_name IS NOT NULL
          AND TRIM(product_name) <> ''

        GROUP BY product_name

        ORDER BY revenue DESC

        LIMIT 20
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "brand": row["brand"],
            "category": row["category"],
            "orders": int(row["orders"] or 0),
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
        }
        for row in rows
    ]


# ---------------------------------------------------------
# TOP PROFITABLE PRODUCTS
# ---------------------------------------------------------

def profitable_products():

    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit

        FROM sales

        WHERE product_name IS NOT NULL
          AND TRIM(product_name) <> ''

        GROUP BY product_name

        ORDER BY profit DESC

        LIMIT 20
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "brand": row["brand"],
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
        }
        for row in rows
    ]


# ---------------------------------------------------------
# LEAST PROFITABLE PRODUCTS
# ---------------------------------------------------------

def least_profitable_products():

    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit

        FROM sales

        WHERE product_name IS NOT NULL
          AND TRIM(product_name) <> ''

        GROUP BY product_name

        ORDER BY profit ASC

        LIMIT 20
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "brand": row["brand"],
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
        }
        for row in rows
    ]


# ---------------------------------------------------------
# CATEGORY PERFORMANCE
# ---------------------------------------------------------

def category_performance():

    query = text("""
        SELECT
            COALESCE(
                NULLIF(TRIM(product_category), ''),
                'Unknown'
            ) AS category,

            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT product_name) AS products

        FROM sales

        GROUP BY
            COALESCE(
                NULLIF(TRIM(product_category), ''),
                'Unknown'
            )

        ORDER BY revenue DESC
    """)

    rows = execute_query(query)

    return [
        {
            "category": row["category"],
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
            "products": int(row["products"] or 0),
        }
        for row in rows
    ]


# ---------------------------------------------------------
# BRAND PERFORMANCE
# ---------------------------------------------------------

def brand_performance():

    query = text("""
        SELECT
            COALESCE(
                NULLIF(TRIM(brand), ''),
                'Unknown'
            ) AS brand,

            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(DISTINCT product_name) AS products

        FROM sales

        GROUP BY
            COALESCE(
                NULLIF(TRIM(brand), ''),
                'Unknown'
            )

        ORDER BY revenue DESC

        LIMIT 20
    """)

    rows = execute_query(query)

    return [
        {
            "brand": row["brand"],
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
            "products": int(row["products"] or 0),
        }
        for row in rows
    ]


# ---------------------------------------------------------
# PRODUCT TREND
# ---------------------------------------------------------

def product_trend():

    query = text("""
        SELECT
            DATE_TRUNC('month', sale_date) AS month,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit

        FROM sales

        GROUP BY month

        ORDER BY month
    """)

    rows = execute_query(query)

    return [
        {
            "month": row["month"].strftime("%Y-%m"),
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
        }
        for row in rows
    ]


def search_products(search=""):
    search_value = search.strip()
    if not search_value:
        return []

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
        WHERE product_name IS NOT NULL
          AND TRIM(product_name) <> ''
          AND (
              product_name ILIKE :search
              OR COALESCE(brand, '') ILIKE :search
              OR COALESCE(product_category, '') ILIKE :search
          )
        GROUP BY product_name
        ORDER BY revenue DESC
        LIMIT 20
    """)

    rows = execute_query(query, {"search": f"%{search_value}%"})
    return [
        {
            "product_name": row["product_name"],
            "brand": row["brand"],
            "category": row["category"],
            "orders": int(row["orders"] or 0),
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
        }
        for row in rows
    ]


def product_profile(product_name):
    query = text("""
        SELECT
            product_name,
            COALESCE(MAX(brand), 'Unknown') AS brand,
            COALESCE(MAX(product_category), 'Unknown') AS category,
            COUNT(DISTINCT invoice_id) AS orders,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit,
            COALESCE(
                SUM(total_amount) / NULLIF(COUNT(DISTINCT invoice_id), 0),
                0
            ) AS average_order_revenue,
            COALESCE(
                SUM(profit) * 100 / NULLIF(SUM(total_amount), 0),
                0
            ) AS profit_margin,
            MIN(sale_date) AS first_sale,
            MAX(sale_date) AS last_sale
        FROM sales
        WHERE product_name = :product_name
        GROUP BY product_name
    """)

    rows = execute_query(query, {"product_name": product_name})
    if not rows:
        return {}

    row = rows[0]
    return {
        "product_name": row["product_name"],
        "brand": row["brand"],
        "category": row["category"],
        "orders": int(row["orders"] or 0),
        "quantity_sold": int(row["quantity_sold"] or 0),
        "revenue": round(float(row["revenue"] or 0), 2),
        "profit": round(float(row["profit"] or 0), 2),
        "average_order_revenue": round(float(row["average_order_revenue"] or 0), 2),
        "profit_margin": round(float(row["profit_margin"] or 0), 2),
        "first_sale": row["first_sale"].isoformat() if row["first_sale"] else None,
        "last_sale": row["last_sale"].isoformat() if row["last_sale"] else None,
    }


def product_sales_trend(product_name):
    query = text("""
        SELECT
            DATE_TRUNC('month', sale_date) AS month,
            COALESCE(SUM(quantity), 0) AS quantity_sold,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit
        FROM sales
        WHERE product_name = :product_name
        GROUP BY month
        ORDER BY month
    """)

    rows = execute_query(query, {"product_name": product_name})
    return [
        {
            "month": row["month"].strftime("%Y-%m"),
            "quantity_sold": int(row["quantity_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
        }
        for row in rows
    ]


def product_sales_history(product_name):
    query = text("""
        SELECT
            invoice_id,
            sale_date,
            customer_name,
            COALESCE(SUM(quantity), 0) AS quantity,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COALESCE(SUM(profit), 0) AS profit
        FROM sales
        WHERE product_name = :product_name
        GROUP BY invoice_id, sale_date, customer_name
        ORDER BY sale_date DESC, invoice_id DESC
        LIMIT 100
    """)

    rows = execute_query(query, {"product_name": product_name})
    return [
        {
            "invoice_id": row["invoice_id"],
            "sale_date": row["sale_date"].isoformat() if row["sale_date"] else None,
            "customer_name": row["customer_name"] or "Unknown",
            "quantity": int(row["quantity"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
            "profit": round(float(row["profit"] or 0), 2),
        }
        for row in rows
    ]
