from sqlalchemy import text

from app.database import engine


def create_upload_history_table():

    query = text("""
        CREATE TABLE IF NOT EXISTS upload_history (
            id SERIAL PRIMARY KEY,
            file_name VARCHAR(255) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            original_rows INTEGER DEFAULT 0,
            cleaned_rows INTEGER DEFAULT 0,
            duplicate_rows INTEGER DEFAULT 0,
            final_valid_rows INTEGER DEFAULT 0,
            invalid_rows INTEGER DEFAULT 0,
            quality_percentage NUMERIC(5,2) DEFAULT 0,
            status VARCHAR(50) DEFAULT 'success'
        )
    """)

    with engine.begin() as connection:
        connection.execute(query)


def save_upload_history(
    file_name,
    original_rows,
    cleaned_rows,
    duplicate_rows,
    final_valid_rows,
    invalid_rows=0,
    quality_percentage=0,
    status="success"
):

    query = text("""
        INSERT INTO upload_history (
            file_name,
            original_rows,
            cleaned_rows,
            duplicate_rows,
            final_valid_rows,
            invalid_rows,
            quality_percentage,
            status
        )
        VALUES (
            :file_name,
            :original_rows,
            :cleaned_rows,
            :duplicate_rows,
            :final_valid_rows,
            :invalid_rows,
            :quality_percentage,
            :status
        )
        RETURNING id
    """)

    with engine.begin() as connection:

        result = connection.execute(
            query,
            {
                "file_name": file_name,
                "original_rows": original_rows,
                "cleaned_rows": cleaned_rows,
                "duplicate_rows": duplicate_rows,
                "final_valid_rows": final_valid_rows,
                "invalid_rows": invalid_rows,
                "quality_percentage": quality_percentage,
                "status": status,
            }
        )

        upload_id = result.scalar_one()

        return upload_id


def get_upload_history():

    query = text("""
        SELECT
            id,
            file_name,
            uploaded_at,
            original_rows,
            cleaned_rows,
            duplicate_rows,
            final_valid_rows,
            invalid_rows,
            quality_percentage,
            status
        FROM upload_history
        ORDER BY uploaded_at DESC
        LIMIT 50
    """)

    with engine.connect() as connection:

        result = connection.execute(query)

        rows = result.mappings().all()

        return [dict(row) for row in rows]


def update_upload_history(
    upload_id,
    original_rows=None,
    cleaned_rows=None,
    duplicate_rows=None,
    final_valid_rows=None,
    invalid_rows=None,
    quality_percentage=None,
    status=None
):

    query = text("""
        UPDATE upload_history
        SET
            original_rows = COALESCE(:original_rows, original_rows),
            cleaned_rows = COALESCE(:cleaned_rows, cleaned_rows),
            duplicate_rows = COALESCE(:duplicate_rows, duplicate_rows),
            final_valid_rows = COALESCE(:final_valid_rows, final_valid_rows),
            invalid_rows = COALESCE(:invalid_rows, invalid_rows),
            quality_percentage = COALESCE(
                :quality_percentage,
                quality_percentage
            ),
            status = COALESCE(:status, status)
        WHERE id = :upload_id
    """)

    with engine.begin() as connection:

        connection.execute(
            query,
            {
                "upload_id": upload_id,
                "original_rows": original_rows,
                "cleaned_rows": cleaned_rows,
                "duplicate_rows": duplicate_rows,
                "final_valid_rows": final_valid_rows,
                "invalid_rows": invalid_rows,
                "quality_percentage": quality_percentage,
                "status": status,
            }
        )