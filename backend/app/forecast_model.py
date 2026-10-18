from datetime import date, datetime, timezone
from importlib.metadata import version

import numpy as np
import pandas as pd
from sqlalchemy import text

from app.database import engine


MODEL_NAME = "facebook_prophet"
MINIMUM_HISTORY_DAYS = 7
ACCURACY_HOLDOUT_DAYS = 7


def _current_date():
    return date.today()


def ensure_forecast_schema():
    statements = (
        """
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
        )
        """,
        "ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS model_name VARCHAR(100) NOT NULL DEFAULT 'legacy'",
        "ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS model_version VARCHAR(50) NOT NULL DEFAULT 'unknown'",
        "ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP",
        """
        CREATE UNIQUE INDEX IF NOT EXISTS forecasts_prophet_aggregate_date_uq
        ON forecasts (forecast_date)
        WHERE product_id IS NULL AND model_name = 'facebook_prophet'
        """,
        """
        CREATE TABLE IF NOT EXISTS festivals (
            festival_id BIGSERIAL PRIMARY KEY,
            festival_name VARCHAR(100) NOT NULL,
            festival_date DATE NOT NULL,
            festival_type VARCHAR(100),
            region VARCHAR(100),
            previous_year_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
    )

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def _load_prophet():
    from prophet import Prophet

    return Prophet, version("prophet")


def _load_historical_sales():
    query = text("""
        SELECT
            sale_date,
            SUM(total_amount) AS sales
        FROM sales
        WHERE sale_date IS NOT NULL
                    AND sale_date <= CURRENT_DATE
        GROUP BY sale_date
        ORDER BY sale_date
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).fetchall()

    if not rows:
        return pd.DataFrame(columns=["ds", "y"])

    history = pd.DataFrame(rows, columns=["ds", "y"])
    history["ds"] = pd.to_datetime(history["ds"], errors="coerce").dt.normalize()
    history["y"] = pd.to_numeric(history["y"], errors="coerce")
    history = history.dropna(subset=["ds", "y"])
    history.loc[history["y"] < 0, "y"] = 0
    history = history.groupby("ds", as_index=False)["y"].sum()

    if history.empty:
        return pd.DataFrame(columns=["ds", "y"])

    return history.sort_values("ds").reset_index(drop=True)


def _load_festival_holidays(start_date, end_date):
    query = text("""
        SELECT
            festival_name AS holiday,
            festival_date AS ds
        FROM festivals
        WHERE festival_date BETWEEN :start_date AND :end_date
        ORDER BY festival_date, festival_name
    """)

    with engine.connect() as connection:
        rows = connection.execute(
            query,
            {"start_date": start_date, "end_date": end_date},
        ).fetchall()

    if not rows:
        return None

    holidays = pd.DataFrame(rows, columns=["holiday", "ds"])
    holidays["ds"] = pd.to_datetime(holidays["ds"], errors="coerce").dt.normalize()
    holidays["holiday"] = holidays["holiday"].astype(str).str.strip()
    holidays = holidays.dropna(subset=["ds"])
    holidays = holidays[holidays["holiday"] != ""]
    return holidays.drop_duplicates(subset=["holiday", "ds"])


def _fit_and_predict(history, periods, holidays, future_dates=None):
    prophet_class, _ = _load_prophet()
    history = history[["ds", "y"]].copy()
    history["ds"] = pd.to_datetime(history["ds"])
    history["y"] = np.log1p(history["y"].clip(lower=0))

    model = prophet_class(
        holidays=holidays,
        weekly_seasonality=True,
        yearly_seasonality=(history["ds"].max() - history["ds"].min()).days >= 730,
        daily_seasonality=False,
        interval_width=0.8,
        uncertainty_samples=200,
    )
    model.fit(history)
    if future_dates is None:
        future = model.make_future_dataframe(periods=periods, include_history=False)
    else:
        future = pd.DataFrame({"ds": pd.to_datetime(future_dates)})
    predictions = model.predict(future)
    for column in ("yhat", "yhat_lower", "yhat_upper"):
        if column in predictions:
            predictions[column] = np.expm1(predictions[column]).clip(lower=0)
    return predictions


def _confidence_score(prediction, lower, upper):
    if pd.isna(lower) or pd.isna(upper):
        return None
    scale = max(abs(float(prediction)), 1.0)
    return round(max(0.0, min(100.0, 100 * (1 - (float(upper) - float(lower)) / scale))), 2)


def _save_predictions(predictions, model_version):
    if predictions.empty:
        return

    generated_at = datetime.now(timezone.utc)

    insert_query = text("""
        INSERT INTO forecasts (
            product_id,
            forecast_date,
            predicted_quantity,
            predicted_sales,
            confidence_score,
            model_name,
            model_version,
            generated_at
        )
        VALUES (
            NULL,
            :forecast_date,
            NULL,
            :predicted_sales,
            :confidence_score,
            :model_name,
            :model_version,
            :generated_at
        )
        ON CONFLICT (forecast_date)
        WHERE product_id IS NULL AND model_name = 'facebook_prophet'
        DO UPDATE SET
            predicted_sales = EXCLUDED.predicted_sales,
            confidence_score = EXCLUDED.confidence_score,
            model_version = EXCLUDED.model_version,
            generated_at = EXCLUDED.generated_at
    """)

    records = [
        {
            "forecast_date": row.ds.date(),
            "predicted_sales": round(max(float(row.yhat), 0.0), 2),
            "confidence_score": _confidence_score(row.yhat, row.yhat_lower, row.yhat_upper),
            "model_name": MODEL_NAME,
            "model_version": model_version,
            "generated_at": generated_at,
        }
        for row in predictions.itertuples(index=False)
    ]

    with engine.begin() as connection:
        connection.execute(insert_query, records)


def _predict_from_history(history, days):
    today = pd.Timestamp(_current_date()).normalize()
    history = history.copy()
    history["ds"] = pd.to_datetime(history["ds"], errors="coerce").dt.normalize()
    history = history.dropna(subset=["ds"])
    history = history[history["ds"] <= today].sort_values("ds")

    if len(history) < MINIMUM_HISTORY_DAYS:
        return pd.DataFrame()

    prophet_class, model_version = _load_prophet()
    last_history_date = history["ds"].max()
    forecast_start = max(last_history_date, today) + pd.Timedelta(days=1)
    future_dates = pd.date_range(forecast_start, periods=days, freq="D")
    forecast_end = future_dates[-1]
    holidays = _load_festival_holidays(history["ds"].min().date(), forecast_end.date())

    predictions = _fit_and_predict(
        history,
        days,
        holidays,
        future_dates=future_dates,
    )
    predictions["ds"] = pd.to_datetime(predictions["ds"]).dt.normalize()
    predictions = predictions.sort_values("ds").head(days).copy()
    predictions["yhat"] = pd.to_numeric(predictions["yhat"], errors="coerce").fillna(0).clip(lower=0)
    predictions["yhat_lower"] = pd.to_numeric(predictions.get("yhat_lower"), errors="coerce")
    predictions["yhat_upper"] = pd.to_numeric(predictions.get("yhat_upper"), errors="coerce")

    if len(predictions) == days:
        _save_predictions(predictions, model_version)

    return predictions


def generate_forecast(days):
    if days not in (7, 30, 90):
        raise ValueError("Forecast horizon must be 7, 30, or 90 days")

    history = _load_historical_sales()
    if len(history) < MINIMUM_HISTORY_DAYS:
        return []

    predictions = _predict_from_history(history, days)
    return [
        {
            "date": row.ds.strftime("%Y-%m-%d"),
            "forecast_sales": round(float(row.yhat), 2),
        }
        for row in predictions.itertuples(index=False)
    ]


def calculate_forecast_accuracy():
    history = _load_historical_sales()
    required_days = MINIMUM_HISTORY_DAYS + ACCURACY_HOLDOUT_DAYS
    _, model_version = _load_prophet()

    result = {
        "model_name": MODEL_NAME,
        "model_version": model_version,
        "metric": "MAPE",
        "mape": None,
        "accuracy_percentage": None,
        "evaluation_days": 0,
        "excluded_zero_actual_days": 0,
        "status": "insufficient_data",
    }
    if len(history) < required_days:
        return result

    training = history.iloc[:-ACCURACY_HOLDOUT_DAYS].copy()
    actual = history.iloc[-ACCURACY_HOLDOUT_DAYS:].copy()
    holidays = _load_festival_holidays(
        history["ds"].min().date(),
        history["ds"].max().date(),
    )
    prediction = _fit_and_predict(
        training,
        len(actual),
        holidays,
        future_dates=actual["ds"],
    )
    prediction["ds"] = pd.to_datetime(prediction["ds"]).dt.normalize()
    comparison = actual.merge(
        prediction[["ds", "yhat"]],
        on="ds",
        how="inner",
    )
    nonzero_actual = comparison[comparison["y"] != 0]
    if nonzero_actual.empty:
        result.update({
            "evaluation_days": len(comparison),
            "excluded_zero_actual_days": len(comparison),
            "status": "no_nonzero_actuals",
        })
        return result

    mape = (
        (nonzero_actual["y"] - nonzero_actual["yhat"]).abs()
        / nonzero_actual["y"].abs()
    ).mean() * 100
    mape = round(float(mape), 2)
    result.update({
        "mape": mape,
        "accuracy_percentage": round(max(0.0, 100 - mape), 2),
        "evaluation_days": len(nonzero_actual),
        "excluded_zero_actual_days": len(comparison) - len(nonzero_actual),
        "status": "calculated",
    })
    return result