CREATE TABLE IF NOT EXISTS forecasts (
    forecast_id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NULL,
    forecast_date DATE NOT NULL,
    predicted_quantity NUMERIC(12, 2) NULL,
    predicted_sales NUMERIC(12, 2) NULL,
    confidence_score NUMERIC(5, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_name VARCHAR(100) NOT NULL DEFAULT 'legacy',
    model_version VARCHAR(50) NOT NULL DEFAULT 'unknown',
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE forecasts
    ADD COLUMN IF NOT EXISTS model_name VARCHAR(100) NOT NULL DEFAULT 'legacy';

ALTER TABLE forecasts
    ADD COLUMN IF NOT EXISTS model_version VARCHAR(50) NOT NULL DEFAULT 'unknown';

ALTER TABLE forecasts
    ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS forecasts_prophet_aggregate_date_uq
    ON forecasts (forecast_date)
    WHERE product_id IS NULL AND model_name = 'facebook_prophet';

CREATE TABLE IF NOT EXISTS festivals (
    festival_id BIGSERIAL PRIMARY KEY,
    festival_name VARCHAR(100) NOT NULL,
    festival_date DATE NOT NULL,
    festival_type VARCHAR(100),
    region VARCHAR(100),
    previous_year_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);