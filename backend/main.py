# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from pydantic import BaseModel
import pandas as pd
import io
from pydantic import BaseModel, EmailStr

# Add these models to main.py

# Import the BigQuery utilities
from src.bigquery_utils import (
    upload_to_bigquery, 
    check_email_exists, 
    get_table_columns, 
    get_events_list, 
    update_attendance,
    get_attendance_stats_for_date
)

app = FastAPI(title="CSV to BigQuery API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class AttendanceUpdateRequest(BaseModel):
    email: str
    date: str
    attendance: str

class AttendanceUpdateResponse(BaseModel):
    success: bool
    rows_updated: int = 0
    message: str

class EventSummary(BaseModel):
    date: str
    total_guests: int
    checked_in: int


class VerificationRequest(BaseModel):
    field: str  # 'email' or 'name'
    value: str
    date: str

class VerificationResponse(BaseModel):
    exists: bool
    message: str = ""
    
class UploadResponse(BaseModel):
    success: bool
    rows_uploaded: int
    message: str

class AttendanceStats(BaseModel):
    total_guests: int
    checked_in: int
    date: str

@app.post("/upload-csv/", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    selected_date: str = Form(...),
    selected_columns: str = Form(...),
):
    """
    Upload CSV to BigQuery with selected columns and date
    """
    # Parse selected columns
    try:
        columns = selected_columns.split(",")
    except:
        columns = []
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Parse the CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Add upload_date column
        df['upload_date'] = selected_date
        
        # Filter selected columns plus upload_date
        if columns:
            all_columns = columns + ['upload_date']
            df = df[all_columns]
        
        # Upload to BigQuery using utility function
        result = upload_to_bigquery(df)
        
        return UploadResponse(
            success=result["success"],
            rows_uploaded=result["rows_uploaded"],
            message=result["message"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload CSV: {str(e)}")

@app.post("/verify/")
async def verify_data_endpoint(verification: VerificationRequest):
    """
    Verify if a specific email exists in the BigQuery table for a given date and update attendance if verified
    """
    try:
        # First check if email exists for the date
        exists_result = check_email_exists(verification.value, verification.date)
        
        if exists_result["exists"]:
            # If email exists, update attendance to True
            update_attendance(
                email=verification.value,
                date=verification.date,
                attendance_value="True"
            )
            return {"exists": True, "message": "Verified and attendance marked"}
        
        return {"exists": False, "message": "Email not found for the given date"}
        
    except HTTPException:
        print(f"HTTPException: {str(e)}")
        raise
    except Exception as e:
        print(f"Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
    

@app.get("/columns/")
async def get_columns_endpoint():
    """
    Get available columns from the BigQuery table
    """
    try:
        columns = get_table_columns()
        return {"columns": columns}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get columns: {str(e)}")
    
@app.post("/update-attendance/", response_model=AttendanceUpdateResponse)
async def update_attendance_endpoint(update_request: AttendanceUpdateRequest):
    """
    Update attendance status for a specific guest at an event
    """
    try:
        result = update_attendance(
            update_request.email, 
            update_request.date, 
            update_request.attendance
        )
        
        return AttendanceUpdateResponse(
            success=result["success"],
            rows_updated=result.get("rows_updated", 0),
            message=result["message"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attendance update failed: {str(e)}")

@app.get("/events/", response_model=List[EventSummary])
async def get_events():
    """
    Get a list of all event dates with attendance statistics
    """
    try:
        events = get_events_list()
        return events
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve events: {str(e)}")

@app.get("/attendance/{date}", response_model=AttendanceStats)
async def get_attendance_stats(date: str):
    """
    Get attendance statistics for a specific date
    """
    try:
        stats = get_attendance_stats_for_date(date)
        return AttendanceStats(**stats)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting attendance stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get attendance stats: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)