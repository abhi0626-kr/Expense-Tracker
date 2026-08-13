import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  WalletIcon,
  PieChartIcon,
  BarChart3Icon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { useExpenseData } from "@/hooks/useExpenseData";
import { SpendingTrendChart } from "@/components/SpendingTrendChart";
import { SpendingChart } from "@/components/SpendingChart";
import { CategoryTrendChart } from "@/components/CategoryTrendChart";
import { MonthlyComparisonChart } from "@/components/MonthlyComparisonChart";
import { WeeklyComparisonChart } from "@/components/WeeklyComparisonChart";
import { BottomNavigation } from "@/components/BottomNavigation";

const formatMoney = (value: number) =>
  `₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const Reports = () => {
  const navigate = useNavigate();
  const { transactions, accounts, loading } = useExpenseData();
  const [period, setPeriod] = useState<"30d" | "monthly" | "weekly">("30d");

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const netSavings = totalIncome - totalExpenses;

  const spendingCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.abs(t.amount));
      });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading financial reports...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-background to-background pb-44 md:pb-12 isolate">
        <div className="container mx-auto px-4 py-4 md:py-6 space-y-6 relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-1.5">
                  <BarChart3Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                  Financial Reports & Analytics
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Detailed trends, category breakdowns, and income vs expense charts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/transactions")}
                className="h-8 text-xs rounded-full border-border text-foreground hover:bg-muted"
              >
                <FileSpreadsheetIcon className="w-3.5 h-3.5 mr-1.5" />
                View Transactions
              </Button>
            </div>
          </div>

          {/* Section 1: Income vs Expense Trend with Period Tabs */}
          <section id="income-vs-expense" className="space-y-3">
            <Card className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 pt-4 border-b border-border/40">
                <CardTitle className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                  Income vs Expenses Trend
                </CardTitle>

                {/* Time Period Tabs inside Chart Header */}
                <Tabs value={period} onValueChange={(val) => setPeriod(val as any)} className="w-full sm:w-auto">
                  <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                    <TabsTrigger value="30d" className="text-xs">30 Days</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                    <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="pt-4">
                {period === "monthly" ? (
                  <MonthlyComparisonChart transactions={transactions} hideCardHeader={true} />
                ) : period === "weekly" ? (
                  <WeeklyComparisonChart transactions={transactions} hideCardHeader={true} />
                ) : (
                  <SpendingTrendChart transactions={transactions} hideCardHeader={true} />
                )}
              </CardContent>
            </Card>
          </section>

          {/* Section 2: Top Spending Categories & Breakdown */}
          <section id="categories" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-cyan-500" />
                  Category Spending Share
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[280px]">
                <SpendingChart transactions={transactions} hideCardHeader={true} />
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base md:text-lg font-semibold">
                  Category Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {spendingCategories.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No expenses recorded yet.</p>
                ) : (
                  spendingCategories.map((item, idx) => {
                    const total = spendingCategories.reduce((s, e) => s + e.amount, 0) || 1;
                    const pct = Math.round((item.amount / total) * 100);
                    return (
                      <div key={item.category} className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="font-medium text-foreground dark:text-white">{item.category}</span>
                          <span className="text-muted-foreground dark:text-slate-300 font-semibold">{pct}% ({formatMoney(item.amount)})</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${idx % 3 === 0 ? "bg-emerald-500" : idx % 3 === 1 ? "bg-cyan-500" : "bg-violet-500"}`}
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </section>

          {/* Section 3: Monthly & Category Trends */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <MonthlyComparisonChart transactions={transactions} />
            <CategoryTrendChart transactions={transactions} />
          </section>

          {/* Section 4: Summary Overview Cards Relocated to the Bottom */}
          <section className="space-y-3 pt-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Financial Overview Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Balance</span>
                    <WalletIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="mt-2 text-base md:text-lg font-bold text-foreground">
                    {formatMoney(totalBalance)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Income</span>
                    <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(totalIncome)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Expense</span>
                    <TrendingDownIcon className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 text-base md:text-lg font-bold text-rose-600 dark:text-rose-400">
                    -{formatMoney(totalExpenses)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Net Savings</span>
                    <PieChartIcon className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className={`mt-2 text-base md:text-lg font-bold ${netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {netSavings >= 0 ? "+" : "-"}{formatMoney(netSavings)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
};

export default Reports;
