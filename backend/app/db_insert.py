import pandas as pd
import psycopg2
import json
import math
import hashlib

from .database import DATABASE_URL, engine
from .inventory_automation import (
    apply_inventory_sale,
    refresh_inventory_alert,
)


def clean_for_json(value):
    """
    Convert pandas / numpy values into
    PostgreSQL-compatible JSON values.
    """

    if pd.isna(value):
        return None

    if isinstance(value, dict):
        return {
            key: clean_for_json(val)
            for key, val in value.items()
        }

    if isinstance(value, list):
        return [
            clean_for_json(item)
            for item in value
        ]

    if isinstance(value, tuple):
        return [
            clean_for_json(item)
            for item in value
        ]

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    return value


def insert_sales(df: pd.DataFrame) -> int:

    if df.empty:
        return 0

    df = df.copy()

    # Generate hash using database column names
    df["record_hash"] = df.apply(
        generate_record_hash,
        axis=1
    )

    connection = psycopg2.connect(DATABASE_URL)

    try:

        cursor = connection.cursor()

        columns = list(df.columns)

        column_names = ", ".join(
            f'"{column}"'
            for column in columns
        )

        placeholders = ", ".join(
            ["%s"] * len(columns)
        )

        query = f"""
            INSERT INTO sales ({column_names})
            VALUES ({placeholders})
            ON CONFLICT (record_hash)
            DO NOTHING
        """

        rows = [
            tuple(
                None if pd.isna(value) else value
                for value in row
            )
            for row in df.itertuples(
                index=False,
                name=None
            )
        ]

        inserted_count = 0
        affected_products = set()

        for row in rows:

            sale = dict(zip(columns, row))
            cursor.execute("""
                SELECT 1
                FROM sales
                WHERE invoice_id IS NOT DISTINCT FROM %s
                  AND sale_date IS NOT DISTINCT FROM %s
                  AND customer_id IS NOT DISTINCT FROM %s
                  AND product_name IS NOT DISTINCT FROM %s
                  AND quantity IS NOT DISTINCT FROM %s
                  AND total_amount IS NOT DISTINCT FROM %s
                LIMIT 1
            """, (
                sale.get("invoice_id"),
                sale.get("sale_date"),
                sale.get("customer_id"),
                sale.get("product_name"),
                sale.get("quantity"),
                sale.get("total_amount"),
            ))
            if cursor.fetchone() is not None:
                continue

            cursor.execute(
                query,
                row
            )

            if cursor.rowcount == 1:
                inserted_count += 1
                product_id = apply_inventory_sale(cursor, sale)
                affected_products.add(product_id)

        for product_id in affected_products:
            refresh_inventory_alert(cursor, product_id)

        connection.commit()

        return inserted_count

    except Exception:

        connection.rollback()

        raise

    finally:

        cursor.close()
        connection.close()


def insert_customers(df: pd.DataFrame) -> int:

    if df.empty:
        return 0

    connection = psycopg2.connect(DATABASE_URL)

    try:

        cursor = connection.cursor()

        query = """
            INSERT INTO customers (
                customer_id,
                customer_name,
                mobile_number,
                gender,
                age,
                city
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (customer_id)
            DO UPDATE SET
                customer_name = EXCLUDED.customer_name,
                mobile_number = EXCLUDED.mobile_number,
                gender = EXCLUDED.gender,
                age = EXCLUDED.age,
                city = EXCLUDED.city
        """

        rows = []

        for _, row in df.iterrows():

            rows.append((
                row.get("Customer_ID"),
                row.get("Customer_Name"),
                row.get("Mobile_Number"),
                row.get("Gender"),
                row.get("Age"),
                row.get("City")
            ))

        cursor.executemany(query, rows)

        connection.commit()

        return len(rows)

    except Exception:

        connection.rollback()

        raise

    finally:

        cursor.close()
        connection.close()


def insert_products(df: pd.DataFrame) -> int:

    if df.empty:
        return 0

    connection = psycopg2.connect(DATABASE_URL)

    try:

        cursor = connection.cursor()

        query = """
            INSERT INTO products (
                product_name,
                product_category,
                brand,
                unit_price
            )
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (product_name, brand)
            DO UPDATE SET
                product_category = EXCLUDED.product_category,
                unit_price = EXCLUDED.unit_price
        """

        rows = []

        unique_products = df[
            [
                "Product_Name",
                "Product_Category",
                "Brand",
                "Unit_Price"
            ]
        ].drop_duplicates(
            subset=[
                "Product_Name",
                "Brand"
            ]
        )

        for _, row in unique_products.iterrows():

            rows.append((
                row.get("Product_Name"),
                row.get("Product_Category"),
                row.get("Brand"),
                row.get("Unit_Price")
            ))

        cursor.executemany(query, rows)

        connection.commit()

        return len(rows)

    except Exception:

        connection.rollback()

        raise

    finally:

        cursor.close()
        connection.close()


def insert_quality_logs(
    invalid_df: pd.DataFrame,
    upload_id: int
):

    if invalid_df.empty:
        return 0

    connection = engine.raw_connection()

    try:

        cursor = connection.cursor()

        inserted_logs = 0

        for _, row in invalid_df.iterrows():

            raw_data = clean_for_json(
                row.get("raw_data")
            )

            errors = row.get("errors")

            if pd.isna(errors):
                errors = ""
            else:
                errors = str(errors)

            # --------------------------------------------------
            # Split multiple validation errors into
            # separate database log records.
            #
            # Example:
            # "Missing Customer_ID | Missing Total_Amount"
            #
            # becomes:
            # 1. Missing Customer_ID
            # 2. Missing Total_Amount
            # --------------------------------------------------

            error_list = [
                error.strip()
                for error in errors.split("|")
                if error.strip()
            ]

            for error in error_list:

                cursor.execute(
                    """
                    INSERT INTO data_quality_logs
                    (
                        upload_id,
                        invoice_id,
                        error_type,
                        error_message,
                        raw_data
                    )
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        upload_id,
                        row.get("invoice_id"),
                        error,
                        error,
                        json.dumps(
                            raw_data,
                            allow_nan=False
                        )
                    )
                )

                inserted_logs += 1

        connection.commit()

        return inserted_logs

    except Exception:

        connection.rollback()

        raise

    finally:

        cursor.close()
        connection.close()


def generate_record_hash(row):

    sale_date = row.get("sale_date")

    if pd.notna(sale_date):

        sale_date = pd.to_datetime(
            sale_date,
            errors="coerce"
        )

        if pd.notna(sale_date):
            sale_date = sale_date.strftime("%Y-%m-%d")
        else:
            sale_date = ""

    else:
        sale_date = ""

    customer_id = (
        ""
        if pd.isna(row.get("customer_id"))
        else str(
            row.get("customer_id")
        ).strip().lower()
    )

    product_name = (
        ""
        if pd.isna(row.get("product_name"))
        else str(
            row.get("product_name")
        ).strip().lower()
    )

    invoice_id = (
        ""
        if pd.isna(row.get("invoice_id"))
        else str(
            row.get("invoice_id")
        ).strip().lower()
    )

    quantity = (
        ""
        if pd.isna(row.get("quantity"))
        else str(
            int(row.get("quantity"))
        )
    )

    total_amount = (
        ""
        if pd.isna(row.get("total_amount"))
        else f"{float(row.get('total_amount')):.2f}"
    )

    normalized = "|".join([
        invoice_id,
        sale_date,
        customer_id,
        product_name,
        quantity,
        total_amount
    ])

    return hashlib.sha256(
        normalized.encode("utf-8")
    ).hexdigest()