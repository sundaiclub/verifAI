// CSVUpload.tsx - Updated for Sundai Event Data
import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CSVUploadProps {
  onUploadComplete: (date: string) => void;
}

const API_URL = 'https://verifai-199983032721.northamerica-northeast2.run.app';

const CSVUpload = ({ onUploadComplete }: CSVUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);

  // Map specific columns from the Sundai CSV to our schema
  const columnMapping = {
    "Name": "name",
    "[newcomers] Email": "email",
    "Status": "status"
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        
        // Extract headers and data
        const rows = text.split("\n");
        const headers = rows[0].split(",").map(header => header.trim());
        setCsvHeaders(headers);
        
        // Store CSV data for later processing
        const dataRows = rows.slice(1).filter(row => row.trim() !== "");
        
        // Use a more robust CSV parsing approach for handling quotes
        const parsedData = dataRows.map(row => {
          const values = [];
          let inQuotes = false;
          let currentValue = "";
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          
          // Add the last value
          values.push(currentValue.trim());
          return values;
        });
        
        setCsvData(parsedData);
        
        // Check if the CSV contains the required fields
        const requiredCsvFields = Object.keys(columnMapping);
        const missingFields = requiredCsvFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          toast.error("Required fields missing", {
            description: `CSV is missing: ${missingFields.join(", ")}`
          });
          return;
        }
        
        setShowColumnSelector(true);
      } catch (error) {
        console.error("Error reading CSV:", error);
        toast.error("Failed to read CSV file", { 
          description: "Please check file format and try again" 
        });
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file");
    };

    reader.readAsText(selectedFile);
  };

  const uploadToServer = async () => {
    if (!file || csvData.length === 0) return;
    
    setUploading(true);
    try {
      // Process CSV to include only specific fields plus empty attendance field
      const processedData = csvData.map(row => {
        const rowData: Record<string, string> = {};
        
        // Map CSV data to schema columns using our mapping
        csvHeaders.forEach((header, index) => {
          if (header in columnMapping && index < row.length) {
            // Use the mapped schema column name
            rowData[columnMapping[header as keyof typeof columnMapping]] = row[index];
          }
        });
        
        // Add empty attendance field
        rowData["attendance"] = "";
        
        // Add selected date as string format for the date field
        rowData["date"] = selectedDate;
        
        return rowData;
      });
      
      // Schema column names
      const schemaColumns = ["name", "email", "date", "status", "attendance"];
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', new Blob([
        // Create a new CSV with schema column names
        [
          schemaColumns.join(","),
          ...processedData.map(row => 
            schemaColumns
              .map(field => row[field] || "")
              .join(",")
          )
        ].join("\n")
      ], { type: 'text/csv' }), "processed.csv");
      
      formData.append('selected_date', selectedDate);
      formData.append('selected_columns', schemaColumns.join(','));
      
      // Send to FastAPI backend
      const response = await fetch(`${API_URL}/upload-csv/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
      
      const result = await response.json();
      
      toast.success("CSV data uploaded successfully", {
        description: result.message || `${processedData.length} records uploaded`
      });
      
      onUploadComplete(selectedDate);
      setShowColumnSelector(false);
      setFile(null);
      setCsvData([]);
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Upload failed", { 
        description: error instanceof Error ? error.message : "Please check file format and try again" 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-medium">Upload Sundai Event Data</h2>
      
      <div className="space-y-2">
        <label htmlFor="upload-date" className="block text-sm font-medium text-gray-700">
          Select Event Date
        </label>
        <input
          type="date"
          id="upload-date"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <Button 
          className="w-full flex items-center justify-center gap-2"
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? "Uploading..." : "Select Sundai Guest CSV"}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500">
        Upload the Sundai6AprAISecurity_406_guests.csv file for the selected event date
      </p>

      {/* Review Dialog */}
      <Dialog open={showColumnSelector} onOpenChange={setShowColumnSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Data Before Upload</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <p>The following data will be uploaded:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>name (from Name)</li>
                <li>email (from [newcomers] Email)</li>
                <li>date (from selected date: {selectedDate})</li>
                <li>status (from Status)</li>
                <li>attendance (empty)</li>
              </ul>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  A total of {csvData.length} records will be uploaded for the Sundai event on {selectedDate}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline"
              onClick={() => setShowColumnSelector(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={uploadToServer}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Event Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CSVUpload;
