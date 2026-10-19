from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from pathlib import Path
from app.chatbot import process_chat_query, get_dataset_bounds
from app.metrics_service import get_verified_business_metrics, get_data_freshness_and_bounds
from app.ai_insights_service import (
    get_ai_business_insights,
    update_insight_lifecycle_status,
    invalidate_insights_cache,
    ensure_insight_lifecycle_schema
)
from app.analytics import get_sales_summary
from app.analytics import get_sales_trend
from app.analytics import get_top_products
from app.analytics import (
    get_category_sales,
    get_brand_sales,
    get_city_sales,
    get_gender_sales,
    get_payment_method_sales,
    get_top_profitable_products,
    get_least_profitable_products,
    get_category_profit,
    get_profit_trend,
    get_repeat_purchase_rate,
    get_average_basket_size,
    get_new_vs_returning_revenue,
    get_customer_revenue_contribution,
)
from app.forecast import (
    get_forecast_7_days,
    get_forecast_30_days,
    get_forecast_90_days,
    get_forecast_accuracy,
    get_forecast_growth,
    get_forecast_confidence,
    get_category_forecast,
    get_festival_impact,
    get_forecast_insights
)
from app.data_quality import get_data_quality
from app.data_quality import get_invalid_records

from app.ingestion import process_excel

from app.upload_history import (
    create_upload_history_table,
    save_upload_history,
    get_upload_history
)
from app.forecast_model import ensure_forecast_schema

from app.inventory import (
    inventory_kpis,
    inventory_summary,
    low_stock_products,
    out_of_stock_products,
    fast_moving_products,
    slow_moving_products,
    reorder_recommendations,
    inventory_movement,
    inventory_alerts,
)
from app.inventory_automation import ensure_inventory_schema

from app.customer import (
    customer_kpis,
    customer_growth,
    customer_segments,
    top_customers,
    customer_revenue,
    purchase_behavior,
    customer_lifetime_value,
    customer_retention,
    search_customers,
    customer_details,
)

from app.analytics import get_sales_kpis

from app.analytics import (
    get_weekly_sales_trend,
    get_monthly_sales_trend,
    get_yearly_sales_trend
)

from app.customer import purchase_behaviour
from app.customer import customer_lifetime_value
from app.customer import customer_retention

from app.customer import (
    search_customers,
    customer_profile,
    customer_purchase_history,
    customer_spending_trend
)

from app.product import (
    product_kpis as product_kpis_service,
    top_products as top_products_service,
    profitable_products as profitable_products_service,
    least_profitable_products as least_profitable_products_service,
    category_performance as category_performance_service,
    brand_performance as brand_performance_service,
    product_trend as product_trend_service,
    search_products as search_products_service,
    product_profile as product_profile_service,
    product_sales_trend as product_sales_trend_service,
    product_sales_history as product_sales_history_service,
)


app = FastAPI()

create_upload_history_table()
ensure_forecast_schema()
ensure_inventory_schema()
ensure_insight_lifecycle_schema()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Project root directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Data directories
RAW_DIR = BASE_DIR / "data" / "raw"
CLEANED_DIR = BASE_DIR / "data" / "cleaned"
INVALID_DIR = BASE_DIR / "data" / "invalid"

# Create directories automatically
RAW_DIR.mkdir(parents=True, exist_ok=True)
CLEANED_DIR.mkdir(parents=True, exist_ok=True)
INVALID_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/")
def home():
    return {
        "project": "Vanira Spark",
        "status": "Running"
    }


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):

    file_path = RAW_DIR / file.filename

    with open(file_path, "wb") as f:
        f.write(await file.read())

    result = process_excel(str(file_path))

    if isinstance(result, dict) and result.get("status") == "success":
        invalidate_insights_cache()

    return result

@app.get("/analytics/summary")
def analytics_summary():

    return get_sales_summary()

@app.get("/analytics/sales-trend")
def sales_trend():

    return get_sales_trend()

@app.get("/analytics/top-products")
def top_products():

    return get_top_products()

@app.get("/analytics/category-sales")
def category_sales():

    return get_category_sales()

@app.get("/forecast/7-days")
def forecast_7_days():

    return get_forecast_7_days()

@app.get("/forecast/30-days")
def forecast_30_days():

    return get_forecast_30_days()


@app.get("/forecast/90-days")
def forecast_90_days():

    return get_forecast_90_days()


@app.get("/forecast/accuracy")
def forecast_accuracy():

    return get_forecast_accuracy()


@app.get("/forecast/growth")
def forecast_growth():

    return get_forecast_growth()

@app.get("/forecast/confidence")
def forecast_confidence():

    return get_forecast_confidence()

@app.get("/forecast/categories")
def forecast_categories():

    return get_category_forecast()

@app.get("/forecast/festival")
def forecast_festival():

    return get_festival_impact()

@app.get("/forecast/insights")
def forecast_insights():

    return get_forecast_insights()

@app.get("/upload-history")
def upload_history():

    return get_upload_history()

@app.get("/analytics/data-quality")
def data_quality():

    return get_data_quality()

@app.get("/analytics/invalid-records")
def invalid_records(
    limit: int = Query(
        default=100,
        ge=1,
        le=500
    )
):

    return get_invalid_records(limit)


@app.get("/analytics/kpis")
def sales_kpis():

    return get_sales_kpis()

@app.get("/analytics/weekly-trend")
def weekly_trend():

    return get_weekly_sales_trend()


@app.get("/analytics/monthly-trend")
def monthly_trend():

    return get_monthly_sales_trend()


@app.get("/analytics/yearly-trend")
def yearly_trend():

    return get_yearly_sales_trend()

@app.get("/analytics/brand-sales")
def brand_sales():
    return get_brand_sales()


@app.get("/analytics/city-sales")
def city_sales():
    return get_city_sales()


@app.get("/analytics/gender-sales")
def gender_sales():
    return get_gender_sales()


@app.get("/analytics/payment-method-sales")
def payment_method_sales():
    return get_payment_method_sales()

@app.get("/analytics/top-profitable-products")
def top_profitable_products():
    return get_top_profitable_products()


@app.get("/analytics/least-profitable-products")
def least_profitable_products():
    return get_least_profitable_products()


@app.get("/analytics/category-profit")
def category_profit():
    return get_category_profit()


@app.get("/analytics/profit-trend")
def profit_trend():
    return get_profit_trend()

@app.get("/analytics/repeat-purchase-rate")
def repeat_purchase_rate():
    return get_repeat_purchase_rate()


@app.get("/analytics/average-basket-size")
def average_basket_size():
    return get_average_basket_size()


@app.get("/analytics/new-vs-returning-revenue")
def new_vs_returning_revenue():
    return get_new_vs_returning_revenue()


@app.get("/analytics/customer-revenue-contribution")
def customer_revenue_contribution():
    return get_customer_revenue_contribution()

@app.get("/customer/top")
def get_top_customers():
    return top_customers()


@app.get("/customer/segments")
def get_customer_segments():
    return customer_segments()

@app.get("/customer/kpis")
def get_customer_kpis():
    return customer_kpis()


@app.get("/customer/growth")
def get_customer_growth():
    return customer_growth()


@app.get("/customer/segments")
def get_customer_segments():
    return customer_segments()


@app.get("/customer/top")
def get_top_customers():
    return top_customers()


@app.get("/customer/revenue")
def get_customer_revenue():
    return customer_revenue()

@app.get("/customer/purchase-behaviour")
def get_purchase_behaviour():
    return purchase_behaviour()


@app.get("/customer/behavior")
def get_purchase_behavior():
    return purchase_behavior()


@app.get("/customer/clv")
def get_customer_clv():
    return customer_lifetime_value()


@app.get("/customer/retention")
def get_customer_retention():
    return customer_retention()


@app.get("/customer/search")
def search_customer(search: str = ""):
    return search_customers(search)


@app.get("/customer/{customer_id}")
def get_customer_details(customer_id: str):
    result = customer_details(customer_id)

    if not result:
        return {
            "error": "Customer not found"
        }

    return result

@app.get("/customer/clv")
def get_customer_clv():

    return customer_lifetime_value()

@app.get("/customer/retention")
def get_customer_retention():

    return customer_retention()

@app.get("/customer/search")
def customer_search(
    search: str = ""
):
    return search_customers(search)


@app.get(
    "/customer/profile/{customer_id}"
)
def get_customer_profile(
    customer_id: str
):
    return customer_profile(
        customer_id
    )


@app.get(
    "/customer/history/{customer_id}"
)
def get_customer_history(
    customer_id: str
):
    return customer_purchase_history(
        customer_id
    )


@app.get(
    "/customer/trend/{customer_id}"
)
def get_customer_trend(
    customer_id: str
):
    return customer_spending_trend(
        customer_id
    )

@app.get("/product/kpis")
def get_product_kpis():
    return product_kpis_service()


@app.get("/product/search")
def get_product_search(search: str = ""):
    return search_products_service(search)


@app.get("/product/profile/{product_name}")
def get_product_profile(product_name: str):
    return product_profile_service(product_name)


@app.get("/product/detail-trend/{product_name}")
def get_product_detail_trend(product_name: str):
    return product_sales_trend_service(product_name)


@app.get("/product/history/{product_name}")
def get_product_history(product_name: str):
    return product_sales_history_service(product_name)


@app.get("/product/top")
def get_top_products():
    return top_products_service()


@app.get("/product/profit")
def get_profitable_products():
    return profitable_products_service()


@app.get("/product/least-profit")
def get_least_profitable_products():
    return least_profitable_products_service()


@app.get("/product/categories")
def get_category_performance():
    return category_performance_service()


@app.get("/product/brands")
def get_brand_performance():
    return brand_performance_service()


@app.get("/product/trend")
def get_product_trend():
    return product_trend_service()

@app.get("/inventory/kpis")
def get_inventory_kpis():
    return inventory_kpis()


@app.get("/inventory/summary")
def get_inventory_summary():
    return inventory_summary()


@app.get("/inventory/low-stock")
def get_low_stock_products():
    return low_stock_products()


@app.get("/inventory/out-of-stock")
def get_out_of_stock_products():
    return out_of_stock_products()


@app.get("/inventory/fast-moving")
def get_fast_moving_products():
    return fast_moving_products()


@app.get("/inventory/slow-moving")
def get_slow_moving_products():
    return slow_moving_products()


@app.get("/inventory/reorder")
def get_reorder_recommendations():
    return reorder_recommendations()


@app.get("/inventory/alerts")
def get_inventory_alerts():
    return inventory_alerts()


@app.get("/inventory/movement")
def get_inventory_movement():
    return inventory_movement()


# ============================================================
# AI BUSINESS CHATBOT ENDPOINTS
# ============================================================

class ChatQueryRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500, description="Natural language user question")
    session_id: Optional[str] = Field(None, description="Optional session/user identifier")


@app.post("/chat/query")
def chat_query_endpoint(payload: ChatQueryRequest):
    return process_chat_query(payload.message)


@app.get("/chat/status")
def chat_status_endpoint():
    try:
        bounds = get_dataset_bounds()
        return {
            "status": "healthy",
            "connected": True,
            "database": "PostgreSQL",
            "sales_records": bounds.get("total_rows", 0),
            "date_range": bounds.get("date_range_label", ""),
            "min_date": bounds.get("min_date"),
            "max_date": bounds.get("max_date"),
        }
    except Exception as e:
        return {
            "status": "degraded",
            "connected": False,
            "error": str(e)
        }


@app.get("/chat/suggestions")
def chat_suggestions_endpoint():
    return {
        "categories": [
            {
                "category": "Sales & Revenue",
                "prompts": [
                    "What are my total sales and profit?",
                    "How much revenue did I generate this month?",
                    "Compare this month with the previous month",
                    "Which month had the highest sales?",
                    "Are sales increasing or decreasing?"
                ]
            },
            {
                "category": "Products & Categories",
                "prompts": [
                    "Show my top 10 products by sales",
                    "Which product generates the highest profit?",
                    "Which category contributes the most revenue?",
                    "Which products have low sales?",
                    "Which products have declining sales?"
                ]
            },
            {
                "category": "Customer Analytics",
                "prompts": [
                    "How many customers do I have?",
                    "How many repeat customers do I have?",
                    "Which customer segments generate the most revenue?",
                    "How has customer purchasing behavior changed?"
                ]
            },
            {
                "category": "Inventory & Stock Risks",
                "prompts": [
                    "Which products have low stock?",
                    "Which products might run out of stock?",
                    "What inventory risks should I investigate?",
                    "Which products have slow-moving inventory?"
                ]
            }
        ]
    }


# ============================================================
# AI BUSINESS INTELLIGENCE & INSIGHTS ENDPOINTS
# ============================================================

class InsightStatusUpdateRequest(BaseModel):
    insight_id: str = Field(..., min_length=1, max_length=120)
    status: str = Field(..., description="Allowed: new, acknowledged, in_progress, resolved, dismissed")
    notes: Optional[str] = Field(None, max_length=1000)


@app.get("/insights/metrics")
def insights_metrics_endpoint(
    period: str = Query(default="latest_month", regex="^(latest_month|last_30_days|all_time)$")
):
    try:
        return get_verified_business_metrics(period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate metrics: {str(e)}")


@app.get("/insights/briefing")
def insights_briefing_endpoint(
    period: str = Query(default="latest_month", regex="^(latest_month|last_30_days|all_time)$"),
    force_refresh: bool = Query(default=False)
):
    try:
        return get_ai_business_insights(period=period, force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@app.post("/insights/status")
def insights_status_endpoint(payload: InsightStatusUpdateRequest):
    try:
        return update_insight_lifecycle_status(
            insight_id=payload.insight_id,
            status=payload.status,
            notes=payload.notes
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update insight status: {str(e)}")


@app.post("/insights/refresh")
def insights_refresh_endpoint(
    period: str = Query(default="latest_month", regex="^(latest_month|last_30_days|all_time)$")
):
    invalidate_insights_cache()
    return get_ai_business_insights(period=period, force_refresh=True)