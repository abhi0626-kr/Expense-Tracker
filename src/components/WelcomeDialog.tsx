import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface WelcomeDialogProps {
  onStartTour: () => void;
  onSkip: () => void;
}

export const WelcomeDialog = ({ onStartTour, onSkip }: WelcomeDialogProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome dialog
    const hasSeenWelcome = localStorage.getItem("expense-tracker-onboarding-completed");
    
    if (!hasSeenWelcome) {
      // Show dialog after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartTour = () => {
    setOpen(false);
    // Wait for dialog animation to complete before starting tour
    setTimeout(() => {
      onStartTour();
    }, 500);
  };

  const handleSkip = () => {
    setOpen(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Welcome to Expense Tracker!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            We're excited to help you take control of your finances! 💰
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Would you like a quick guided tour? We'll show you all the features and how to use them effectively.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">What you'll learn:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>How to add and manage transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Setting up accounts and transferring funds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Understanding your spending with charts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Using budgets, recurring transactions, and more</span>
              </li>
            </ul>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Don't worry! You can restart this tour anytime from your profile settings.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full sm:w-auto"
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleStartTour}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Start Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
