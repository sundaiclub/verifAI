# FastAPI BigQuery Integration Setup Guide

This guide walks you through setting up the FastAPI service for CSV uploads to BigQuery and data verification.

## Prerequisites

- Python 3.8+
- Google Cloud Platform account with BigQuery access
- GCP service account with BigQuery permissions

## Project Structure

```
fastapi-bigquery/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── Dockerfile              # For containerization
├── docker-compose.yml      # For easy deployment
└── key.json                # GCP service account key (not included in repo)
```

## Setup Instructions

### 1. Create a GCP Service Account

1. Go to the Google Cloud Console > IAM & Admin > Service Accounts
2. Create a new service account with the following roles:
   - BigQuery Data Editor
   - BigQuery Job User
3. Create a JSON key and download it
4. Rename it to `key.json` and place it in your project directory

### 2. Create a BigQuery Dataset and Table

1. In the Google Cloud Console, go to BigQuery
2. Create a new dataset if you don't have one already
3. Create a table with at least these fields:
   - `upload_date` (DATE)
   - `email` (STRING)
   - `name` (STRING)
   - Additional fields as needed

### 3. Set Up the Environment

1. Clone the repository or create the files as shown in the artifacts
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 4. Configure Environment Variables

Set the following environment variables:

```bash
export GCP_PROJECT_ID=your-project-id
export BQ_DATASET_ID=your-dataset-id
export BQ_TABLE_ID=verification_data
export GCP_KEY_FILENAME=path/to/key.json
```

For Docker, these are set in the `docker-compose.yml` file.

### 5. Run the FastAPI Server

#### Using Python directly:

```bash
uvicorn main:app --reload
```

#### Using Docker:

```bash
docker-compose up -d
```

The API will be available at http://localhost:8000

## API Documentation

After starting the server, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints:

1. **Upload CSV to BigQuery**
   - URL: `/upload-csv/`
   - Method: POST
   - Form data:
     - `file`: CSV file upload
     - `selected_date`: Date string (YYYY-MM-DD)
     - `selected_columns`: Comma-separated column names

2. **Verify Data by Email or Name**
   - URL: `/verify/`
   - Method: POST
   - JSON body:
     ```json
     {
       "field": "email",
       "value": "user@example.com"
     }
     ```
   - Field must be either "email" or "name"

3. **Get Table Columns**
   - URL: `/columns/`
   - Method: GET
   - Returns list of available columns in the BigQuery table

## Integrating with Frontend

1. Set the API URL in your React application:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. Use the provided React components:
   - `CSVUpload.tsx` for uploading CSV files
   - `VerificationForm.tsx` for verifying data

## Troubleshooting

### Common Issues:

1. **Authentication Errors**:
   - Check that your `key.json` is properly formatted and has the correct permissions
   - Verify environment variables are set correctly

2. **CORS Errors**:
   - The API has CORS enabled for all origins by default
   - For production, update the `allow_origins` parameter in the CORS middleware

3. **BigQuery Table Not Found**:
   - Verify that PROJECT_ID, DATASET_ID, and TABLE_ID are correct
   - Check if the service account has access to the dataset

4. **CSV Format Issues**:
   - Ensure CSV files have headers
   - Check that column names match the expected format

For additional help, check the FastAPI logs or contact your GCP administrator.