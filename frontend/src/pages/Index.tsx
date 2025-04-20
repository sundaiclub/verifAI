import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Layout from "../components/Layout";
import CSVUpload from "../components/CSVUpload";
import QRScanner from "../components/QRScanner";
import VerificationResult from "../components/VerificationResult";
import { Button } from "@/components/ui/button";
import { downloadSampleCSV } from "@/lib/utils";

const Index = () => {
  const { isSignedIn } = useAuth();
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    scannedData?: string;
  } | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleQRScan = (scannedData: string, exists: boolean) => {
    setVerificationResult({
      verified: exists,
      scannedData
    });
  };
  
  const handleReset = () => {
    setVerificationResult(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {isSignedIn && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowUpload(!showUpload)}
            >
              {showUpload ? "Back to Scanner" : "Upload Data"}
            </Button>
          </div>
        )}

        {showUpload && isSignedIn ? (
          <div className="space-y-4">
            <CSVUpload onUploadComplete={() => setShowUpload(false)} />
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={downloadSampleCSV}
              >
                Download Sample CSV
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {verificationResult ? (
              <VerificationResult
                result={verificationResult}
                onReset={handleReset}
              />
            ) : (
              <QRScanner
                onScan={handleQRScan}
                isScanning={!verificationResult}
                setIsScanning={() => {}}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
