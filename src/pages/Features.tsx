import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Target,
  Repeat,
  Globe,
  FileSpreadsheet,
  LogOut,
  UserIcon,
  Wallet,
} from "lucide-react";
import { BudgetManager } from "@/components/BudgetManager";
import { RecurringTransactions } from "@/components/RecurringTransactions";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { ExportImport } from "@/components/ExportImport";
import { AccountManager } from "@/components/AccountManager";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useExpenseData } from "@/hooks/useExpenseData";
import { useOnboarding } from "@/hooks/useOnboarding";
import { featuresTourSteps } from "@/utils/tourSteps";
import { supabase } from "@/integrations/supabase/client";
import { ImportedTransaction } from "@/utils/exportUtils";
import { CallBackProps, STATUS } from "react-joyride";

const Features = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { accounts, transactions, addTransaction, addAccount, updateAccount, deleteAccount, removeDuplicateAccounts } = useExpenseData();
  const [profileImage, setProfileImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState("accounts");
  const { run, stepIndex, setStepIndex, completeTour, skipTour } = useOnboarding();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("profile_image_url")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (data) {
        setProfileImage(data.profile_image_url || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleImportTransactions = async (
    importedTransactions: ImportedTransaction[],
    accountId: string
  ) => {
    for (const tx of importedTransactions) {
      await addTransaction({
        account_id: accountId,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: `[Imported] ${tx.description}`,
        date: tx.date,
        time: tx.time || "00:00"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (status === STATUS.SKIPPED) {
        skipTour();
      } else {
        completeTour();
      }
    } else if (type === 'step:after' || type === 'target:found') {
      setStepIndex(index + (type === 'step:after' ? 1 : 0));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button data-tour="back-to-dashboard" variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base sm:text-xl font-semibold">Advanced Features</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/profile")}>
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src={profileImage} />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4 sm:mb-6 h-10 sm:h-11">
            <TabsTrigger data-tour="accounts-tab" value="accounts" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Accounts</span>
            </TabsTrigger>
            <TabsTrigger data-tour="budgets-tab" value="budgets" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Budgets</span>
            </TabsTrigger>
            <TabsTrigger data-tour="recurring-tab" value="recurring" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Repeat className="h-4 w-4" />
              <span className="hidden sm:inline">Recurring</span>
            </TabsTrigger>
            <TabsTrigger data-tour="currency-tab" value="currency" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Currency</span>
            </TabsTrigger>
            <TabsTrigger data-tour="export-tab" value="export" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <AccountManager
              accounts={accounts}
              onAddAccount={addAccount}
              onUpdateAccount={updateAccount}
              onDeleteAccount={deleteAccount}
              onRemoveDuplicates={removeDuplicateAccounts}
            />
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetManager />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringTransactions accounts={accounts} />
          </TabsContent>

          <TabsContent value="currency">
            <CurrencyConverter />
          </TabsContent>

          <TabsContent value="export">
            <ExportImport
              transactions={transactions}
              accounts={accounts}
              onImportTransactions={handleImportTransactions}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Onboarding Tour */}
      <OnboardingTour
        steps={featuresTourSteps}
        run={run}
        stepIndex={stepIndex}
        onCallback={handleJoyrideCallback}
      />
    </div>
  );
};

export default Features;
