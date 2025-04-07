# bigquery_utils.py
from fastapi import HTTPException
from google.cloud import bigquery
from google.oauth2 import service_account
from typing import List, Dict, Any, Optional
import os
import pandas as pd
from datetime import date
import io
import re

# Configuration
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "sundai-club-434220")
DATASET_ID = os.environ.get("BQ_DATASET_ID", "partiful_data")
TABLE_ID = os.environ.get("BQ_TABLE_ID", "partiful_checkin_data")
CREDENTIALS_PATH = "../sundai-club-434220-6268a5eb56bb.json"

# Shared schema
BQ_SCHEMA = [
    bigquery.SchemaField("name", "STRING"),
    bigquery.SchemaField("email", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("date", "STRING"),
    bigquery.SchemaField("status", "STRING"),
    bigquery.SchemaField("attendance", "STRING"),
]

def get_bigquery_client():
    try:
        if CREDENTIALS_PATH:
            credentials = service_account.Credentials.from_service_account_file(
                CREDENTIALS_PATH, scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            return bigquery.Client(credentials=credentials, project=PROJECT_ID)
        return bigquery.Client(project=PROJECT_ID)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BigQuery client init failed: {str(e)}")

def clean_text_for_csv(text: Optional[str]) -> str:
    """Clean text to handle emojis and other problematic Unicode characters."""
    if text is None:
        return ""
    
    # Convert to string if it's not already
    text = str(text)
    
    # Option 1: Remove emojis and other non-BMP characters
    # This regex matches emojis and other characters outside the Basic Multilingual Plane
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F700-\U0001F77F"  # alchemical symbols
        "\U0001F780-\U0001F7FF"  # Geometric Shapes
        "\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
        "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
        "\U0001FA00-\U0001FA6F"  # Chess Symbols
        "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
        "\U00002702-\U000027B0"  # Dingbats
        "\U000024C2-\U0000257F"  # Enclosed characters
        "]+", 
        flags=re.UNICODE
    )
    
    # Replace emojis with an empty string
    return emoji_pattern.sub('', text)

def upload_to_bigquery(df: pd.DataFrame, table_id: str = TABLE_ID) -> Dict[str, Any]:
    client = get_bigquery_client()

    try:
        required_columns = ["name", "email", "date", "status", "attendance"]
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
            
        # First check if there are any missing values in the required 'email' column
        # Since 'email' is marked as REQUIRED in the schema
        if df['email'].isna().any() or (df['email'] == '').any():
            # Find indices with missing emails
            bad_indices = df.index[df['email'].isna() | (df['email'] == '')].tolist()
            # Either remove those rows
            df = df.dropna(subset=['email']).reset_index(drop=True)
            # Or raise an exception with detailed information
            if len(df) == 0:  # If all rows have been removed
                raise HTTPException(
                    status_code=400, 
                    detail=f"All rows are missing required 'email' values. Cannot upload empty dataset."
                )
            
            # Log the information about removed rows
            print(f"Removed {len(bad_indices)} rows with missing email values at indices: {bad_indices}")

        # Clean the data to handle emojis and other problematic characters
        for col in required_columns:
            df[col] = df[col].apply(clean_text_for_csv)

        # Only select the required columns and ensure they're all strings
        df = df[required_columns].fillna("").astype(str)
        
        # Additional validation for email field (it's required!)
        # Remove any rows where email is empty after cleaning
        df = df[df['email'] != ''].reset_index(drop=True)
        
        if len(df) == 0:
            raise HTTPException(
                status_code=400,
                detail="No valid rows to upload after filtering out invalid data."
            )

        # Use BytesIO with UTF-8 encoding instead of StringIO
        buffer = io.BytesIO()
        df.to_csv(buffer, index=False, encoding="utf-8")
        buffer.seek(0)

        job_config = bigquery.LoadJobConfig(
            schema=BQ_SCHEMA,
            skip_leading_rows=1,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            source_format=bigquery.SourceFormat.CSV,
            # Use UTF-8 for BigQuery as well
            encoding="UTF-8",
            # Add max_bad_records to make the upload more tolerant
            max_bad_records=0,  # No tolerance for bad records since we're cleaning them beforehand
        )

        table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_id}"
        load_job = client.load_table_from_file(buffer, table_ref, job_config=job_config)
        load_job.result()  # Wait for the job to complete

        return {
            "success": True,
            "rows_uploaded": len(df),
            "message": f"Successfully uploaded {len(df)} rows to BigQuery"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

def check_email_exists(email: str, table_id: str = TABLE_ID) -> bool:
    client = get_bigquery_client()
    try:
        # Sanitize input
        email = clean_text_for_csv(email)
        email = email.replace("'", "''")
        
        query = f"""
        SELECT 1 FROM `{PROJECT_ID}.{DATASET_ID}.{table_id}`
        WHERE email = '{email}'
        LIMIT 1
        """
        
        results = list(client.query(query))
        
        # Return True if any results found, False otherwise
        return {"exists": len(results) > 0}
        
    except Exception as e:
        # Handle the error as needed
        print(f"Email check failed: {str(e)}")
        return {"exists": False}

def update_attendance(email: str, date_str: str, attendance_value: str, table_id: str = TABLE_ID) -> Dict[str, Any]:
    client = get_bigquery_client()
    try:
        # Clean and sanitize the input values
        email = clean_text_for_csv(email).replace("'", "''")
        attendance_value = clean_text_for_csv(attendance_value).replace("'", "''")
        date_str = clean_text_for_csv(date_str)

        query = f"""
        UPDATE `{PROJECT_ID}.{DATASET_ID}.{table_id}`
        SET attendance = '{attendance_value}'
        WHERE email = '{email}' AND date = '{date_str}'
        """
        job = client.query(query)
        job.result()

        if job.num_dml_affected_rows == 0:
            return {"success": False, "message": "No matching records found to update"}

        return {
            "success": True,
            "rows_updated": job.num_dml_affected_rows,
            "message": f"Updated attendance for {email} on {date_str}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

def get_events_list(table_id: str = TABLE_ID) -> List[Dict[str, Any]]:
    client = get_bigquery_client()
    try:
        query = f"""
        SELECT 
            date,
            COUNT(*) as total_guests,
            COUNTIF(attendance != '') as checked_in
        FROM `{PROJECT_ID}.{DATASET_ID}.{table_id}`
        GROUP BY date
        ORDER BY date DESC
        """
        results = list(client.query(query))
        return [{
            "date": row["date"].isoformat() if isinstance(row["date"], date) else row["date"],
            "total_guests": row["total_guests"],
            "checked_in": row["checked_in"]
        } for row in results]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")

def get_table_columns(table_id: str = TABLE_ID) -> List[str]:
    client = get_bigquery_client()
    try:
        table = client.get_table(f"{PROJECT_ID}.{DATASET_ID}.{table_id}")
        return [field.name for field in table.schema]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get columns: {str(e)}")