import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon, LogOutIcon, ArrowRightLeft, UserIcon, Settings2, AlertTriangle } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { TransactionList } from "./TransactionList";
import { AddTransaction } from "./AddTransaction";
import { EditAccount } from "./EditAccount";
import { SpendingChart } from "./SpendingChart";
import { SpendingTrendChart } from "./SpendingTrendChart";
import { CategoryTrendChart } from "./CategoryTrendChart";
import { WeeklyComparisonChart } from "./WeeklyComparisonChart";
import { MonthlyComparisonChart } from "./MonthlyComparisonChart";
import { TransferFunds } from "./TransferFunds";
import { ThemeToggle } from "./ThemeToggle";
import { OnboardingTour } from "./OnboardingTour";
import { WelcomeDialog } from "./WelcomeDialog";
import { useAuth } from "@/hooks/useAuth";
import { useExpenseData, Account, Transaction } from "@/hooks/useExpenseData";
import { useBudgets } from "@/hooks/useBudgets";
import { useOnboarding } from "@/hooks/useOnboarding";
import { dashboardTourSteps } from "@/utils/tourSteps";
import { supabase } from "@/integrations/supabase/client";
import { CallBackProps, STATUS } from "react-joyride";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { 
    accounts, 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    updateAccount,
    transferFunds
  } = useExpenseData();
  const { alerts: budgetAlerts } = useBudgets();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransferFunds, setShowTransferFunds] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const { run, stepIndex, setStepIndex, completeTour, skipTour, startTour } = useOnboarding();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("profile_image_url, full_name")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (data) {
        setProfileImage(data.profile_image_url || "");
        setUserName(data.full_name || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === "expense") 
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = async (transaction: Omit<Transaction, "id">) => {
    await addTransaction(transaction);
    setShowAddTransaction(false);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    await deleteTransaction(transactionId);
  };

  const handleUpdateAccount = async (accountId: string, updatedAccount: Omit<Account, "id">) => {
    await updateAccount(accountId, updatedAccount);
    setEditingAccount(null);
  };

  const handleTransferFunds = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string
  ) => {
    await transferFunds(fromAccountId, toAccountId, amount, description);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading your financial data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Financial Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track your accounts and spending</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              data-tour="add-transaction"
              onClick={() => setShowAddTransaction(true)}
              className="bg-success hover:bg-success/90 text-success-foreground shadow-financial flex-1 sm:flex-none"
              size="sm"
            >
              <PlusIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button 
              data-tour="transfer-funds"
              onClick={() => setShowTransferFunds(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-1 sm:flex-none"
              size="sm"
            >
              <ArrowRightLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Transfer</span>
            </Button>
            <Button 
              data-tour="features-button"
              onClick={() => navigate("/features")}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-1 sm:flex-none relative"
              size="sm"
            >
              <Settings2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Features</span>
              {budgetAlerts && budgetAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {budgetAlerts.length}
                </span>
              )}
            </Button>
            <Button 
              data-tour="profile-button"
              onClick={() => navigate("/profile")}
              variant="outline"
              className="border-border hover:bg-accent flex items-center gap-2"
              size="sm"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={profileImage} alt={userName || "User"} />
                <AvatarFallback className="text-xs">
                  <UserIcon className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{userName || "Profile"}</span>
            </Button>
            <div data-tour="theme-toggle">
              <ThemeToggle />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  data-tour="signout-button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  size="sm"
                >
                  <LogOutIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign Out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to sign out? You'll need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts && budgetAlerts.length > 0 && (
          <div className="space-y-2">
            {budgetAlerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={alert.alert_type === "exceeded" ? "destructive" : "default"} className="cursor-pointer" onClick={() => navigate("/features")}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
            {budgetAlerts.length > 3 && (
              <Button variant="link" className="text-sm" onClick={() => navigate("/features")}>
                View all {budgetAlerts.length} budget alerts →
              </Button>
            )}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card data-tour="total-balance" className="bg-gradient-card shadow-card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Balance
              </CardTitle>
              <WalletIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-foreground">
                ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card data-tour="total-income" className="bg-gradient-card shadow-card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-success">
                +₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card data-tour="total-expenses" className="bg-gradient-card shadow-card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <TrendingDownIcon className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-destructive">
                -₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Section */}
        <div data-tour="accounts-section" className="space-y-3 md:space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Your Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {accounts.slice(0, 3).map((account) => (
              <AccountCard 
                key={account.id} 
                account={account} 
                onEditAccount={setEditingAccount}
              />
            ))}
          </div>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 auto-rows-fr">
          <div data-tour="spending-trend" className="h-full">
            <SpendingTrendChart transactions={transactions} />
          </div>
          <div data-tour="category-trend" className="h-full">
            <CategoryTrendChart transactions={transactions} />
          </div>
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 auto-rows-fr">
          <div data-tour="weekly-comparison" className="h-full">
            <WeeklyComparisonChart transactions={transactions} />
          </div>
          <div data-tour="monthly-comparison" className="h-full">
            <MonthlyComparisonChart transactions={transactions} />
          </div>
        </div>

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 auto-rows-fr">
          <div data-tour="spending-chart" className="h-full">
            <SpendingChart transactions={transactions} />
          </div>
          <div data-tour="transaction-list" className="h-full">
            <TransactionList 
              transactions={transactions} 
              accounts={accounts}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddTransaction && (
          <AddTransaction
            accounts={accounts}
            onAddTransaction={handleAddTransaction}
            onClose={() => setShowAddTransaction(false)}
          />
        )}

        {/* Edit Account Modal */}
        {editingAccount && (
          <EditAccount
            account={editingAccount}
            onUpdateAccount={handleUpdateAccount}
            onClose={() => setEditingAccount(null)}
          />
        )}

        {/* Transfer Funds Modal */}
        <TransferFunds
          open={showTransferFunds}
          onOpenChange={setShowTransferFunds}
          accounts={accounts}
          onTransfer={handleTransferFunds}
        />

        {/* Welcome Dialog */}
        <WelcomeDialog onStartTour={startTour} onSkip={skipTour} />

        {/* Onboarding Tour */}
        <OnboardingTour
          steps={dashboardTourSteps}
          run={run}
          stepIndex={stepIndex}
          onCallback={handleJoyrideCallback}
        />
      </div>
    </div>
  );
};

export default Dashboard;