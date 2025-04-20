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
    <div className={`p-6 bg-white rounded border-l-4 ${result.verified ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <div className="flex items-center gap-2 mb-2">
        {result.verified ? (
          <>
            <CheckCircle className="text-green-500" size={24} />
            <span className="font-medium">Verified</span>
          </>
        ) : (
          <>
            <XCircle className="text-red-500" size={24} />
            <span className="font-medium">Not Verified</span>
          </>
        )}
      </div>
      
      <p className="text-gray-600 mb-4">
        {result.verified 
          ? "The email was found in the database" 
          : "No matching email found in the database"}
      </p>

      <div className="space-y-2 mb-4">
        <div className="font-medium">Scanned Email:</div>
        <div className="text-sm break-all pb-2 border-b">
          {result.scannedData || "No data"}
        </div>
      </div>

      <Button className="w-full" onClick={onReset}>
        Scan Another
      </Button>
    </div>
  );
};

export default VerificationResult;
