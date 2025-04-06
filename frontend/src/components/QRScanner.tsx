
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface QRScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

const QRScanner = ({ onScan, isScanning, setIsScanning }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "qr-reader";

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

  const handleScanSuccess = (decodedText: string) => {
    // Stop scanning
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        setIsScanning(false);
        onScan(decodedText);
      } catch (error) {
        console.error("Error clearing scanner after successful scan:", error);
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
        <Button className="w-full" onClick={startScanning}>
          Start QR Scanning
        </Button>
      )}
    </div>
  );
};

export default QRScanner;
