import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Layout from "../components/Layout";
import CSVUpload from "../components/CSVUpload";
import QRScanner from "../components/QRScanner";
import DateSelector from "../components/DateSelector";
import VerificationResult from "../components/VerificationResult";
import databaseManager from "../lib/database";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadSampleCSV } from "@/lib/utils";
import { SignInButton } from "@clerk/clerk-react";

const Index = () => {
  const { isSignedIn } = useAuth();
  const [activeDate, setActiveDate] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    entry?: Record<string, string>;
    scannedData?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("scan");

  const handleDateChange = (date: string) => {
    setActiveDate(date);
  };

  const handleUploadComplete = (date: string) => {
    setActiveDate(date);
    setActiveTab("scan");
  };

  const handleQRScan = (scannedData: string) => {
    if (!activeDate) {
      setVerificationResult({
        verified: false,
        scannedData,
      });
      return;
    }

    const result = databaseManager.verifyQRData(activeDate, scannedData);
    setVerificationResult({
      ...result,
      scannedData,
    });
  };

  const handleReset = () => {
    setVerificationResult(null);
  };

  return (
    <Layout>
      <div className="mb-4">
        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList
            className="grid w-full"
            style={{ gridTemplateColumns: isSignedIn ? "1fr 1fr" : "1fr" }}
          >
            <TabsTrigger value="scan">Scan & Verify</TabsTrigger>
            {isSignedIn && (
              <TabsTrigger value="upload">Upload Data</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="scan" className="pt-4">
            {databaseManager.getDates().length > 0 && (
              <DateSelector
                onDateChange={handleDateChange}
                activeDate={activeDate || databaseManager.getDates()[0]}
              />
            )}

            {verificationResult ? (
              <VerificationResult
                result={verificationResult}
                onReset={handleReset}
              />
            ) : (
              <QRScanner
                onScan={handleQRScan}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
              />
            )}

            {databaseManager.getDates().length === 0 &&
              !isScanning &&
              !verificationResult && (
                <div className="p-4 bg-white rounded-lg shadow-sm text-center">
                  <p className="mb-2">No verification data available</p>
                  {isSignedIn ? (
                    <Button
                      onClick={() => setActiveTab("upload")}
                      variant="outline"
                    >
                      Upload CSV Data First
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setActiveTab("upload")}
                      variant="outline"
                    >
                      Sign in to Upload Data
                    </Button>
                  )}
                </div>
              )}
          </TabsContent>

          {isSignedIn && (
            <TabsContent value="upload" className="pt-4">
              <CSVUpload onUploadComplete={handleUploadComplete} />
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm"
                  onClick={downloadSampleCSV}
                >
                  Download Sample CSV
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
