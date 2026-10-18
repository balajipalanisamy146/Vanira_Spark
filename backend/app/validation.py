import pandas as pd
import re


def validate_data(df: pd.DataFrame):

    valid_rows = []
    invalid_rows = []

    for index, row in df.iterrows():

        errors = []

        # ==========================================
        # Invoice ID
        # ==========================================

        invoice_id = row.get("Invoice_ID")

        if pd.isna(invoice_id) or str(invoice_id).strip() == "":
            errors.append("Missing Invoice_ID")

        # ==========================================
        # Date
        # ==========================================

        if pd.isna(row.get("Date")):
            errors.append("Invalid or missing Date")

        # ==========================================
        # Customer ID
        # ==========================================

        customer_id = row.get("Customer_ID")

        if pd.isna(customer_id) or str(customer_id).strip() == "":
            errors.append("Missing Customer_ID")

        # ==========================================
        # Product Name
        # ==========================================

        product_name = row.get("Product_Name")

        if pd.isna(product_name) or str(product_name).strip() == "":
            errors.append("Missing Product_Name")

        # ==========================================
        # Quantity
        # ==========================================

        quantity = row.get("Quantity")

        if pd.isna(quantity):
            errors.append("Missing Quantity")

        elif quantity <= 0:
            errors.append("Quantity must be greater than 0")

        # ==========================================
        # Unit Price
        # ==========================================

        unit_price = row.get("Unit_Price")

        if pd.isna(unit_price):
            errors.append("Missing Unit_Price")

        elif unit_price < 0:
            errors.append("Unit_Price cannot be negative")

        # ==========================================
        # Total Amount
        # ==========================================

        total_amount = row.get("Total_Amount")

        if pd.isna(total_amount):
            errors.append("Missing Total_Amount")

        elif total_amount < 0:
            errors.append("Total_Amount cannot be negative")

        # ==========================================
        # Discount
        # ==========================================

        discount = row.get("Discount")

        if not pd.isna(discount):

            if discount < 0 or discount > 100:
                errors.append(
                    "Discount must be between 0 and 100"
                )

        # ==========================================
        # Age
        # ==========================================

        age = row.get("Age")

        if not pd.isna(age):

            if age < 5 or age > 100:
                errors.append(
                    "Age must be between 5 and 100"
                )

        # ==========================================
        # Mobile Number
        # ==========================================

        mobile = row.get("Mobile_Number")

        if not pd.isna(mobile):

            digits = re.sub(
                r"\D",
                "",
                str(mobile)
            )

            if len(digits) != 10:
                errors.append(
                    "Invalid Mobile_Number"
                )

        # ==========================================
        # Stock
        # ==========================================

        stock = row.get("Stock_Remaining")

        if not pd.isna(stock):

            if stock < 0:
                errors.append(
                    "Stock_Remaining cannot be negative"
                )

        # ==========================================
        # FINAL RESULT
        # ==========================================

        if errors:

            invalid_rows.append({
                "row_number": index + 2,
                "invoice_id": (
                    None
                    if pd.isna(invoice_id)
                    else str(invoice_id)
                ),
                "errors": " | ".join(errors),
                "raw_data": row.to_dict()
            })

        else:

            valid_rows.append(row)

    valid_df = pd.DataFrame(valid_rows)

    invalid_df = pd.DataFrame(invalid_rows)

    return valid_df, invalid_df