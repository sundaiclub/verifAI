import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationResultProps {
  result: {
    verified: boolean;
    scannedData?: string;
  } | null;
  onReset: () => void;
}

const VerificationResult = ({ result, onReset }: VerificationResultProps) => {
  if (!result) return null;

  return (
    <Card className={`mb-6 border-l-4 ${result.verified ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          {result.verified ? (
            <>
              <CheckCircle className="text-green-500" size={24} />
              <span>Verified</span>
            </>
          ) : (
            <>
              <XCircle className="text-red-500" size={24} />
              <span>Not Verified</span>
            </>
          )}
        </CardTitle>
        <CardDescription>
          {result.verified 
            ? "The email was found in the database" 
            : "No matching email found in the database"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="font-medium">Scanned Email:</h3>
          <div className="text-sm break-all border-b pb-2">
            {result.scannedData || "No data"}
          </div>
        </div>
        <Button className="w-full mt-4" onClick={onReset}>
          Scan Another
        </Button>
      </CardContent>
    </Card>
  );
};

export default VerificationResult;
