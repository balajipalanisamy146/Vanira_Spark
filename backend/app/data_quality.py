from sqlalchemy import text

from app.database import engine


def get_data_quality():
    """
    Returns data quality information for the latest upload only.
    """

    # --------------------------------------------------
    # 1. GET LATEST UPLOAD
    # --------------------------------------------------

    latest_upload_query = text("""
        SELECT
            id,
            file_name,
            uploaded_at,
            original_rows,
            cleaned_rows,
            invalid_rows,
            duplicate_rows,
            final_valid_rows,
            quality_percentage,
            status
        FROM upload_history
        ORDER BY uploaded_at DESC, id DESC
        LIMIT 1
    """)

    with engine.connect() as connection:
        latest_upload = (
            connection
            .execute(latest_upload_query)
            .mappings()
            .first()
        )

    if not latest_upload:
        return {
            "has_data": False,
            "message": "No uploads found.",
            "summary": {
                "original_rows": 0,
                "cleaned_rows": 0,
                "valid_rows": 0,
                "invalid_rows": 0,
                "duplicate_rows": 0,
                "quality_percentage": 0
            },
            "error_breakdown": [],
            "invalid_records": []
        }

    upload_id = latest_upload["id"]

    # --------------------------------------------------
    # 2. GET INVALID RECORDS
    # --------------------------------------------------

    invalid_query = text("""
        SELECT
            log_id,
            invoice_id,
            error_type,
            error_message,
            raw_data,
            created_at
        FROM data_quality_logs
        WHERE upload_id = :upload_id
        ORDER BY log_id ASC
        LIMIT 100
    """)

    with engine.connect() as connection:
        invalid_result = connection.execute(
            invalid_query,
            {
                "upload_id": upload_id
            }
        )

        invalid_records = [
            dict(row)
            for row in invalid_result.mappings().all()
        ]

    # --------------------------------------------------
    # 3. VALIDATION ISSUE BREAKDOWN
    # --------------------------------------------------

    breakdown_query = text("""
        SELECT
            COALESCE(
                NULLIF(TRIM(error_type), ''),
                'Unknown Validation Error'
            ) AS reason,
            COUNT(*) AS count
        FROM data_quality_logs
        WHERE upload_id = :upload_id
        GROUP BY
            COALESCE(
                NULLIF(TRIM(error_type), ''),
                'Unknown Validation Error'
            )
        ORDER BY
            count DESC,
            reason ASC
    """)

    with engine.connect() as connection:
        breakdown_result = connection.execute(
            breakdown_query,
            {
                "upload_id": upload_id
            }
        )

        error_breakdown = [
            {
                "reason": row["reason"],
                "count": int(row["count"] or 0)
            }
            for row in breakdown_result.mappings().all()
        ]

    # --------------------------------------------------
    # 4. SUMMARY
    # --------------------------------------------------

    original_rows = int(
        latest_upload["original_rows"] or 0
    )

    cleaned_rows = int(
        latest_upload["cleaned_rows"] or 0
    )

    invalid_rows = int(
        latest_upload["invalid_rows"] or 0
    )

    duplicate_rows = int(
        latest_upload["duplicate_rows"] or 0
    )

    valid_rows = int(
        latest_upload["final_valid_rows"] or 0
    )

    quality_percentage = round(
        float(latest_upload["quality_percentage"] or 0),
        2
    )

    # --------------------------------------------------
    # 5. RESPONSE
    # --------------------------------------------------

    return {
        "has_data": True,

        "upload": {
            "id": latest_upload["id"],
            "file_name": latest_upload["file_name"],
            "uploaded_at": latest_upload["uploaded_at"],
            "status": latest_upload["status"]
        },

        "summary": {
            "original_rows": original_rows,
            "cleaned_rows": cleaned_rows,
            "valid_rows": valid_rows,
            "invalid_rows": invalid_rows,
            "duplicate_rows": duplicate_rows,
            "quality_percentage": quality_percentage
        },

        "error_breakdown": error_breakdown,

        "invalid_records": invalid_records
    }


def get_invalid_records(limit: int = 100):
    """
    Returns invalid records belonging to the latest upload.
    """

    # --------------------------------------------------
    # 1. GET LATEST UPLOAD
    # --------------------------------------------------

    latest_upload_query = text("""
        SELECT id
        FROM upload_history
        ORDER BY uploaded_at DESC, id DESC
        LIMIT 1
    """)

    with engine.connect() as connection:
        latest_upload = (
            connection
            .execute(latest_upload_query)
            .mappings()
            .first()
        )

    if not latest_upload:
        return {
            "count": 0,
            "records": []
        }

    # --------------------------------------------------
    # 2. GET INVALID RECORDS
    # --------------------------------------------------

    query = text("""
        SELECT
            log_id,
            invoice_id,
            error_type,
            error_message,
            raw_data,
            created_at
        FROM data_quality_logs
        WHERE upload_id = :upload_id
        ORDER BY log_id ASC
        LIMIT :limit
    """)

    with engine.connect() as connection:
        result = connection.execute(
            query,
            {
                "upload_id": latest_upload["id"],
                "limit": limit
            }
        )

        records = [
            dict(row)
            for row in result.mappings().all()
        ]

    return {
        "count": len(records),
        "records": records
    }