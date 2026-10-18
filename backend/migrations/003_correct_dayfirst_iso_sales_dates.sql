CREATE TABLE IF NOT EXISTS inventory_schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

BEGIN;

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
      SUBSTRING(invoice_id FROM 9 FOR 2)::integer;

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
WHERE i.product_id = inventory_snapshot.product_id;

UPDATE inventory_alerts alert
SET
    status = 'resolved',
    resolved_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE alert.status = 'active';

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

INSERT INTO inventory_schema_migrations (version)
VALUES ('003_correct_dayfirst_iso_sales_dates')
ON CONFLICT (version) DO NOTHING;

COMMIT;