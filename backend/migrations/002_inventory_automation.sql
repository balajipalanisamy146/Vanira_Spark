CREATE TABLE IF NOT EXISTS inventory (
    inventory_id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NULL REFERENCES products(product_id),
    stock_remaining INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS product_id BIGINT;

ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS stock_remaining INTEGER NOT NULL DEFAULT 0;

ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;

ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS sales_inventory_velocity_idx
    ON sales (sale_date, product_name, brand)
    INCLUDE (quantity);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_product_id_uq
    ON inventory (product_id)
    WHERE product_id IS NOT NULL;

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
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_alerts_active_product_uq
    ON inventory_alerts (product_id)
    WHERE status = 'active';

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
ON CONFLICT (product_id) WHERE product_id IS NOT NULL DO NOTHING;

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
  );

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
    resolved_at = NULL;