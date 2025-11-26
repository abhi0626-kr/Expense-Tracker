import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon, LogOutIcon, ArrowRightLeft, UserIcon } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useExpenseData, Account, Transaction } from "@/hooks/useExpenseData";
import { supabase } from "@/integrations/supabase/client";

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
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransferFunds, setShowTransferFunds] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

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

  const handleUpdateAccount = async (accountId: string, updatedAccount: Omit<Account, "id" | "balance">) => {
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
              onClick={() => setShowAddTransaction(true)}
              className="bg-success hover:bg-success/90 text-success-foreground shadow-financial flex-1 sm:flex-none"
              size="sm"
            >
              <PlusIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button 
              onClick={() => setShowTransferFunds(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-1 sm:flex-none"
              size="sm"
            >
              <ArrowRightLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Transfer</span>
            </Button>
            <Button 
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
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              size="sm"
            >
              <LogOutIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-gradient-card shadow-card-shadow">
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

          <Card className="bg-gradient-card shadow-card-shadow">
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

          <Card className="bg-gradient-card shadow-card-shadow">
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
        <div className="space-y-3 md:space-y-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SpendingTrendChart transactions={transactions} />
          <CategoryTrendChart transactions={transactions} />
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <WeeklyComparisonChart transactions={transactions} />
          <MonthlyComparisonChart transactions={transactions} />
        </div>

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SpendingChart transactions={transactions} />
          <TransactionList 
            transactions={transactions} 
            onDeleteTransaction={handleDeleteTransaction}
          />
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
      </div>
    </div>
  );
};

export default Dashboard;