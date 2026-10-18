from sqlalchemy import text
from app.database import engine


def execute_query(query, params=None):
    with engine.connect() as connection:
        result = connection.execute(query, params or {})
        return result.mappings().all()


# ============================================================
# INVENTORY KPIs
# ============================================================

def inventory_kpis():
    query = text("""
        SELECT
            COALESCE(SUM(i.stock_remaining), 0) AS total_stock,
            COUNT(*) FILTER (WHERE i.stock_remaining > 0) AS stocked_products,
            COUNT(*) FILTER (
                WHERE i.stock_remaining > 0
                                    AND i.stock_remaining <= COALESCE(i.reorder_level, 20)
            ) AS low_stock_products,
            COUNT(*) FILTER (WHERE i.stock_remaining <= 0) AS out_of_stock_products
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
    """)

    rows = execute_query(query)

    if not rows:
        return {
            "total_stock": 0,
            "stocked_products": 0,
            "low_stock_products": 0,
            "out_of_stock_products": 0,
        }

    row = rows[0]

    return {
        "total_stock": int(row["total_stock"] or 0),
        "stocked_products": int(row["stocked_products"] or 0),
        "low_stock_products": int(row["low_stock_products"] or 0),
        "out_of_stock_products": int(row["out_of_stock_products"] or 0),
    }


# ============================================================
# STOCK OVERVIEW
# ============================================================

def inventory_summary():
    query = text("""
        WITH sales_velocity AS (
            SELECT
                product_name,
                brand,
                COALESCE(SUM(quantity), 0)::numeric / 30 AS daily_velocity
            FROM sales
            WHERE sale_date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE
            GROUP BY product_name, brand
        )
        SELECT
            p.product_name,
            COALESCE(
                NULLIF(TRIM(p.product_category), ''),
                'Unknown'
            ) AS product_category,
            COALESCE(
                NULLIF(TRIM(p.brand), ''),
                'Unknown'
            ) AS brand,
            i.stock_remaining,
            COALESCE(i.reorder_level, 20) AS reorder_level,
            COALESCE(p.unit_price, 0) AS unit_price,
            i.last_updated,
            CASE
                WHEN velocity.daily_velocity > 0
                THEN GREATEST(i.stock_remaining, 0)::numeric / velocity.daily_velocity
                WHEN i.stock_remaining <= 0 THEN 0
                ELSE NULL
            END AS stock_coverage_days
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
                LEFT JOIN sales_velocity velocity
                    ON velocity.product_name = p.product_name
                 AND velocity.brand IS NOT DISTINCT FROM p.brand
        ORDER BY i.stock_remaining ASC, p.product_name
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "product_category": row["product_category"],
            "brand": row["brand"],
            "stock_remaining": int(row["stock_remaining"] or 0),
            "reorder_level": int(row["reorder_level"] or 20),
            "unit_price": round(float(row["unit_price"] or 0), 2),
            "stock_value": round(
                max(float(row["stock_remaining"] or 0), 0)
                * float(row["unit_price"] or 0),
                2
            ),
            "last_updated": (
                row["last_updated"].isoformat()
                if row["last_updated"]
                else None
            ),
            "stock_coverage_days": (
                round(float(row["stock_coverage_days"]), 1)
                if row["stock_coverage_days"] is not None
                else None
            ),
        }
        for row in rows
    ]


# ============================================================
# LOW STOCK
# ============================================================

def low_stock_products():
    query = text("""
        WITH sales_velocity AS (
            SELECT
                product_name,
                brand,
                COALESCE(SUM(quantity), 0)::numeric / 30 AS daily_velocity
            FROM sales
            WHERE sale_date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE
            GROUP BY product_name, brand
        )
        SELECT
            p.product_name,
            COALESCE(
                NULLIF(TRIM(p.product_category), ''),
                'Unknown'
            ) AS product_category,
            COALESCE(
                NULLIF(TRIM(p.brand), ''),
                'Unknown'
            ) AS brand,
            i.stock_remaining,
            COALESCE(i.reorder_level, 20) AS reorder_level,
            CASE
                WHEN velocity.daily_velocity > 0
                THEN GREATEST(i.stock_remaining, 0)::numeric / velocity.daily_velocity
                ELSE NULL
            END AS stock_coverage_days
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
                LEFT JOIN sales_velocity velocity
                    ON velocity.product_name = p.product_name
                 AND velocity.brand IS NOT DISTINCT FROM p.brand
        WHERE i.stock_remaining > 0
                    AND i.stock_remaining <= COALESCE(i.reorder_level, 20)
        ORDER BY i.stock_remaining ASC, p.product_name
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "product_category": row["product_category"],
            "brand": row["brand"],
            "stock_remaining": int(row["stock_remaining"] or 0),
            "reorder_level": int(row["reorder_level"] or 20),
            "stock_coverage_days": (
                round(float(row["stock_coverage_days"]), 1)
                if row["stock_coverage_days"] is not None
                else None
            ),
            "status": "Low Stock",
        }
        for row in rows
    ]


# ============================================================
# OUT OF STOCK
# ============================================================

def out_of_stock_products():
    query = text("""
        SELECT
            p.product_name,
            COALESCE(
                NULLIF(TRIM(p.product_category), ''),
                'Unknown'
            ) AS product_category,
            COALESCE(
                NULLIF(TRIM(p.brand), ''),
                'Unknown'
            ) AS brand,
            i.stock_remaining,
            COALESCE(i.reorder_level, 20) AS reorder_level
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
        WHERE i.stock_remaining <= 0
        ORDER BY p.product_name
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "product_category": row["product_category"],
            "brand": row["brand"],
            "stock_remaining": int(row["stock_remaining"] or 0),
            "reorder_level": int(row["reorder_level"] or 20),
            "status": "Out of Stock",
        }
        for row in rows
    ]


# ============================================================
# FAST MOVING PRODUCTS
# ============================================================

def fast_moving_products():
    query = text("""
        SELECT
            product_name,
            COALESCE(
                NULLIF(TRIM(product_category), ''),
                'Unknown'
            ) AS product_category,
            COALESCE(SUM(quantity), 0) AS units_sold,
            COALESCE(SUM(total_amount), 0) AS revenue
        FROM sales
        WHERE product_name IS NOT NULL
          AND TRIM(product_name) <> ''
        GROUP BY
            product_name,
            product_category
        ORDER BY units_sold DESC
        LIMIT 10
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "product_category": row["product_category"],
            "units_sold": int(row["units_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
        }
        for row in rows
    ]


# ============================================================
# SLOW MOVING PRODUCTS
# ============================================================

def slow_moving_products():
    query = text("""
        SELECT
            product_name,
            COALESCE(
                NULLIF(TRIM(product_category), ''),
                'Unknown'
            ) AS product_category,
            COALESCE(SUM(quantity), 0) AS units_sold,
            COALESCE(SUM(total_amount), 0) AS revenue
        FROM sales
        WHERE product_name IS NOT NULL
          AND TRIM(product_name) <> ''
        GROUP BY
            product_name,
            product_category
        ORDER BY units_sold ASC
        LIMIT 10
    """)

    rows = execute_query(query)

    return [
        {
            "product_name": row["product_name"],
            "product_category": row["product_category"],
            "units_sold": int(row["units_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
        }
        for row in rows
    ]


# ============================================================
# REORDER INTELLIGENCE
# ============================================================

def reorder_recommendations():
    query = text("""
        WITH sales_velocity AS (
            SELECT
                product_name,
                brand,
                SUM(quantity) AS units_sold,
                COUNT(DISTINCT sale_date) AS active_days
            FROM sales
            WHERE sale_date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE
            GROUP BY product_name, brand
        )
        SELECT
            p.product_name,
            p.product_category,
            i.stock_remaining,
            COALESCE(i.reorder_level, 20) AS reorder_level,
            COALESCE(velocity.units_sold, 0) AS units_sold,
            COALESCE(velocity.active_days, 0) AS active_days,
            COALESCE(velocity.units_sold, 0)::numeric / 30 AS daily_velocity,
            CASE
                WHEN COALESCE(velocity.units_sold, 0) > 0
                THEN GREATEST(i.stock_remaining, 0)::numeric /
                     (velocity.units_sold::numeric / 30)
                WHEN i.stock_remaining <= 0 THEN 0
                ELSE NULL
            END AS stock_coverage_days
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
                LEFT JOIN sales_velocity velocity
                    ON velocity.product_name = p.product_name
                 AND velocity.brand IS NOT DISTINCT FROM p.brand
        WHERE i.stock_remaining <= COALESCE(i.reorder_level, 20)
           OR (
                COALESCE(velocity.units_sold, 0) > 0
                AND i.stock_remaining::numeric /
                    (velocity.units_sold::numeric / 30) <= 14
           )
        ORDER BY i.stock_remaining ASC, p.product_name
    """)

    rows = execute_query(query)

    recommendations = []

    for row in rows:
        stock = int(row["stock_remaining"] or 0)
        units_sold = int(row["units_sold"] or 0)
        active_days = int(row["active_days"] or 1)
        velocity = float(row["daily_velocity"] or 0)
        reorder_level = int(row["reorder_level"] or 20)

        days_remaining = (
            max(stock, 0) / velocity
            if velocity > 0
            else (0 if stock <= 0 else None)
        )

        if stock <= 0:
            priority = "Critical"
        elif days_remaining is not None and days_remaining <= 7:
            priority = "High"
        elif days_remaining is not None and days_remaining <= 14:
            priority = "Medium"
        else:
            priority = "Low"

        target_stock = max(reorder_level, int(round(velocity * 30)))
        recommended_quantity = max(target_stock - stock, 0)

        recommendations.append({
            "product_name": row["product_name"],
            "product_category": row["product_category"],
            "current_stock": stock,
            "reorder_level": reorder_level,
            "units_sold": units_sold,
            "active_days": active_days,
            "daily_sales_velocity": round(velocity, 2),
            "stock_coverage_days": (
                round(float(row["stock_coverage_days"]), 1)
                if row["stock_coverage_days"] is not None
                else None
            ),
            "days_remaining": (
                round(days_remaining, 1)
                if days_remaining is not None
                else None
            ),
            "recommended_quantity": recommended_quantity,
            "priority": priority,
        })

    return recommendations


def inventory_alerts():
    query = text("""
        SELECT
            alert.alert_id,
            alert.product_id,
            p.product_name,
            COALESCE(NULLIF(TRIM(p.product_category), ''), 'Unknown') AS product_category,
            alert.alert_type,
            alert.stock_remaining,
            alert.reorder_level,
            alert.stock_coverage_days,
            alert.status,
            alert.created_at,
            alert.updated_at
        FROM inventory_alerts alert
        JOIN products p ON p.product_id = alert.product_id
        WHERE alert.status = 'active'
        ORDER BY
            CASE alert.alert_type WHEN 'out_of_stock' THEN 0 ELSE 1 END,
            alert.created_at DESC
    """)

    rows = execute_query(query)
    return [
        {
            **dict(row),
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            "stock_coverage_days": (
                round(float(row["stock_coverage_days"]), 1)
                if row["stock_coverage_days"] is not None
                else None
            ),
        }
        for row in rows
    ]


# ============================================================
# INVENTORY MOVEMENT
# ============================================================

def inventory_movement():
    query = text("""
        SELECT
            DATE_TRUNC('month', sale_date) AS month,
            COALESCE(SUM(quantity), 0) AS units_sold,
            COALESCE(SUM(total_amount), 0) AS revenue
        FROM sales
        GROUP BY month
        ORDER BY month
    """)

    rows = execute_query(query)

    return [
        {
            "month": (
                row["month"].strftime("%Y-%m")
                if row["month"]
                else None
            ),
            "units_sold": int(row["units_sold"] or 0),
            "revenue": round(float(row["revenue"] or 0), 2),
        }
        for row in rows
    ]