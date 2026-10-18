import unittest
from datetime import date
from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd

from app import forecast_model


class ForecastModelTests(unittest.TestCase):
    def setUp(self):
        self.history = pd.DataFrame({
            "ds": pd.date_range("2026-01-01", periods=14, freq="D"),
            "y": [100.0] * 14,
        })

    def test_missing_transaction_dates_are_not_filled_as_zero_sales(self):
        connection = MagicMock()
        connection.execute.return_value.fetchall.return_value = [
            (date(2026, 1, 1), 100.0),
            (date(2026, 1, 3), 300.0),
        ]
        context = MagicMock()
        context.__enter__.return_value = connection

        with patch.object(forecast_model.engine, "connect", return_value=context):
            history = forecast_model._load_historical_sales()

        self.assertEqual(len(history), 2)
        self.assertEqual(history["y"].tolist(), [100.0, 300.0])

    def test_model_predictions_are_returned_in_sales_units(self):
        class FakeProphet:
            def __init__(self, **kwargs):
                self.training = None

            def fit(self, history):
                self.training = history.copy()

            def make_future_dataframe(self, periods, include_history):
                return pd.DataFrame({
                    "ds": pd.date_range("2026-01-15", periods=periods, freq="D"),
                })

            def predict(self, future):
                return pd.DataFrame({
                    "ds": future["ds"],
                    "yhat": [np.log1p(500.0)] * len(future),
                    "yhat_lower": [np.log1p(400.0)] * len(future),
                    "yhat_upper": [np.log1p(600.0)] * len(future),
                })

        with patch.object(forecast_model, "_load_prophet", return_value=(FakeProphet, "test-version")):
            predictions = forecast_model._fit_and_predict(self.history, 1, None)

        self.assertAlmostEqual(predictions.loc[0, "yhat"], 500.0)
        self.assertAlmostEqual(predictions.loc[0, "yhat_lower"], 400.0)
        self.assertAlmostEqual(predictions.loc[0, "yhat_upper"], 600.0)

    def test_forecast_starts_after_today_and_ignores_future_sales(self):
        history = pd.DataFrame({
            "ds": list(pd.date_range("2026-09-01", periods=10, freq="D"))
            + [pd.Timestamp("2026-12-11")],
            "y": [100.0] * 11,
        })
        future_dates = pd.date_range("2026-09-30", periods=7, freq="D")
        predictions = pd.DataFrame({
            "ds": future_dates,
            "yhat": [100.0] * 7,
            "yhat_lower": [90.0] * 7,
            "yhat_upper": [110.0] * 7,
        })

        with (
            patch.object(forecast_model, "_current_date", return_value=date(2026, 9, 29)),
            patch.object(forecast_model, "_load_prophet", return_value=(None, "test-version")),
            patch.object(forecast_model, "_load_festival_holidays", return_value=None),
            patch.object(forecast_model, "_fit_and_predict", return_value=predictions) as fit,
            patch.object(forecast_model, "_save_predictions"),
        ):
            result = forecast_model._predict_from_history(history, 7)

        self.assertEqual(result["ds"].min(), pd.Timestamp("2026-09-30"))
        self.assertEqual(result["ds"].max(), pd.Timestamp("2026-10-06"))
        training_history = fit.call_args.args[0]
        self.assertLessEqual(training_history["ds"].max(), pd.Timestamp("2026-09-29"))
        self.assertEqual(
            fit.call_args.kwargs["future_dates"].tolist(),
            future_dates.tolist(),
        )

    def test_generates_supported_horizons_in_legacy_shape(self):
        def predict_for_horizon(history, horizon):
            return pd.DataFrame({
                "ds": pd.date_range("2026-01-15", periods=horizon, freq="D"),
                "yhat": [125.25] * horizon,
            })

        with (
            patch.object(forecast_model, "_load_historical_sales", return_value=self.history),
            patch.object(forecast_model, "_predict_from_history", side_effect=predict_for_horizon) as predict,
        ):
            for horizon in (7, 30, 90):
                result = forecast_model.generate_forecast(horizon)
                self.assertEqual(len(result), horizon)
                self.assertEqual(set(result[0]), {"date", "forecast_sales"})
                self.assertEqual(result[0]["forecast_sales"], 125.25)
                predict.assert_called_with(self.history, horizon)

    def test_accuracy_uses_nonzero_actuals_for_mape(self):
        history = self.history.copy()
        history["ds"] = pd.date_range("2026-01-01", periods=14, freq="2D")
        history.loc[13, "y"] = 0
        backtest = pd.DataFrame({
            "ds": history["ds"].iloc[-7:].to_list(),
            "yhat": [90.0] * 7,
        })

        with (
            patch.object(forecast_model, "_load_historical_sales", return_value=history),
            patch.object(forecast_model, "_load_prophet", return_value=(None, "test-version")),
            patch.object(forecast_model, "_load_festival_holidays", return_value=None),
            patch.object(forecast_model, "_fit_and_predict", return_value=backtest) as fit,
        ):
            result = forecast_model.calculate_forecast_accuracy()

        self.assertEqual(
            fit.call_args.kwargs["future_dates"].tolist(),
            history["ds"].iloc[-7:].tolist(),
        )
        self.assertEqual(result["mape"], 10.0)
        self.assertEqual(result["accuracy_percentage"], 90.0)
        self.assertEqual(result["evaluation_days"], 6)
        self.assertEqual(result["excluded_zero_actual_days"], 1)
        self.assertEqual(result["status"], "calculated")

    def test_saves_aggregate_prediction_metadata(self):
        predictions = pd.DataFrame({
            "ds": [pd.Timestamp("2026-01-15")],
            "yhat": [125.25],
            "yhat_lower": [100.0],
            "yhat_upper": [150.0],
        })
        connection = MagicMock()
        transaction = MagicMock()
        transaction.__enter__.return_value = connection

        with patch.object(forecast_model.engine, "begin", return_value=transaction):
            forecast_model._save_predictions(predictions, "test-version")

        self.assertEqual(connection.execute.call_count, 1)
        insert_arguments = connection.execute.call_args.args[1]
        self.assertEqual(insert_arguments[0]["forecast_date"].isoformat(), "2026-01-15")
        self.assertEqual(insert_arguments[0]["predicted_sales"], 125.25)
        self.assertEqual(insert_arguments[0]["model_name"], forecast_model.MODEL_NAME)
        self.assertEqual(insert_arguments[0]["model_version"], "test-version")
        self.assertIsNone(insert_arguments[0].get("product_id"))


if __name__ == "__main__":
    unittest.main()