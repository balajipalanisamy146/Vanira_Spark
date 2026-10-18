import pandas as pd
from sqlalchemy import text
from app.database import engine
from app.forecast_model import (
    calculate_forecast_accuracy,
    generate_forecast,
)


# ============================================================
# COMMON SALES DATA
# ============================================================

def _get_daily_sales():

    query = text("""
        SELECT
            sale_date,
            SUM(total_amount) AS sales
        FROM sales
        WHERE sale_date IS NOT NULL
        GROUP BY sale_date
        ORDER BY sale_date
    """)

    try:

        with engine.connect() as connection:
            result = connection.execute(query)
            rows = result.fetchall()
            columns = result.keys()

        df = pd.DataFrame(
            rows,
            columns=columns
        )

        if df.empty:
            return df

        df["sale_date"] = pd.to_datetime(
            df["sale_date"],
            errors="coerce"
        )

        df["sales"] = pd.to_numeric(
            df["sales"],
            errors="coerce"
        )

        df = df.dropna(
            subset=["sale_date", "sales"]
        )

        # Remove invalid negative sales
        df.loc[df["sales"] < 0, "sales"] = 0

        # Combine duplicate dates if any
        df = (
            df.groupby("sale_date", as_index=False)["sales"]
            .sum()
            .sort_values("sale_date")
        )

        return df

    except Exception as error:

        print(
            f"Forecast daily sales error: {error}"
        )

        return pd.DataFrame(
            columns=[
                "sale_date",
                "sales"
            ]
        )

# ============================================================
# 7 DAY FORECAST
# ============================================================

def get_forecast_7_days():
    return generate_forecast(7)

# ============================================================
# 30 DAY FORECAST
# ============================================================

def get_forecast_30_days():
    forecast = generate_forecast(30)

    if not forecast:
        return {
            "forecast_sales": 0,
            "average_daily_sales": 0,
            "days": 30,
            "status": "insufficient_data"
        }

    forecast_sales = sum(item["forecast_sales"] for item in forecast)
    average_daily_sales = forecast_sales / len(forecast)

    return {
        "days": 30,
        "average_daily_sales": round(
            float(average_daily_sales),
            2
        ),
        "forecast_sales": round(
            float(forecast_sales),
            2
        ),
        "status": "calculated"
    }


def get_forecast_90_days():
    return generate_forecast(90)


def get_forecast_accuracy():
    return calculate_forecast_accuracy()

# ============================================================
# EXPECTED GROWTH
# ============================================================

def get_forecast_growth():

    df = _get_daily_sales()

    if df.empty or len(df) < 14:

        return {
            "growth_percentage": 0,
            "previous_7_day_average": 0,
            "latest_7_day_average": 0,
            "status": "insufficient_data"
        }

    previous_7 = df["sales"].iloc[-14:-7].clip(
        lower=0
    )

    latest_7 = df["sales"].iloc[-7:].clip(
        lower=0
    )

    previous_average = previous_7.mean()
    latest_average = latest_7.mean()

    if pd.isna(previous_average):
        previous_average = 0

    if pd.isna(latest_average):
        latest_average = 0

    if previous_average == 0:

        if latest_average > 0:
            growth = 100
        else:
            growth = 0

    else:

        growth = (
            (
                latest_average -
                previous_average
            )
            /
            previous_average
        ) * 100

    return {
        "growth_percentage": round(
            float(growth),
            2
        ),
        "previous_7_day_average": round(
            float(previous_average),
            2
        ),
        "latest_7_day_average": round(
            float(latest_average),
            2
        ),
        "status": "calculated"
    }

# ============================================================
# FORECAST CONFIDENCE
# ============================================================

def get_forecast_confidence():

    df = _get_daily_sales()

    if df.empty or len(df) < 14:

        return {
            "confidence_percentage": 0,
            "status": "insufficient_data",
            "historical_days": len(df),
            "confidence_type": "sales_stability"
        }

    recent_sales = df["sales"].tail(14).clip(
        lower=0
    )

    average_sales = recent_sales.mean()
    standard_deviation = recent_sales.std()

    if pd.isna(average_sales):
        average_sales = 0

    if pd.isna(standard_deviation):
        standard_deviation = 0

    if average_sales <= 0:

        confidence = 0

    else:

        variation = (
            standard_deviation /
            average_sales
        )

        confidence = 100 - (
            variation * 100
        )

        confidence = max(
            0,
            min(100, confidence)
        )

    return {
        "confidence_percentage": round(
            float(confidence),
            2
        ),
        "average_daily_sales": round(
            float(average_sales),
            2
        ),
        "sales_standard_deviation": round(
            float(standard_deviation),
            2
        ),
        "historical_days": len(df),
        "confidence_type": "sales_stability",
        "status": "calculated"
    }

# ============================================================
# CATEGORY FORECAST
# ============================================================

def get_category_forecast():

    query = text("""
        SELECT
            product_category,
            sale_date,
            SUM(total_amount) AS sales
        FROM sales
        WHERE product_category IS NOT NULL
          AND product_category <> ''
        GROUP BY
            product_category,
            sale_date
        ORDER BY
            product_category,
            sale_date
    """)

    with engine.connect() as connection:

        result = connection.execute(query)

        rows = result.fetchall()

        columns = result.keys()

    df = pd.DataFrame(
        rows,
        columns=columns
    )

    # No category data
    if df.empty:

        return []

    df["sale_date"] = pd.to_datetime(
        df["sale_date"]
    )

    df["sales"] = pd.to_numeric(
        df["sales"]
    )

    # Latest available date
    latest_date = df["sale_date"].max()

    # Date ranges
    latest_start = latest_date - pd.Timedelta(days=6)

    previous_end = latest_start - pd.Timedelta(days=1)

    previous_start = previous_end - pd.Timedelta(days=6)

    forecast = []

    categories = (
        df["product_category"]
        .dropna()
        .unique()
    )

    for category in categories:

        category_df = df[
            df["product_category"] == category
        ]

        # Latest 7 days
        latest_sales = category_df[
            (
                category_df["sale_date"]
                >= latest_start
            )
            &
            (
                category_df["sale_date"]
                <= latest_date
            )
        ]["sales"].sum()

        # Previous 7 days
        previous_sales = category_df[
            (
                category_df["sale_date"]
                >= previous_start
            )
            &
            (
                category_df["sale_date"]
                <= previous_end
            )
        ]["sales"].sum()

        # Growth calculation
        if previous_sales == 0:

            if latest_sales > 0:
                growth = 100.0
            else:
                growth = 0.0

        else:

            growth = (
                (
                    latest_sales -
                    previous_sales
                )
                /
                previous_sales
            ) * 100

        # Forecast next 7 days
        latest_daily_average = (
            latest_sales / 7
        )

        forecast_7_days = (
            latest_daily_average * 7
        )

        forecast.append({

            "category": str(category),

            "growth_percentage": round(
                float(growth),
                2
            ),

            "previous_7_day_sales": round(
                float(previous_sales),
                2
            ),

            "latest_7_day_sales": round(
                float(latest_sales),
                2
            ),

            "forecast_7_day_sales": round(
                float(forecast_7_days),
                2
            )

        })

    # Highest growth first
    forecast.sort(
        key=lambda x: x["growth_percentage"],
        reverse=True
    )

    return forecast


# ============================================================
# FESTIVAL IMPACT
# ============================================================

def get_festival_impact():

    query = text("""
        SELECT
            festival,
            sale_date,
            SUM(total_amount) AS sales
        FROM sales
        WHERE festival IS NOT NULL
          AND TRIM(festival) <> ''
        GROUP BY
            festival,
            sale_date
        ORDER BY
            festival,
            sale_date
    """)

    with engine.connect() as connection:

        result = connection.execute(query)

        rows = result.fetchall()

        columns = result.keys()

    df = pd.DataFrame(
        rows,
        columns=columns
    )

    # No festival data
    if df.empty:

        return {
            "upcoming_festival": None,
            "expected_sales_increase": 0,
            "status": "no_festival_data",
            "festivals": []
        }

    df["sale_date"] = pd.to_datetime(
        df["sale_date"]
    )

    df["sales"] = pd.to_numeric(
        df["sales"]
    )

    # --------------------------------------------------------
    # Calculate festival performance
    # --------------------------------------------------------

    festival_results = []

    for festival in df["festival"].unique():

        festival_df = df[
            df["festival"] == festival
        ]

        festival_sales = festival_df["sales"].sum()

        festival_days = (
            festival_df["sale_date"]
            .nunique()
        )

        if festival_days == 0:
            continue

        average_daily_sales = (
            festival_sales /
            festival_days
        )

        festival_results.append({

            "festival": str(festival),

            "total_sales": round(
                float(festival_sales),
                2
            ),

            "festival_days": int(
                festival_days
            ),

            "average_daily_sales": round(
                float(average_daily_sales),
                2
            )

        })

    # --------------------------------------------------------
    # Sort festivals by latest occurrence
    # --------------------------------------------------------

    festival_results.sort(
        key=lambda x: x["festival"]
    )

    # --------------------------------------------------------
    # Determine latest festival
    # --------------------------------------------------------

    latest_festival = None

    latest_festival_date = None

    for festival in df["festival"].unique():

        festival_df = df[
            df["festival"] == festival
        ]

        festival_date = (
            festival_df["sale_date"].max()
        )

        if (
            latest_festival_date is None
            or festival_date > latest_festival_date
        ):

            latest_festival_date = festival_date

            latest_festival = festival

    # --------------------------------------------------------
    # Calculate festival impact
    # --------------------------------------------------------

    expected_increase = 0.0

    if latest_festival is not None:

        festival_df = df[
            df["festival"] == latest_festival
        ]

        festival_sales = (
            festival_df["sales"].sum()
        )

        festival_days = (
            festival_df["sale_date"]
            .nunique()
        )

        festival_average = (
            festival_sales /
            festival_days
        )

        # Non-festival sales
        non_festival_df = df[
            df["festival"].isna()
            |
            (df["festival"].str.strip() == "")
        ]

        if not non_festival_df.empty:

            non_festival_sales = (
                non_festival_df["sales"].sum()
            )

            non_festival_days = (
                non_festival_df["sale_date"]
                .nunique()
            )

            if non_festival_days > 0:

                normal_average = (
                    non_festival_sales /
                    non_festival_days
                )

                if normal_average > 0:

                    expected_increase = (

                        (
                            festival_average -
                            normal_average
                        )
                        /
                        normal_average

                    ) * 100

    return {

        "upcoming_festival": (
            str(latest_festival)
            if latest_festival
            else None
        ),

        "expected_sales_increase": round(
            float(expected_increase),
            2
        ),

        "latest_festival_date": (
            latest_festival_date.strftime(
                "%Y-%m-%d"
            )
            if latest_festival_date
            else None
        ),

        "status": "calculated",

        "festivals": festival_results

    }

# ============================================================
# AI FORECAST INSIGHTS
# ============================================================

def get_forecast_insights():

    # Get existing forecast data
    forecast_7 = get_forecast_7_days()
    growth_data = get_forecast_growth()
    confidence_data = get_forecast_confidence()
    category_data = get_category_forecast()
    festival_data = get_festival_impact()

    if not forecast_7:

        return {
            "title": "AI Forecast Insights",
            "summary": "Not enough sales history to generate forecast insights.",
            "insights": [],
            "recommendations": [
                "Upload at least 7 days of valid sales data to generate forecast insights."
            ],
            "forecast_confidence": 0,
            "forecast_growth": 0,
            "status": "insufficient_data"
        }

    insights = []

    recommendations = []

    # --------------------------------------------------------
    # 1. Overall Growth Insight
    # --------------------------------------------------------

    growth = float(
        growth_data.get(
            "growth_percentage",
            0
        )
    )

    if growth > 10:

        insights.append(
            f"Sales are showing positive growth of {growth:.2f}% compared with the previous 7-day period."
        )

        recommendations.append(
            "Consider maintaining sufficient inventory to support the current sales growth."
        )

    elif growth < -10:

        insights.append(
            f"Sales have decreased by {abs(growth):.2f}% compared with the previous 7-day period."
        )

        recommendations.append(
            "Review recent sales performance and consider promotional actions for declining demand."
        )

    else:

        insights.append(
            f"Sales are relatively stable with a {growth:.2f}% change compared with the previous 7-day period."
        )

    # --------------------------------------------------------
    # 2. Forecast Confidence
    # --------------------------------------------------------

    confidence = float(
        confidence_data.get(
            "confidence_percentage",
            0
        )
    )

    if confidence >= 80:

        insights.append(
            f"Forecast confidence is high at {confidence:.2f}% based on recent sales consistency."
        )

    elif confidence >= 60:

        insights.append(
            f"Forecast confidence is moderate at {confidence:.2f}%. Demand may have some variation."
        )

        recommendations.append(
            "Monitor daily sales closely before making major inventory decisions."
        )

    else:

        insights.append(
            f"Forecast confidence is currently low at {confidence:.2f}%."
        )

        recommendations.append(
            "Collect more consistent sales history before making large forecasting decisions."
        )

    # --------------------------------------------------------
    # 3. Category Insight
    # --------------------------------------------------------

    if category_data:

        highest_growth_category = max(
            category_data,
            key=lambda x: x.get(
                "growth_percentage",
                0
            )
        )

        lowest_growth_category = min(
            category_data,
            key=lambda x: x.get(
                "growth_percentage",
                0
            )
        )

        highest_category = (
            highest_growth_category.get(
                "category"
            )
        )

        highest_growth = float(
            highest_growth_category.get(
                "growth_percentage",
                0
            )
        )

        lowest_category = (
            lowest_growth_category.get(
                "category"
            )
        )

        lowest_growth = float(
            lowest_growth_category.get(
                "growth_percentage",
                0
            )
        )

        insights.append(
            f"{highest_category} is currently the fastest-growing category with {highest_growth:.2f}% growth."
        )

        if lowest_growth < 0:

            insights.append(
                f"{lowest_category} is showing a decline of {abs(lowest_growth):.2f}%."
            )

            recommendations.append(
                f"Review demand and inventory movement for the {lowest_category} category."
            )

    # --------------------------------------------------------
    # 4. Festival Insight
    # --------------------------------------------------------

    festival = festival_data.get(
        "upcoming_festival"
    )

    festival_increase = float(
        festival_data.get(
            "expected_sales_increase",
            0
        )
    )

    if festival:

        if festival_increase > 10:

            insights.append(
                f"Historical {festival} sales indicate approximately {festival_increase:.2f}% higher demand compared with normal sales periods."
            )

            recommendations.append(
                f"Consider preparing additional inventory ahead of the {festival} demand period."
            )

        else:

            insights.append(
                f"Historical {festival} data does not show a major increase in average daily sales."
            )

    # --------------------------------------------------------
    # 5. Forecast Availability
    # --------------------------------------------------------

    if forecast_7:

        total_forecast = sum(
            float(
                item.get(
                    "forecast_sales",
                    0
                )
            )
            for item in forecast_7
        )

        insights.append(
            f"The projected sales value for the next 7 days is ₹{total_forecast:,.2f}."
        )

    else:

        insights.append(
            "There is not enough historical sales data to generate a 7-day forecast."
        )

        recommendations.append(
            "Upload additional historical sales data to improve forecasting."
        )

    # --------------------------------------------------------
    # Return AI-style insight response
    # --------------------------------------------------------

    return {

        "title": "AI Forecast Insights",

        "summary": (
            insights[0]
            if insights
            else "No forecast insights are currently available."
        ),

        "insights": insights,

        "recommendations": recommendations,

        "forecast_confidence": round(
            confidence,
            2
        ),

        "forecast_growth": round(
            growth,
            2
        ),

        "status": "generated"

    }