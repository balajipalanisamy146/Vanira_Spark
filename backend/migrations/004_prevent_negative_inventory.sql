BEGIN;

UPDATE inventory
SET stock_remaining = 0
WHERE stock_remaining < 0;

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
END $$;

COMMIT;