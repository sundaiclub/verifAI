# bigquery_utils.py
from fastapi import HTTPException
from google.cloud import bigquery
from google.oauth2 import service_account
from typing import List, Dict, Any, Optional
import os
import pandas as pd
from datetime import date

# Configuration
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "sundai-club-434220")
DATASET_ID = os.environ.get("BQ_DATASET_ID", "partiful_data")
TABLE_ID = os.environ.get("BQ_TABLE_ID", "partiful_checkin_data")
CREDENTIALS_PATH = "../sundai-club-434220-6268a5eb56bb.json"

def get_bigquery_client():
    """
    Initialize and return a BigQuery client with proper authentication.
    """
    try:
        if CREDENTIALS_PATH:
            credentials = service_account.Credentials.from_service_account_file(
                CREDENTIALS_PATH, scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            return bigquery.Client(credentials=credentials, project=PROJECT_ID)
        else:
            # Use default credentials (for deployment environments like GCP)
            return bigquery.Client(project=PROJECT_ID)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize BigQuery client: {str(e)}")

def upload_to_bigquery(df: pd.DataFrame, table_id: str = TABLE_ID) -> Dict[str, Any]:
    """
    Upload pandas DataFrame to BigQuery table.
    
    Args:
        df: Pandas DataFrame with data to upload
        table_id: BigQuery table ID
        
    Returns:
        Dict with upload results
    """
    client = get_bigquery_client()
    
    try:
        # Ensure the DataFrame has the required schema columns
        required_columns = ["name", "email", "date", "status", "attendance"]
        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required column '{col}' in data"
                )
        
        # Convert to list of dictionaries for BigQuery
        records = df.to_dict('records')
        
        # Define table reference
        table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_id}"
        
        # Define schema explicitly to match your requirements
        job_config = bigquery.LoadJobConfig(
            schema=[
                bigquery.SchemaField("name", "STRING"),
                bigquery.SchemaField("email", "STRING"),
                bigquery.SchemaField("date", "STRING"),  # Changed from DATE to STRING
                bigquery.SchemaField("status", "STRING"),
                bigquery.SchemaField("attendance", "STRING"),
            ],
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        )
        
        load_job = client.load_table_from_json(
            records,
            table_ref,
            job_config=job_config
        )
        
        # Wait for the job to complete
        load_job.result()
        
        return {
            "success": True,
            "rows_uploaded": len(records),
            "message": f"Successfully uploaded {len(records)} rows to BigQuery"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to BigQuery: {str(e)}")

def verify_data(field: str, value: str, table_id: str = TABLE_ID) -> Dict[str, Any]:
    """
    Verify if a specific field value exists in the BigQuery table.
    
    Args:
        field: Field name to check (email or name)
        value: Value to search for
        table_id: BigQuery table ID
        
    Returns:
        Dict with verification results and matches
    """
    client = get_bigquery_client()
    
    if field not in ["email", "name"]:
        raise HTTPException(status_code=400, detail="Field must be 'email' or 'name'")
    
    try:
        # Sanitize input for SQL injection prevention
        sanitized_value = value.replace("'", "''")
        
        # Build and execute query
        query = f"""
        SELECT *
        FROM `{PROJECT_ID}.{DATASET_ID}.{table_id}`
        WHERE {field} = '{sanitized_value}'
        ORDER BY date DESC
        LIMIT 10
        """
        
        query_job = client.query(query)
        results = list(query_job)
        
        # Convert to dict and handle datetime objects
        matches = []
        for row in results:
            match = dict(row.items())
            # Convert datetime objects to strings for JSON serialization
            for key, value in match.items():
                if isinstance(value, (date, pd.Timestamp)):
                    match[key] = value.isoformat()
            matches.append(match)
        
        return {
            "exists": len(matches) > 0,
            "matches": matches
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

def update_attendance(email: str, date_str: str, attendance_value: str, table_id: str = TABLE_ID) -> Dict[str, Any]:
    """
    Update the attendance field for a specific email and date.
    
    Args:
        email: Email to update
        date_str: Date string in YYYY-MM-DD format
        attendance_value: New attendance value
        table_id: BigQuery table ID
        
    Returns:
        Dict with update results
    """
    client = get_bigquery_client()
    
    try:
        # Sanitize inputs
        sanitized_email = email.replace("'", "''")
        sanitized_attendance = attendance_value.replace("'", "''")
        
        # Build and execute query to update attendance
        query = f"""
        UPDATE `{PROJECT_ID}.{DATASET_ID}.{table_id}`
        SET attendance = '{sanitized_attendance}'
        WHERE email = '{sanitized_email}'
        AND date = '{date_str}'
        """
        
        query_job = client.query(query)
        query_job.result()  # Wait for the job to complete
        
        # Check if any rows were affected
        if query_job.num_dml_affected_rows == 0:
            return {
                "success": False,
                "message": "No matching records found to update"
            }
        
        return {
            "success": True,
            "rows_updated": query_job.num_dml_affected_rows,
            "message": f"Successfully updated attendance for {email} on {date_str}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attendance update failed: {str(e)}")

def get_events_list(table_id: str = TABLE_ID) -> List[Dict[str, Any]]:
    """
    Get a list of distinct event dates with attendee counts.
    
    Args:
        table_id: BigQuery table ID
        
    Returns:
        List of event dates with attendee counts
    """
    client = get_bigquery_client()
    
    try:
        # Build and execute query
        query = f"""
        SELECT 
            date,
            COUNT(*) as total_guests,
            COUNTIF(attendance != '') as checked_in
        FROM `{PROJECT_ID}.{DATASET_ID}.{table_id}`
        GROUP BY date
        ORDER BY date DESC
        """
        
        query_job = client.query(query)
        results = list(query_job)
        
        # Format results
        events = []
        for row in results:
            event = {
                "date": row["date"].isoformat() if isinstance(row["date"], date) else row["date"],
                "total_guests": row["total_guests"],
                "checked_in": row["checked_in"]
            }
            events.append(event)
        
        return events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get events list: {str(e)}")

def get_table_columns(table_id: str = TABLE_ID) -> List[str]:
    """
    Get available columns from the BigQuery table.
    
    Args:
        table_id: BigQuery table ID
        
    Returns:
        List of column names
    """
    client = get_bigquery_client()
    
    try:
        # Get table schema
        table_ref = client.dataset(DATASET_ID).table(table_id)
        table = client.get_table(table_ref)
        
        # Extract column names
        columns = [field.name for field in table.schema]
        
        return columns
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get columns: {str(e)}")