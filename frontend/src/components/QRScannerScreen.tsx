import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { format } from "date-fns";

interface QRScannerScreenProps {
  selectedDate: string;
  onBack: () => void;
}

const QRScannerScreen = ({ selectedDate, onBack }: QRScannerScreenProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastScannedRef = useRef<string>("");
  const [showResult, setShowResult] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    email: string;
    verified: boolean;
  } | null>(null);

  // Format the display date correctly
  const displayDate = format(new Date(selectedDate + "T00:00:00"), "MMMM d, yyyy");

  useEffect(() => {
    // Initialize scanner once
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current.render(
      async (decodedText) => {
        // Prevent duplicate scans
        if (decodedText === lastScannedRef.current) {
          return;
        }
        lastScannedRef.current = decodedText;

        try {
          const response = await fetch("https://verifai-199983032721.northamerica-northeast2.run.app/verify/", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ 
              field: "email",
              value: decodedText,
              date: selectedDate // Using the original YYYY-MM-DD format for API
            }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          if (data && typeof data.exists === 'boolean') {
            setVerificationResult({
              email: decodedText,
              verified: data.exists
            });
            setShowResult(true);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error('Verification error:', error);
          toast.error("Verification failed", {
            description: error instanceof Error ? error.message : "Unknown error occurred"
          });
        }

        // Reset last scanned after a delay
        setTimeout(() => {
          lastScannedRef.current = "";
        }, 2000);
      },
      (error) => {
        console.error('Scan error:', error);
        if (error.includes('Permission')) {
          toast.error("Camera access denied", {
            description: "Please allow camera access to scan QR codes"
          });
        }
      }
    );

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [selectedDate]);

  const handleCloseResult = () => {
    setShowResult(false);
    setVerificationResult(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to Date Selection
        </button>
        <div className="text-sm font-medium">
          Date: {displayDate}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4">
        <div id="qr-reader" />
      </div>

      <AlertDialog 
        open={showResult} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowResult(false);
            setVerificationResult(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-between items-start">
              <AlertDialogTitle className="flex items-center gap-2">
                {verificationResult?.verified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Verified Successfully</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>Not Verified</span>
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogCancel className="h-auto p-2 hover:bg-muted">
                <X className="h-4 w-4" />
              </AlertDialogCancel>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>Email: {verificationResult?.email}</p>
              <p>Date: {displayDate}</p>
              <p>
                {verificationResult?.verified
                  ? "This email is registered for the selected date."
                  : "This email is not registered for the selected date."}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QRScannerScreen; 
