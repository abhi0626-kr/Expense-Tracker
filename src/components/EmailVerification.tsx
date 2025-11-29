import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  onVerified: (code: string) => Promise<void>;
  onResend: () => void;
  onBack: () => void;
  loading?: boolean;
}

export const EmailVerification = ({
  email,
  onVerified,
  onResend,
  onBack,
  loading = false,
}: EmailVerificationProps) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      await onVerified(code);
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md bg-card shadow-financial">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          Verify Your Email
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          We've sent a 6-digit verification code to<br />
          <strong>{email}</strong>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input
            id="verification-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={handleKeyPress}
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
        </div>

        <Button
          onClick={handleVerify}
          className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-financial"
          disabled={code.length !== 6 || verifying || loading}
        >
          {verifying || loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={loading}
          >
            ← Back
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={onResend}
            disabled={loading}
            className="text-primary"
          >
            Resend Code
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>• Code expires in 10 minutes</p>
          <p>• Check your spam folder if you don't see the email</p>
        </div>
      </CardContent>
    </Card>
  );
};
