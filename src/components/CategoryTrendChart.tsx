import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, X, TrendingUp, TrendingDown, Wallet, Filter } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";

interface CategoryTrendChartProps {
  transactions: Transaction[];
  title?: string;
}

const formatMoney = (value: number) =>
  `₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export const CategoryTrendChart = ({ transactions, title = "Category Trend & Date Breakdown" }: CategoryTrendChartProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  const setPreset = (type: "7d" | "30d" | "month") => {
    const today = new Date();
    if (type === "7d") {
      setStartDate(format(subDays(today, 6), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (type === "30d") {
      setStartDate(format(subDays(today, 29), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (type === "month") {
      setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
    }
  };

  // Filter transactions by exact startOfDay and endOfDay
  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;

    const start = startDate ? startOfDay(parseISO(startDate)).getTime() : null;
    const end = endDate ? endOfDay(parseISO(endDate)).getTime() : null;

    return transactions.filter((t) => {
      const txTime = new Date(t.date).getTime();
      if (start && txTime < start) return false;
      if (end && txTime > end) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  // Aggregate stats for filtered range
  const periodStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryMap: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else if (t.type === "expense") {
        expenses += t.amount;
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
      }
    });

    const sortedCategories = Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return {
      income,
      expenses,
      net: income - expenses,
      count: filteredTransactions.length,
      categories: sortedCategories,
    };
  }, [filteredTransactions]);

  // Group transactions by ISO Date (YYYY-MM-DD) for reliable sorting & unique day entries
  const chartData = useMemo(() => {
    const dateMap: Record<string, { isoDate: string; displayDate: string; fullDateStr: string; income: number; expenses: number }> = {};

    filteredTransactions.forEach((transaction) => {
      const txDateObj = new Date(transaction.date);
      const isoKey = format(txDateObj, "yyyy-MM-dd");
      const displayDate = format(txDateObj, "MMM dd");
      const fullDateStr = format(txDateObj, "dd MMM yyyy");

      if (!dateMap[isoKey]) {
        dateMap[isoKey] = {
          isoDate: isoKey,
          displayDate,
          fullDateStr,
          income: 0,
          expenses: 0,
        };
      }

      if (transaction.type === "income") {
        dateMap[isoKey].income += transaction.amount;
      } else if (transaction.type === "expense") {
        dateMap[isoKey].expenses += transaction.amount;
      }
    });

    return Object.values(dateMap).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }, [filteredTransactions]);

  const formatYAxis = (value: number) => {
    if (value >= 100000) return `₹${(value / 1000).toFixed(0)}k`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const net = dataPoint.income - dataPoint.expenses;

      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-xl backdrop-blur text-xs space-y-1.5 min-w-[160px] text-card-foreground dark:bg-slate-900/95 dark:border-white/10">
          <p className="font-semibold text-foreground border-b border-border pb-1 dark:text-white dark:border-white/10">
            {dataPoint.fullDateStr || dataPoint.displayDate}
          </p>
          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
            <span>Income:</span>
            <span className="font-bold">+{formatMoney(dataPoint.income)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
            <span>Expenses:</span>
            <span className="font-bold">-{formatMoney(dataPoint.expenses)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/50 text-foreground font-semibold">
            <span>Net:</span>
            <span className={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {net >= 0 ? "+" : "-"}{formatMoney(net)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border-border shadow-sm h-full flex flex-col text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-primary" />
            {title}
          </CardTitle>
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset("7d")}
              className="h-7 px-2 text-[11px] rounded-md"
            >
              7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset("30d")}
              className="h-7 px-2 text-[11px] rounded-md"
            >
              30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset("month")}
              className="h-7 px-2 text-[11px] rounded-md"
            >
              This Month
            </Button>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDates}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Date Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/30 dark:border-white/10 dark:bg-white/5">
          <div className="space-y-1">
            <Label htmlFor="start-date" className="text-[11px] font-medium text-muted-foreground">
              Start Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-8 h-8 text-xs bg-background border-border focus:border-primary"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-date" className="text-[11px] font-medium text-muted-foreground">
              End Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-8 h-8 text-xs bg-background border-border focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Period Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Earned</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
              +{formatMoney(periodStats.income)}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Spent</span>
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-300">
              -{formatMoney(periodStats.expenses)}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl border border-primary/20 bg-primary/10">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Net Savings</span>
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className={`mt-1 text-sm font-semibold ${periodStats.net >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
              {periodStats.net >= 0 ? "+" : "-"}{formatMoney(periodStats.net)}
            </p>
          </div>
        </div>

        {/* Chart Visualization */}
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-10 text-xs">
            No transaction records found{startDate || endDate ? " for selected dates" : ""}.
          </p>
        ) : (
          <div className="h-[200px] md:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground dark:text-slate-300 font-medium ml-1 mr-3">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 3 }}
                  activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ fill: "#ef4444", r: 3 }}
                  activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Spending Categories Breakdown for Selected Period */}
        {periodStats.categories.length > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Top Expenses ({periodStats.count} transaction{periodStats.count !== 1 ? "s" : ""})
            </p>
            <div className="space-y-1.5">
              {periodStats.categories.map((cat, index) => {
                const totalExp = periodStats.expenses || 1;
                const percentage = Math.round((cat.amount / totalExp) * 100);

                return (
                  <div key={cat.name} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground">({percentage}%)</span>
                    </div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {formatMoney(cat.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
