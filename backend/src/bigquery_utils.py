# bigquery_utils.py
from fastapi import HTTPException
from google.cloud import bigquery
from google.oauth2 import service_account
from typing import List, Dict, Any
import os
import pandas as pd
from datetime import date
import io

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

def upload_to_bigquery(df: pd.DataFrame, table_id: str = TABLE_ID) -> Dict[str, Any]:
    client = get_bigquery_client()

    try:
        required_columns = ["name", "email", "date", "status", "attendance"]
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")

        df = df[required_columns].fillna("").astype(str)

        buffer = io.StringIO()
        df.to_csv(buffer, index=False, encoding="utf-8")
        buffer.seek(0)

        job_config = bigquery.LoadJobConfig(
            schema=BQ_SCHEMA,
            skip_leading_rows=1,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            source_format=bigquery.SourceFormat.CSV,
            encoding="UTF-8",
        )

        table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_id}"
        load_job = client.load_table_from_file(buffer, table_ref, job_config=job_config)
        load_job.result()

        return {
            "success": True,
            "rows_uploaded": len(df),
            "message": f"Successfully uploaded {len(df)} rows to BigQuery"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

def verify_data(field: str, value: str, table_id: str = TABLE_ID) -> Dict[str, Any]:
    if field not in ["email", "name"]:
        raise HTTPException(status_code=400, detail="Field must be 'email' or 'name'")

    client = get_bigquery_client()
    try:
        value = value.replace("'", "''")
        query = f"""
        SELECT * FROM `{PROJECT_ID}.{DATASET_ID}.{table_id}`
        WHERE {field} = '{value}'
        ORDER BY date DESC
        LIMIT 10
        """
        results = list(client.query(query))
        matches = []
        for row in results:
            match = {k: (v.isoformat() if isinstance(v, (date, pd.Timestamp)) else v) for k, v in row.items()}
            matches.append(match)

        return {"exists": len(matches) > 0, "matches": matches}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

def update_attendance(email: str, date_str: str, attendance_value: str, table_id: str = TABLE_ID) -> Dict[str, Any]:
    client = get_bigquery_client()
    try:
        email = email.replace("'", "''")
        attendance_value = attendance_value.replace("'", "''")

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
