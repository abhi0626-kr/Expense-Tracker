import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WalletIcon, Mail } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if this is a new user from magic link who needs to set password
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const type = hashParams.get('type');
        
        if (type === 'signup') {
          // New user clicked magic link - show password creation
          setIsSettingPassword(true);
          setEmail(session.user.email || "");
        } else if (type === 'magiclink' || type === 'recovery') {
          // Existing user or password reset - allow them in
          navigate("/");
        } else {
          // Regular session
          navigate("/");
        }
      }
    };
    checkUser();
  }, [navigate, location]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user already exists
      const { error } = await supabase.auth.signUp({
        email: email,
        password: Math.random().toString(36).substring(2, 15), // Temporary random password
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            email_confirmed: false,
          }
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

      setEmailSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email and click the link to set your password.",
      });
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

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update password for the authenticated user
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Failed to set password",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Sign out the user so they can sign in with their new password
      await supabase.auth.signOut();

      toast({
        title: "Password created successfully!",
        description: "Please sign in with your email and new password.",
      });
      
      // Reset state to show sign-in form
      setIsSettingPassword(false);
      setPassword("");
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

  if (isSettingPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-financial">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <WalletIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Create Your Password
            </CardTitle>
            <p className="text-muted-foreground">
              Welcome! Set a password to secure your account
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a strong password with at least 6 characters
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-financial"
                disabled={loading || password.length < 6}
              >
                {loading ? "Creating password..." : "Create Password"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                After creating your password, you'll be redirected to sign in
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-financial">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-success/10 p-3">
                <Mail className="h-8 w-8 text-success" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Check your email
            </CardTitle>
            <p className="text-muted-foreground">
              We've sent a magic link to <strong>{email}</strong>
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Next steps:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click the magic link in your email</li>
                <li>Create your password</li>
                <li>Sign in with your email and password</li>
              </ol>
              <p className="text-xs mt-2">The link will expire in 1 hour.</p>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
            >
              Use a different email
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
            Expense Tracker
          </CardTitle>
          <p className="text-muted-foreground">
            Manage your finances with ease
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
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
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
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
                
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
                  <p className="font-medium text-foreground mb-1">How it works:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Enter your email address</li>
                    <li>We'll send you a magic link</li>
                    <li>Click the link to create your password</li>
                    <li>Sign in and start tracking expenses!</li>
                  </ul>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-financial"
                  disabled={loading}
                >
                  {loading ? "Sending link..." : "Sign Up"}
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