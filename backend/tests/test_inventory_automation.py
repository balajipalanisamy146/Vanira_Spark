import unittest
from unittest.mock import patch

import pandas as pd

from app import db_insert
from app.ingestion import parse_sale_dates


class FakeCursor:
    def __init__(self):
        self.rowcount = 0
        self.sales_rowcounts = iter((1, 0))
        self.executed = []
        self.fetch_result = None
        self.existing_sale = False

    def execute(self, query, params=None):
        self.executed.append((query, params))
        if query.lstrip().startswith("INSERT INTO sales"):
            self.rowcount = next(self.sales_rowcounts)
        elif "SELECT 1" in query and "FROM sales" in query:
            self.rowcount = 1
            self.fetch_result = (1,) if self.existing_sale else None
        elif "SELECT product_id" in query:
            self.rowcount = 1
            self.fetch_result = (17,)
        else:
            self.rowcount = 1

    def fetchone(self):
        return self.fetch_result

    def close(self):
        pass


class FakeConnection:
    def __init__(self):
        self.fake_cursor = FakeCursor()
        self.committed = False
        self.rolled_back = False

    def cursor(self):
        return self.fake_cursor

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        pass


class InventoryUploadTests(unittest.TestCase):
    def test_sale_date_parser_preserves_iso_and_dayfirst_formats(self):
        values = pd.Series([
            "2026-09-12",
            "12-09-2026",
            "2026-10-12 14:30:00",
        ])

        parsed = parse_sale_dates(values)

        self.assertEqual(
            parsed.dt.strftime("%Y-%m-%d").tolist(),
            ["2026-09-12", "2026-09-12", "2026-10-12"],
        )

    def test_only_new_sales_decrement_inventory(self):
        connection = FakeConnection()
        sales = pd.DataFrame([
            {
                "invoice_id": "invoice-1",
                "sale_date": "2026-09-28",
                "customer_id": "customer-1",
                "product_name": "Widget",
                "brand": "Acme",
                "quantity": 2,
                "total_amount": 50.0,
                "stock_remaining": 8,
            },
            {
                "invoice_id": "invoice-2",
                "sale_date": "2026-09-29",
                "customer_id": "customer-2",
                "product_name": "Widget",
                "brand": "Acme",
                "quantity": 3,
                "total_amount": 75.0,
                "stock_remaining": 5,
            },
        ])

        with (
            patch.object(db_insert.psycopg2, "connect", return_value=connection),
            patch.object(db_insert, "refresh_inventory_alert") as refresh_alert,
        ):
            inserted = db_insert.insert_sales(sales)

        self.assertEqual(inserted, 1)
        self.assertTrue(connection.committed)
        self.assertFalse(connection.rolled_back)

        inventory_writes = [
            (query, params)
            for query, params in connection.fake_cursor.executed
            if "INSERT INTO inventory" in query
        ]
        self.assertEqual(len(inventory_writes), 1)
        self.assertEqual(inventory_writes[0][1], (17, 10, 2, 2))
        self.assertIn("GREATEST(inventory.stock_remaining - %s, 0)", inventory_writes[0][0])
        refresh_alert.assert_called_once_with(connection.fake_cursor, 17)

    def test_corrected_duplicate_upload_does_not_touch_inventory(self):
        connection = FakeConnection()
        sales = pd.DataFrame([{
            "invoice_id": "INV-202609-0752",
            "sale_date": "2026-09-12",
            "customer_id": "CUST0231",
            "product_name": "Acer Aspire 5",
            "brand": "Vivo",
            "quantity": 2,
            "total_amount": 254030.0,
            "stock_remaining": 40,
        }])
        connection.fake_cursor.existing_sale = True

        with (
            patch.object(db_insert.psycopg2, "connect", return_value=connection),
            patch.object(db_insert, "refresh_inventory_alert") as refresh_alert,
        ):
            inserted = db_insert.insert_sales(sales)

        self.assertEqual(inserted, 0)
        self.assertFalse(any(
            "INSERT INTO inventory" in query
            for query, _ in connection.fake_cursor.executed
        ))
        refresh_alert.assert_not_called()


if __name__ == "__main__":
    unittest.main()