import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WalletIcon, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { EmailVerification } from "@/components/EmailVerification";
import {
  generateVerificationCode,
  sendVerificationEmail,
  storeVerificationCode,
  verifyCode,
} from "@/utils/emailVerification";

// Get your hCaptcha site key from Supabase Dashboard > Settings > Auth > Bot and Abuse Prevention
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "YOUR_HCAPTCHA_SITE_KEY";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSignIn, setIsSignIn] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate and send verification code via EmailJS
      const code = generateVerificationCode();
      const { success, error: emailError } = await sendVerificationEmail(email, code);

      if (!success) {
        toast({
          title: "Failed to send verification email",
          description: emailError || "Please check your EmailJS configuration.",
          variant: "destructive",
        });
        setCaptchaToken(null);
        captchaRef.current?.resetCaptcha();
        return;
      }

      // Store code for verification
      storeVerificationCode(email, code);
      setVerificationCode(code);

      toast({
        title: "Verification code sent!",
        description: "Check your email for the 6-digit code.",
      });

      // Show verification screen
      setShowEmailVerification(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      // Reset captcha on error
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerified = async () => {
    setLoading(true);
    try {
      // Now create the account in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            email_verified: true,
          },
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account created successfully!",
        description: "You can now sign in with your credentials.",
      });

      // Reset form and switch to sign in
      setShowEmailVerification(false);
      setIsSignIn(true);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const code = generateVerificationCode();
      const { success, error } = await sendVerificationEmail(email, code);

      if (!success) {
        toast({
          title: "Failed to resend code",
          description: error || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      storeVerificationCode(email, code);
      setVerificationCode(code);

      toast({
        title: "Code resent!",
        description: "Check your email for the new code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setResetEmailSent(true);
      toast({
        title: "Reset email sent!",
        description: "Check your email for the password reset link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <EmailVerification
          email={email}
          onVerified={async (inputCode) => {
            const result = verifyCode(email, inputCode);
            if (!result.valid) {
              toast({
                title: "Verification failed",
                description: result.error || "Invalid code.",
                variant: "destructive",
              });
              throw new Error(result.error);
            }
            await handleEmailVerified();
          }}
          onResend={handleResendCode}
          onBack={() => {
            setShowEmailVerification(false);
            setCaptchaToken(null);
            captchaRef.current?.resetCaptcha();
          }}
          loading={loading}
        />
      </div>
    );
  }

  if (showPasswordReset) {
    if (resetEmailSent) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card shadow-financial">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-success/10 p-3">
                  <WalletIcon className="h-8 w-8 text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Check your email
              </CardTitle>
              <p className="text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Next steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click the link in your email</li>
                  <li>Create your new password</li>
                  <li>Sign in with your new credentials</li>
                </ol>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetEmailSent(false);
                  setEmail("");
                }}
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-financial">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <WalletIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Reset Password
            </CardTitle>
            <p className="text-muted-foreground">
              Enter your email to receive a password reset link
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-financial"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowPasswordReset(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card shadow-financial">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <WalletIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Expense Tracker
          </CardTitle>
          <p className="text-muted-foreground">
            Manage your finances with ease
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isSignIn ? "signin" : "signup"} onValueChange={(v) => setIsSignIn(v === "signin")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Signing in..." : "Continue with Google"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-financial"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswordReset(true)}
                >
                  Forgot password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Signing up..." : "Sign up with Google"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
                  <p className="font-medium text-foreground mb-1">📧 Email confirmation required</p>
                  <p className="text-xs">We'll send you a confirmation link to verify your email address.</p>
                </div>
                
                <div className="flex justify-center">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-financial"
                  disabled={loading || !captchaToken}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
