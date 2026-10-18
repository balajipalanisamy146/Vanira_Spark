import pandas as pd
import numpy as np
import re
from pathlib import Path

from app.db_insert import (
    insert_sales,
    insert_quality_logs,
    insert_customers,
    insert_products
)
from app.validation import validate_data
from app.upload_history import (save_upload_history, update_upload_history)

# =========================================================
# REQUIRED EXCEL COLUMNS
# =========================================================

REQUIRED_COLUMNS = [
    "Invoice_ID",
    "Date",
    "Customer_ID",
    "Customer_Name",
    "Mobile_Number",
    "Gender",
    "Age",
    "City",
    "Product_Category",
    "Product_Name",
    "Brand",
    "Quantity",
    "Unit_Price",
    "Discount",
    "Total_Amount",
    "Payment_Method",
    "Festival",
    "Profit",
    "Stock_Remaining"
]


# =========================================================
# MANDATORY COLUMNS
# =========================================================

MANDATORY_COLUMNS = [
    "Invoice_ID",
    "Date",
    "Customer_ID",
    "Product_Name",
    "Quantity",
    "Unit_Price",
    "Total_Amount"
]


# =========================================================
# EXCEL → DATABASE COLUMN MAPPING
# =========================================================

COLUMN_MAPPING = {
    "Invoice_ID": "invoice_id",
    "Date": "sale_date",
    "Customer_ID": "customer_id",
    "Customer_Name": "customer_name",
    "Mobile_Number": "mobile_number",
    "Gender": "gender",
    "Age": "age",
    "City": "city",
    "Product_Category": "product_category",
    "Product_Name": "product_name",
    "Brand": "brand",
    "Quantity": "quantity",
    "Unit_Price": "unit_price",
    "Discount": "discount",
    "Total_Amount": "total_amount",
    "Payment_Method": "payment_method",
    "Festival": "festival",
    "Profit": "profit",
    "Stock_Remaining": "stock_remaining"
}


# =========================================================
# VALIDATE COLUMNS
# =========================================================

def validate_columns(df):

    missing = []

    for col in REQUIRED_COLUMNS:

        if col not in df.columns:
            missing.append(col)

    return missing


# =========================================================
# CLEAN MOBILE NUMBER
# =========================================================

def clean_mobile(value):

    if pd.isna(value):
        return np.nan

    digits = re.sub(r"\D", "", str(value))

    if len(digits) >= 10:
        return digits[-10:]

    return np.nan


def parse_sale_dates(values):
    date_text = values.astype("string").str.strip()
    year_first = date_text.str.match(
        r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T].*)?$",
        na=False,
    )
    parsed = pd.Series(
        pd.NaT,
        index=values.index,
        dtype="datetime64[ns]",
    )
    parsed.loc[year_first] = pd.to_datetime(
        date_text.loc[year_first],
        errors="coerce",
        format="mixed",
        yearfirst=True,
    )
    parsed.loc[~year_first] = pd.to_datetime(
        date_text.loc[~year_first],
        errors="coerce",
        dayfirst=True,
    )
    return parsed


# =========================================================
# CLEAN DATA
# =========================================================

def clean_data(df):

    # Remove completely empty rows
    df = df.dropna(how="all").copy()

    # -----------------------------------------------------
    # TEXT CLEANING
    # -----------------------------------------------------

    text_cols = [
        "Customer_Name",
        "City",
        "Product_Category",
        "Product_Name",
        "Brand",
        "Festival",
        "Payment_Method",
        "Gender"
    ]

    for col in text_cols:

        if col in df.columns:

            df[col] = (
                df[col]
                .fillna("")
                .astype(str)
                .str.strip()
            )

    # -----------------------------------------------------
    # TITLE CASE
    # -----------------------------------------------------

    for col in [
        "City",
        "Product_Category",
        "Brand"
    ]:

        if col in df.columns:

            df[col] = df[col].str.title()

    # -----------------------------------------------------
    # FESTIVAL STANDARDIZATION
    # -----------------------------------------------------

    festival_map = {
        "deepavali": "Diwali",
        "diwali": "Diwali",
        "pongal": "Pongal",
        "christmas": "Christmas",
        "new year": "New Year",
        "newyear": "New Year",
        "eid": "Eid",
        "ramzan": "Eid"
    }

    if "Festival" in df.columns:

        df["Festival"] = (
            df["Festival"]
            .str.lower()
            .map(festival_map)
            .fillna(df["Festival"])
        )

    # -----------------------------------------------------
    # PAYMENT METHOD STANDARDIZATION
    # -----------------------------------------------------

    payment_map = {
        "gpay": "UPI",
        "google pay": "UPI",
        "googlepay": "UPI",
        "phonepe": "UPI",
        "paytm": "UPI",
        "upi": "UPI",
        "cash": "Cash",
        "card": "Card",
        "credit card": "Card",
        "debit card": "Card"
    }

    if "Payment_Method" in df.columns:

        df["Payment_Method"] = (
            df["Payment_Method"]
            .str.lower()
            .map(payment_map)
            .fillna(df["Payment_Method"])
        )

    # -----------------------------------------------------
    # MOBILE NUMBER
    # -----------------------------------------------------

    if "Mobile_Number" in df.columns:

        df["Mobile_Number"] = (
            df["Mobile_Number"]
            .apply(clean_mobile)
        )

    # -----------------------------------------------------
    # DATE
    # -----------------------------------------------------

    if "Date" in df.columns:

        df["Date"] = parse_sale_dates(df["Date"])

    # -----------------------------------------------------
    # NUMERIC COLUMNS
    # -----------------------------------------------------

    numeric_cols = [
        "Age",
        "Quantity",
        "Unit_Price",
        "Discount",
        "Total_Amount",
        "Profit",
        "Stock_Remaining"
    ]

    for col in numeric_cols:

        if col in df.columns:

            df[col] = pd.to_numeric(
                df[col],
                errors="coerce"
            )

    # -----------------------------------------------------
    # AGE VALIDATION
    # -----------------------------------------------------

    if "Age" in df.columns:

        df.loc[
            (df["Age"] < 5) |
            (df["Age"] > 100),
            "Age"
        ] = np.nan

    # -----------------------------------------------------
    # QUANTITY VALIDATION
    # -----------------------------------------------------

    if "Quantity" in df.columns:

        df.loc[
            df["Quantity"] <= 0,
            "Quantity"
        ] = np.nan

    # -----------------------------------------------------
    # UNIT PRICE VALIDATION
    # -----------------------------------------------------

    if "Unit_Price" in df.columns:

        df.loc[
            df["Unit_Price"] < 0,
            "Unit_Price"
        ] = np.nan

    # -----------------------------------------------------
    # DISCOUNT VALIDATION
    # -----------------------------------------------------

    if "Discount" in df.columns:

        df.loc[
            (df["Discount"] < 0) |
            (df["Discount"] > 100),
            "Discount"
        ] = np.nan

    # -----------------------------------------------------
    # TOTAL AMOUNT VALIDATION
    # -----------------------------------------------------

    if "Total_Amount" in df.columns:

        df.loc[
            df["Total_Amount"] < 0,
            "Total_Amount"
        ] = np.nan

    # -----------------------------------------------------
    # STOCK VALIDATION
    # -----------------------------------------------------

    if "Stock_Remaining" in df.columns:

        df.loc[
            df["Stock_Remaining"] < 0,
            "Stock_Remaining"
        ] = np.nan

    # -----------------------------------------------------
    # REMOVE INVALID MANDATORY RECORDS
    # -----------------------------------------------------

        if "Stock_Remaining" in df.columns:
          df.loc[
             df["Stock_Remaining"] < 0,
             "Stock_Remaining"
          ] = np.nan

    return df

    return df


# =========================================================
# DUPLICATE DETECTION
# =========================================================

def find_duplicates(df):

    duplicate_columns = [
        "Invoice_ID",
        "Date",
        "Customer_ID",
        "Product_Name",
        "Quantity",
        "Total_Amount"
    ]

    existing_columns = [
        col for col in duplicate_columns
        if col in df.columns
    ]

    duplicates = df[
        df.duplicated(
            subset=existing_columns,
            keep=False
        )
    ]

    return duplicates


# =========================================================
# PROCESS EXCEL
# =========================================================

def process_excel(file_path):

    file_name = Path(file_path).name

    # ---------------------------------
    # STEP 1: Read Excel
    # ---------------------------------

    df = pd.read_excel(file_path)

    original_rows = len(df)

    # ---------------------------------
    # STEP 2: Validate Columns
    # ---------------------------------

    missing = validate_columns(df)

    if missing:

        return {
            "status": "error",
            "message": "Required columns are missing",
            "missing_columns": missing
        }

    # ---------------------------------
    # STEP 3: Create Upload History
    # ---------------------------------

    upload_id = save_upload_history(
        file_name=file_name,
        original_rows=original_rows,
        cleaned_rows=0,
        duplicate_rows=0,
        final_valid_rows=0,
        invalid_rows=0,
        quality_percentage=0,
        status="processing"
    )

    try:

        # ---------------------------------
        # STEP 4: Clean Data
        # ---------------------------------

        df = clean_data(df)

        cleaned_rows = len(df)

        # ---------------------------------
        # STEP 5: Validate Data
        # ---------------------------------

        valid_df, invalid_df = validate_data(df)

        invalid_count = len(invalid_df)

        # ---------------------------------
        # STEP 6: Quality Percentage
        # ---------------------------------

        if cleaned_rows > 0:

            quality_percentage = round(
                (len(valid_df) / cleaned_rows) * 100,
                2
            )

        else:

            quality_percentage = 0

        # ---------------------------------
        # STEP 7: Save Invalid Records
        # ---------------------------------

        insert_quality_logs(
            invalid_df,
            upload_id
        )

        # ---------------------------------
        # STEP 8: Duplicate Detection
        # ---------------------------------

        duplicates = find_duplicates(valid_df)

        duplicate_count = len(duplicates)

        # ---------------------------------
        # STEP 9: Remove Duplicates
        # ---------------------------------

        valid_df = valid_df.drop_duplicates(
            subset=[
                "Invoice_ID",
                "Date",
                "Customer_ID",
                "Product_Name",
                "Quantity",
                "Total_Amount"
            ],
            keep="first"
        )

        final_rows = len(valid_df)

        # ---------------------------------
        # STEP 10: Insert Customers
        # ---------------------------------

        customer_rows = insert_customers(
            valid_df
        )

        # ---------------------------------
        # STEP 11: Insert Products
        # ---------------------------------

        product_rows = insert_products(
           valid_df
        )

        # ---------------------------------
        # STEP 12: Rename Columns
        # ---------------------------------

        valid_df = valid_df.rename(
            columns=COLUMN_MAPPING
        )

        # ---------------------------------
        # STEP 13: Insert Sales
        # ---------------------------------

        inserted_rows = insert_sales(
          valid_df
        )

        database_duplicates = (
           final_rows - inserted_rows
        )

        # ---------------------------------
        # STEP 14: Update Upload History
        # ---------------------------------

        update_upload_history(
            upload_id=upload_id,
            original_rows=original_rows,
            cleaned_rows=cleaned_rows,
            duplicate_rows=duplicate_count,
            final_valid_rows=final_rows,
            invalid_rows=invalid_count,
            quality_percentage=quality_percentage,
            status="success"
        )

        # ---------------------------------
        # STEP 15: Return Result
        # ---------------------------------

        return {
            "status": "success",
            "upload_id": upload_id,
            "file_name": file_name,
            "original_rows": original_rows,
            "cleaned_rows": cleaned_rows,
            "invalid_rows": invalid_count,
            "duplicate_rows": duplicate_count,
            "database_duplicates": database_duplicates,
            "final_valid_rows": final_rows,
            "customer_rows": customer_rows,
            "product_rows": product_rows,
            "inserted_rows": inserted_rows,
            "quality_percentage": quality_percentage
        }

    except Exception as error:

        update_upload_history(
            upload_id=upload_id,
            status="failed"
        )

        raise error
    