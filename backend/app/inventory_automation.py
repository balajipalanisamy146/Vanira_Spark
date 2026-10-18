from sqlalchemy import text

from app.database import engine


def ensure_inventory_schema():
    statements = (
        """
        CREATE TABLE IF NOT EXISTS inventory (
            inventory_id BIGSERIAL PRIMARY KEY,
            product_id BIGINT NULL REFERENCES products(product_id),
            stock_remaining INTEGER NOT NULL DEFAULT 0 CHECK (stock_remaining >= 0),
            reorder_level INTEGER DEFAULT 10,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        "ALTER TABLE inventory ADD COLUMN IF NOT EXISTS product_id BIGINT",
        "ALTER TABLE inventory ADD COLUMN IF NOT EXISTS stock_remaining INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10",
        "ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "UPDATE inventory SET stock_remaining = 0 WHERE stock_remaining < 0",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'inventory_stock_nonnegative'
                  AND conrelid = 'inventory'::regclass
            ) THEN
                ALTER TABLE inventory
                ADD CONSTRAINT inventory_stock_nonnegative
                CHECK (stock_remaining >= 0);
            END IF;
        END $$
        """,
        "CREATE INDEX IF NOT EXISTS sales_inventory_velocity_idx ON sales (sale_date, product_name, brand) INCLUDE (quantity)",
        """
        CREATE UNIQUE INDEX IF NOT EXISTS inventory_product_id_uq
        ON inventory (product_id)
        WHERE product_id IS NOT NULL
        """,
        """
        CREATE TABLE IF NOT EXISTS inventory_alerts (
            alert_id BIGSERIAL PRIMARY KEY,
            product_id BIGINT NOT NULL REFERENCES products(product_id),
            alert_type VARCHAR(30) NOT NULL,
            stock_remaining INTEGER NOT NULL,
            reorder_level INTEGER NOT NULL,
            stock_coverage_days NUMERIC(10, 2),
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        )
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS inventory_alerts_active_product_uq
        ON inventory_alerts (product_id)
        WHERE status = 'active'
        """,
        """
        CREATE TABLE IF NOT EXISTS inventory_schema_migrations (
            version VARCHAR(100) PRIMARY KEY,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """,
    )

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

        connection.execute(text("""
            WITH latest_stock AS (
                SELECT DISTINCT ON (p.product_id)
                    p.product_id,
                    s.stock_remaining
                FROM products p
                JOIN sales s
                  ON s.product_name = p.product_name
                 AND s.brand IS NOT DISTINCT FROM p.brand
                WHERE s.sale_date <= CURRENT_DATE
                ORDER BY p.product_id, s.sale_date DESC, s.sale_id DESC
            )
            INSERT INTO inventory (product_id, stock_remaining, last_updated)
            SELECT
                p.product_id,
                GREATEST(COALESCE(latest_stock.stock_remaining, 0), 0),
                CURRENT_TIMESTAMP
            FROM products p
            LEFT JOIN latest_stock ON latest_stock.product_id = p.product_id
            ON CONFLICT (product_id) WHERE product_id IS NOT NULL DO NOTHING
        """))

        repair_started = connection.execute(text("""
            INSERT INTO inventory_schema_migrations (version)
            VALUES ('003_correct_dayfirst_iso_sales_dates')
            ON CONFLICT (version) DO NOTHING
            RETURNING version
        """)).scalar_one_or_none()

        if repair_started:
            connection.execute(text("""
                UPDATE sales
                SET sale_date = MAKE_DATE(
                    EXTRACT(YEAR FROM sale_date)::integer,
                    EXTRACT(DAY FROM sale_date)::integer,
                    EXTRACT(MONTH FROM sale_date)::integer
                )
                WHERE invoice_id LIKE 'INV-______-%'
                  AND EXTRACT(YEAR FROM sale_date)::integer =
                      SUBSTRING(invoice_id FROM 5 FOR 4)::integer
                  AND EXTRACT(DAY FROM sale_date)::integer =
                      SUBSTRING(invoice_id FROM 9 FOR 2)::integer
                  AND EXTRACT(MONTH FROM sale_date)::integer IS DISTINCT FROM
                      SUBSTRING(invoice_id FROM 9 FOR 2)::integer
            """))

            connection.execute(text("""
                WITH latest_stock AS (
                    SELECT DISTINCT ON (p.product_id)
                        p.product_id,
                        s.stock_remaining
                    FROM products p
                    JOIN sales s
                      ON s.product_name = p.product_name
                     AND s.brand IS NOT DISTINCT FROM p.brand
                    WHERE s.sale_date <= CURRENT_DATE
                    ORDER BY p.product_id, s.sale_date DESC, s.sale_id DESC
                ), inventory_snapshot AS (
                    SELECT
                        p.product_id,
                        GREATEST(COALESCE(latest_stock.stock_remaining, 0), 0) AS stock_remaining
                    FROM products p
                    LEFT JOIN latest_stock ON latest_stock.product_id = p.product_id
                )
                UPDATE inventory i
                SET
                    stock_remaining = inventory_snapshot.stock_remaining,
                    last_updated = CURRENT_TIMESTAMP
                FROM inventory_snapshot
                WHERE i.product_id = inventory_snapshot.product_id
            """))

        _refresh_all_alerts(connection)


def _refresh_all_alerts(connection):
    connection.execute(text("""
        UPDATE inventory_alerts alert
        SET
            status = 'resolved',
            resolved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE alert.status = 'active'
          AND NOT EXISTS (
              SELECT 1
              FROM inventory i
              WHERE i.product_id = alert.product_id
                AND i.stock_remaining <= COALESCE(i.reorder_level, 20)
          )
    """))

    connection.execute(text("""
        WITH inventory_state AS (
            SELECT
                i.product_id,
                i.stock_remaining,
                COALESCE(i.reorder_level, 20) AS reorder_level,
                COALESCE(SUM(s.quantity), 0)::numeric / 30 AS daily_velocity
            FROM inventory i
            JOIN products p ON p.product_id = i.product_id
            LEFT JOIN sales s
              ON s.product_name = p.product_name
             AND s.brand IS NOT DISTINCT FROM p.brand
             AND s.sale_date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE
            GROUP BY i.product_id, i.stock_remaining, i.reorder_level
        )
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            stock_remaining,
            reorder_level,
            stock_coverage_days,
            status
        )
        SELECT
            product_id,
            CASE WHEN stock_remaining <= 0 THEN 'out_of_stock' ELSE 'low_stock' END,
            stock_remaining,
            reorder_level,
            CASE
                WHEN daily_velocity > 0
                THEN GREATEST(stock_remaining, 0) / daily_velocity
                WHEN stock_remaining <= 0 THEN 0
                ELSE NULL
            END,
            'active'
        FROM inventory_state
        WHERE stock_remaining <= reorder_level
        ON CONFLICT (product_id) WHERE status = 'active'
        DO UPDATE SET
            alert_type = EXCLUDED.alert_type,
            stock_remaining = EXCLUDED.stock_remaining,
            reorder_level = EXCLUDED.reorder_level,
            stock_coverage_days = EXCLUDED.stock_coverage_days,
            updated_at = CURRENT_TIMESTAMP,
            resolved_at = NULL
    """))


def apply_inventory_sale(cursor, sale):
    product_name = sale.get("product_name")
    if not product_name:
        raise ValueError("Cannot update inventory for a sale without a product name")

    brand = sale.get("brand")
    quantity = int(sale.get("quantity") or 0)
    if quantity <= 0:
        raise ValueError("Inventory quantity must be greater than zero")

    cursor.execute("""
        SELECT product_id
        FROM products
        WHERE product_name = %s
          AND brand IS NOT DISTINCT FROM %s
        FOR UPDATE
    """, (product_name, brand))
    product = cursor.fetchone()
    if product is None:
        raise RuntimeError(f"Product was not found while updating inventory: {product_name}")

    product_id = product[0]
    stock_snapshot = sale.get("stock_remaining")
    if stock_snapshot is None:
        opening_stock = quantity
    else:
        opening_stock = max(int(stock_snapshot), 0) + quantity

    cursor.execute("""
        INSERT INTO inventory (product_id, stock_remaining, last_updated)
        VALUES (%s, %s - %s, CURRENT_TIMESTAMP)
        ON CONFLICT (product_id) WHERE product_id IS NOT NULL
        DO UPDATE SET
            stock_remaining = GREATEST(inventory.stock_remaining - %s, 0),
            last_updated = CURRENT_TIMESTAMP
    """, (product_id, opening_stock, quantity, quantity))

    return product_id


def refresh_inventory_alert(cursor, product_id):
    cursor.execute("""
        UPDATE inventory_alerts alert
        SET
            status = 'resolved',
            resolved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE alert.product_id = %s
          AND alert.status = 'active'
          AND NOT EXISTS (
              SELECT 1
              FROM inventory i
              WHERE i.product_id = %s
                AND i.stock_remaining <= COALESCE(i.reorder_level, 20)
          )
    """, (product_id, product_id))

    cursor.execute("""
        WITH inventory_state AS (
            SELECT
                i.product_id,
                i.stock_remaining,
                COALESCE(i.reorder_level, 20) AS reorder_level,
                COALESCE(velocity.units_sold, 0)::numeric / 30 AS daily_velocity
            FROM inventory i
            JOIN products p ON p.product_id = i.product_id
            LEFT JOIN LATERAL (
                SELECT SUM(s.quantity) AS units_sold
                FROM sales s
                WHERE s.product_name = p.product_name
                  AND s.brand IS NOT DISTINCT FROM p.brand
                  AND s.sale_date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE
            ) velocity ON TRUE
            WHERE i.product_id = %s
        )
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            stock_remaining,
            reorder_level,
            stock_coverage_days,
            status
        )
        SELECT
            product_id,
            CASE WHEN stock_remaining <= 0 THEN 'out_of_stock' ELSE 'low_stock' END,
            stock_remaining,
            reorder_level,
            CASE
                WHEN daily_velocity > 0
                THEN GREATEST(stock_remaining, 0) / daily_velocity
                WHEN stock_remaining <= 0 THEN 0
                ELSE NULL
            END,
            'active'
        FROM inventory_state
        WHERE stock_remaining <= reorder_level
        ON CONFLICT (product_id) WHERE status = 'active'
        DO UPDATE SET
            alert_type = EXCLUDED.alert_type,
            stock_remaining = EXCLUDED.stock_remaining,
            reorder_level = EXCLUDED.reorder_level,
            stock_coverage_days = EXCLUDED.stock_coverage_days,
            updated_at = CURRENT_TIMESTAMP,
            resolved_at = NULL
    """, (product_id,))