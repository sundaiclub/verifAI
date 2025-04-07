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
from src.bigquery_utils import upload_to_bigquery, check_email_exists, get_table_columns, get_events_list, update_attendance

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

class VerificationResponse(BaseModel):
    exists: bool
    matches: List[Dict[str, Any]] = []
    
class UploadResponse(BaseModel):
    success: bool
    rows_uploaded: int
    message: str

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
    Verify if a specific email exists in the BigQuery table
    """
    try:
        # Call the simplified function that returns a boolean
        exists = check_email_exists(verification.value)
        print(exists)
        
        # Since our function now returns just True/False, we create an empty matches list
        return exists
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)