import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowUpRight,
  ArrowLeft,
  Target,
  Globe,
  FileSpreadsheet,
  LogOut,
  UserIcon,
  Wallet,
  ArrowDownRight,
  ArrowRightLeft,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import { BudgetManager } from "@/components/BudgetManager";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { ExportImport } from "@/components/ExportImport";
import { AccountManager } from "@/components/AccountManager";
import { BottomNavigation } from "@/components/BottomNavigation";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useExpenseData } from "@/hooks/useExpenseData";
import { useOnboarding } from "@/hooks/useOnboarding";
import { featuresTourSteps } from "@/utils/tourSteps";
import { supabase } from "@/integrations/supabase/client";
import { ImportedTransaction } from "@/utils/exportUtils";
import { CallBackProps, STATUS } from "react-joyride";
import { MonthlyComparisonChart } from "@/components/MonthlyComparisonChart";
import { SpendingChart } from "@/components/SpendingChart";

const formatMoney = (value: number) =>
  `₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const getMonthRangeLabel = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`;
};

const Features = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { accounts, transactions, addTransaction, addAccount, updateAccount, deleteAccount, removeDuplicateAccounts, reorderAccounts, transferFunds } = useExpenseData();
  const [profileImage, setProfileImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState("accounts");
  const { run, stepIndex, setStepIndex, completeTour, skipTour } = useOnboarding();

  const totalIncome = useMemo(
    () => transactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () => transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  const netSavings = totalIncome - totalExpenses;

  const spendingCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();

    transactions
      .filter((transaction) => transaction.type !== "income")
      .forEach((transaction) => {
        const currentTotal = categoryMap.get(transaction.category) || 0;
        categoryMap.set(transaction.category, currentTotal + Math.abs(transaction.amount));
      });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab") || (location.state as any)?.tab;
    if (tabParam && ["accounts", "budgets", "currency", "export"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search, location.state]);

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button data-tour="back-to-dashboard" variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base sm:text-lg font-semibold">Advanced Features</h1>
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
      <main className="container px-3 sm:px-4 py-4 sm:py-6 pb-32 md:pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-10 sm:h-11">
            <TabsTrigger data-tour="accounts-tab" value="accounts" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Accounts</span>
            </TabsTrigger>
            <TabsTrigger data-tour="budgets-tab" value="budgets" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Budgets</span>
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
              onReorderAccounts={reorderAccounts}
              onTransferFunds={transferFunds}
            />
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetManager />
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

      <BottomNavigation />
    </div>
  );
};

export default Features;
