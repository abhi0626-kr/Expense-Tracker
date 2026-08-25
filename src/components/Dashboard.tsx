import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { PlusIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon, LogOutIcon, ArrowRightLeft, UserIcon, Settings2, AlertTriangle, FileTextIcon } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { TransactionList } from "./TransactionList";
import { AddTransaction } from "./AddTransaction";
import SlideButton from "@/components/ui/slide-button";
import { EditAccount } from "./EditAccount";
import { TransferFunds } from "./TransferFunds";
import { ThemeToggle } from "./ThemeToggle";
import { BottomNavigation } from "./BottomNavigation";
import { OnboardingTour } from "./OnboardingTour";
import { WelcomeDialog } from "./WelcomeDialog";
import { useAuth } from "@/hooks/useAuth";
import { useExpenseData, Account, TransactionInput } from "@/hooks/useExpenseData";
import { useBudgets } from "@/hooks/useBudgets";
import { useOnboarding } from "@/hooks/useOnboarding";
import { dashboardTourSteps } from "@/utils/tourSteps";
import { supabase } from "@/integrations/supabase/client";
import { CallBackProps, STATUS } from "react-joyride";
import { getPinnedAccountIds } from "@/lib/pinnedAccount";

const ADD_TRANSACTION_DRAFT_KEY = "expense-tracker:add-transaction-draft";

const formatMoney = (value: number) =>
  `₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatShortDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

const getTransactionTone = (transaction: { type: string; amount: number; category: string }) => {
  const isTransfer = transaction.type === "transfer" || transaction.category.toLowerCase().includes("transfer");
  const isCredit = isTransfer ? transaction.amount > 0 : transaction.type === "income";

  return {
    label: isTransfer ? "Transfer" : transaction.type === "income" ? "Income" : "Expense",
    sign: isCredit ? "+" : "-",
    amountClass: isCredit ? "text-success" : "text-destructive",
    iconClass: isCredit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [pinnedAccountIds, setPinnedAccountIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const key = `expense-tracker:pinned-account:${user?.id}`;
      const v = user ? getPinnedAccountIds(user.id) : [];
      setPinnedAccountIds(v || []);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) setPinnedAccountIds(getPinnedAccountIds(user?.id));
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    } catch (e) {
      // ignore
    }
  }, [user?.id, accounts]);
  const { alerts: budgetAlerts } = useBudgets();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransferFunds, setShowTransferFunds] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const { run, stepIndex, setStepIndex, completeTour, skipTour, startTour } = useOnboarding();

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

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
    if (params.get("add") === "true") {
      setShowAddTransaction(true);
    }

    const handleOpenAddModal = () => {
      setShowAddTransaction(true);
    };

    window.addEventListener("open-add-transaction-modal", handleOpenAddModal);
    return () => {
      window.removeEventListener("open-add-transaction-modal", handleOpenAddModal);
    };
  }, [location.search]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(ADD_TRANSACTION_DRAFT_KEY);
    if (savedDraft) {
      setShowAddTransaction(true);
    }
  }, []);

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

  const handleAddTransaction = async (transaction: TransactionInput) => {
    const success = await addTransaction(transaction);
    if (success) {
      setShowAddTransaction(false);
    }
    return success;
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
    description: string,
    date: string,
    time: string
  ) => {
    await transferFunds(fromAccountId, toAccountId, amount, description, date, time);
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative md:hidden mx-auto flex min-h-screen max-w-[430px] flex-col px-3 pt-3 pb-32 text-foreground">
        <header className="rounded-2xl border border-border bg-card/90 px-3.5 py-3 shadow-md backdrop-blur-xl dark:bg-slate-950/80 dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Financial Dashboard</p>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Welcome back, {userName || "there"}</h1>
              <p className="text-[11px] text-muted-foreground">Track your money, one move at a time.</p>
            </div>

            <div className="flex items-center gap-2">
              <div data-tour="theme-toggle" className="rounded-full border border-border bg-muted/50 p-1.5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <ThemeToggle />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full border border-border bg-muted/50 text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                onClick={() => navigate("/profile")}
                data-tour="profile-button"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profileImage} alt={userName || "User"} />
                  <AvatarFallback className="bg-muted text-xs text-muted-foreground dark:bg-slate-800 dark:text-slate-200">
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 dark:border-white/10">
            <Button
              data-tour="features-button"
              onClick={() => navigate("/features")}
              variant="outline"
              className="h-10 flex-1 border-border bg-muted/40 text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              size="sm"
            >
              Features
            </Button>

            <Button
              onClick={() => setShowTransferFunds(true)}
              variant="outline"
              className="h-10 flex-1 border-border bg-muted/40 text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 flex items-center justify-center gap-1.5"
              size="sm"
            >
              <ArrowRightLeft className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
              <span>Transfer</span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-tour="signout-button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-border bg-muted/40 text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <LogOutIcon className="h-4 w-4" />
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
        </header>

        {/* debug panel removed */}

        {budgetAlerts && budgetAlerts.length > 0 && (
          <div className="mt-3 space-y-2">
            {budgetAlerts.slice(0, 2).map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.alert_type === "exceeded" ? "destructive" : "default"}
                className="cursor-pointer border-border bg-card text-sm text-card-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                onClick={() => navigate("/features")}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <section className="mt-4 grid grid-cols-3 gap-2.5">
          <Card
            data-tour="total-balance"
            className="rounded-[22px] border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card to-card text-card-foreground shadow-sm backdrop-blur dark:border-white/10 dark:from-cyan-500/20 dark:via-slate-950 dark:to-slate-950 dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
          >
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-slate-300">
                <span>Total Balance</span>
                <WalletIcon className="h-[18px] w-[18px] text-cyan-600 dark:text-cyan-300" />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-foreground dark:text-white">{formatMoney(totalBalance)}</div>
            </CardContent>
          </Card>

          <Card
            data-tour="total-income"
            className="rounded-[22px] border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card text-card-foreground shadow-sm backdrop-blur dark:border-white/10 dark:from-emerald-500/20 dark:via-slate-950 dark:to-slate-950 dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
          >
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-slate-300">
                <span>Total Income</span>
                <TrendingUpIcon className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-emerald-600 dark:text-emerald-300">+{formatMoney(totalIncome)}</div>
            </CardContent>
          </Card>

          <Card
            data-tour="total-expenses"
            className="rounded-[22px] border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card to-card text-card-foreground shadow-sm backdrop-blur dark:border-white/10 dark:from-rose-500/20 dark:via-slate-950 dark:to-slate-950 dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
          >
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-slate-300">
                <span>Total Expense</span>
                <TrendingDownIcon className="h-[18px] w-[18px] text-rose-600 dark:text-rose-300" />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-rose-600 dark:text-rose-300">-{formatMoney(totalExpenses)}</div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 space-y-3" data-tour="accounts-section">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-semibold text-foreground">My Accounts</h2>
              <p className="text-xs text-muted-foreground">Balances across your main accounts</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => navigate("/features?tab=accounts")}
            >
              View all
            </Button>
          </div>

          <div className="space-y-2.5">
            {(() => {
              if (!accounts || accounts.length === 0) return null;
              if (pinnedAccountIds && pinnedAccountIds.length > 0) {
                const pinned = accounts.filter(a => pinnedAccountIds.includes(a.id));
                const others = accounts.filter(a => !pinnedAccountIds.includes(a.id));
                const list = [...pinned, ...others].slice(0, 3);
                return list.map((account) => (
                  <AccountCard key={account.id} account={account} isPinned={pinnedAccountIds.includes(account.id)} onEditAccount={setEditingAccount} />
                ));
              }

              return accounts.slice(0, 3).map((account) => (
                <AccountCard key={account.id} account={account} isPinned={false} onEditAccount={setEditingAccount} />
              ));
            })()}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_18px_60px_rgba(0,0,0,0.28)]" data-tour="category-trend">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Top Spending Categories</h2>
              <p className="text-[11px] text-muted-foreground">Where your money goes</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:bg-muted"
              onClick={() => navigate("/reports")}
            >
              Full Reports →
            </Button>
          </div>

          <div className="mt-4 space-y-2.5">
            {spendingCategories.length === 0 ? (
              <p className="rounded-2xl border border-border bg-muted/30 px-3 py-4 text-[13px] text-muted-foreground dark:border-white/10 dark:bg-white/5">
                No expense data yet.
              </p>
            ) : (
              spendingCategories.slice(0, 4).map((item, index) => {
                const total = spendingCategories.reduce((sum, entry) => sum + entry.amount, 0) || 1;
                const width = `${Math.max(12, Math.round((item.amount / total) * 100))}%`;

                return (
                  <div key={item.category} className="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-3.5 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium text-foreground">{item.category}</span>
                      <span className="text-muted-foreground">{Math.round((item.amount / total) * 100)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted dark:bg-white/10">
                      <div
                        className={`h-full rounded-full ${index % 3 === 0 ? "bg-emerald-500" : index % 3 === 1 ? "bg-cyan-500" : "bg-violet-500"}`}
                        style={{ width }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{formatMoney(item.amount)}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_18px_60px_rgba(0,0,0,0.28)]" data-tour="transaction-list">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-[11px] text-muted-foreground">Latest activity from your accounts</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => navigate("/transactions")}
            >
              View all
            </Button>
          </div>

          <div className="mt-4 space-y-2.5">
            {recentTransactions.length === 0 ? (
              <p className="rounded-2xl border border-border bg-muted/30 px-3 py-5 text-center text-[13px] text-muted-foreground dark:border-white/10 dark:bg-white/5">
                No transactions yet.
              </p>
            ) : (
              recentTransactions.map((transaction) => {
                const tone = getTransactionTone(transaction);

                return (
                  <div key={transaction.id} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3.5 dark:border-white/10 dark:bg-white/5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone.iconClass}`}>
                      {tone.sign === "+" ? (
                        <TrendingUpIcon className="h-4.5 w-4.5" />
                      ) : (
                        <TrendingDownIcon className="h-4.5 w-4.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-medium text-foreground">{transaction.category || tone.label}</p>
                        <p className={`whitespace-nowrap text-[13px] font-semibold ${tone.amountClass}`}>
                          {tone.sign}{formatMoney(transaction.amount)}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{transaction.description}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80">{formatShortDate(transaction.date)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <BottomNavigation onAddClick={() => setShowAddTransaction(true)} onTransferClick={() => setShowTransferFunds(true)} />
      </div>

      <div className="hidden md:block container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Financial Dashboard</h1>
            <p className="text-xs text-muted-foreground">Track your accounts and spending</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SlideButton
              data-tour="add-transaction"
              label="Add Transaction"
              onSlideComplete={() => setShowAddTransaction(true)}
              onDoubleClick={() => setShowAddTransaction(true)}
              onClick={() => setShowAddTransaction(true)}
              className="w-52 flex-none"
            />
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
              <Alert key={alert.id} variant={alert.alert_type === "exceeded" ? "destructive" : "default"} className="cursor-pointer" onClick={() => navigate("/features?tab=budgets")}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
            {budgetAlerts.length > 3 && (
              <Button variant="link" className="text-sm" onClick={() => navigate("/features?tab=budgets")}>
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
            {(() => {
              if (!accounts || accounts.length === 0) return null;
              if (pinnedAccountIds && pinnedAccountIds.length > 0) {
                const pinned = accounts.filter(a => pinnedAccountIds.includes(a.id));
                const others = accounts.filter(a => !pinnedAccountIds.includes(a.id));
                const list = [...pinned, ...others].slice(0, 3);
                return list.map(account => (
                  <AccountCard key={account.id} account={account} isPinned={pinnedAccountIds.includes(account.id)} onEditAccount={setEditingAccount} />
                ));
              }
              return accounts.slice(0, 3).map(account => (
                <AccountCard key={account.id} account={account} isPinned={false} onEditAccount={setEditingAccount} />
              ));
            })()}
          </div>
        </div>

        {/* Activity & Category Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
          <div data-tour="transaction-list">
            <TransactionList 
              transactions={transactions} 
              accounts={accounts}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>

          <Card data-tour="category-trend" className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Top Expense Categories</h3>
                <p className="text-xs text-muted-foreground">Category breakdown from your spending</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-full border-border text-foreground hover:bg-muted"
                onClick={() => navigate("/reports")}
              >
                View Analytics & Reports →
              </Button>
            </div>

            <div className="space-y-3">
              {spendingCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No expense categories yet.</p>
              ) : (
                spendingCategories.slice(0, 5).map((item, index) => {
                  const total = spendingCategories.reduce((sum, entry) => sum + entry.amount, 0) || 1;
                  const pct = Math.round((item.amount / total) * 100);

                  return (
                    <div key={item.category} className="space-y-1 rounded-xl border border-border bg-muted/20 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-foreground">{item.category}</span>
                        <span className="text-muted-foreground">{pct}% ({formatMoney(item.amount)})</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${index % 3 === 0 ? "bg-emerald-500" : index % 3 === 1 ? "bg-cyan-500" : "bg-violet-500"}`}
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransaction
          accounts={accounts}
          onAddTransaction={handleAddTransaction}
          onClose={() => {
            setShowAddTransaction(false);
            if (location.search.includes("add=true")) {
              navigate(location.pathname, { replace: true });
            }
          }}
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
  );
};

export default Dashboard;