import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface QRScannerProps {
  onScan: (data: string, exists: boolean) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

const QRScanner = ({ onScan, isScanning, setIsScanning }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "qr-reader";
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Only initialize if we're scanning
    if (isScanning) {
      initializeScanner();
    }
    
    return () => {
      // Clean up on component unmount
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error clearing scanner:", error);
        }
      }
    };
  }, [isScanning]);

  const initializeScanner = () => {
    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [0], // 0 corresponds to QR_CODE format
        showTorchButtonIfSupported: true,
        aspectRatio: 1,
        showZoomSliderIfSupported: true,
      };

      scannerRef.current = new Html5QrcodeScanner(
        scannerDivId,
        config,
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          // Handle success
          handleScanSuccess(decodedText);
        },
        (errorMessage: string) => {
          // Error is handled internally by the scanner UI
          console.log("QR scan error:", errorMessage);
        }
      );
    } catch (error) {
      console.error("Failed to initialize QR scanner:", error);
      toast.error("Failed to start the camera", {
        description: "Please check camera permissions and try again"
      });
      setIsScanning(false);
    }
  };

  const verifyEmail = async (email: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch("https://verifai-199983032721.us-central1.run.app/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          field: "email",
          value: email 
        }),
      });
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error("Verification failed", {
        description: "Could not verify the scanned email"
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Stop scanning first
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        setIsScanning(false);
        
        // Show verification in progress
        toast.info("Verifying email...");
        
        // Call the verification API
        const exists = await verifyEmail(decodedText);
        
        // Show result
        if (exists) {
          toast.success("Email verified", {
            description: "The email was found in the database"
          });
        } else {
          toast.error("Email not found", {
            description: "The email was not found in the database"
          });
        }
        
        // Pass both the email and verification result to the parent component
        onScan(decodedText, exists);
      } catch (error) {
        console.error("Error during scan and verification process:", error);
      }
    }
  };

  const startScanning = () => {
    setIsScanning(true);
  };

  return (
    <div className="mb-6">
      {isScanning ? (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium mb-4">Scan QR Code</h2>
          <div id={scannerDivId} className="qr-scanner-container" />
        </div>
      ) : (
        <Button 
          className="w-full" 
          onClick={startScanning}
          disabled={isVerifying}
        >
          {isVerifying ? "Verifying..." : "Start QR Scanning"}
        </Button>
      )}
    </div>
  );
};

export default QRScanner;
