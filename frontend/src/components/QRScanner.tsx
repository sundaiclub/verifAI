import { useState } from "react";
import { Button } from "@/components/ui/button";
import DateSelector from "./DateSelector";
import QRScannerScreen from "./QRScannerScreen";
import { toast } from "@/components/ui/sonner";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

interface QRScannerProps {
  onScan: (data: string, exists: boolean) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

const QRScanner = ({ onScan, isScanning, setIsScanning }: QRScannerProps) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showScanner, setShowScanner] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleDateSelect = () => {
    if (!selectedDate) {
      toast.error("Please select a date first");
      return;
    }
    setShowScanner(true);
    setIsScanning(true);
  };

  const handleBack = () => {
    setShowScanner(false);
    setIsScanning(false);
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  if (showScanner) {
    return (
      <QRScannerScreen
        selectedDate={selectedDate}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DateSelector 
        onDateChange={setSelectedDate}
        activeDate={selectedDate}
      />
      
      <div className="bg-white rounded p-4">
        <Button 
          className="w-full" 
          onClick={handleDateSelect}
          disabled={!selectedDate}
        >
          Continue to Scanner
        </Button>
      </div>

      <AlertDialog open={showResult} onOpenChange={handleCloseResult}>
        <AlertDialogContent className="max-w-md">
          {/* Alert dialog content */}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QRScanner;