import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { format, startOfDay, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface SpendingTrendChartProps {
  transactions: Transaction[];
  title?: string;
  hideCardHeader?: boolean;
  defaultTimeframe?: "month" | "30days";
}

const formatMoney = (value: number) =>
  `₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export const SpendingTrendChart = ({
  transactions,
  title = "Income vs Expenses Trend",
  hideCardHeader = false,
  defaultTimeframe = "30days",
}: SpendingTrendChartProps) => {
  const [timeframe, setTimeframe] = useState<"month" | "30days">(defaultTimeframe);

  const { chartData, periodIncome, periodExpenses } = useMemo(() => {
    let days: { date: string; fullDate: Date; expenses: number; income: number }[] = [];

    if (timeframe === "month") {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const intervalDays = eachDayOfInterval({ start, end });

      days = intervalDays.map((d) => ({
        date: format(d, "MMM dd"),
        fullDate: startOfDay(d),
        expenses: 0,
        income: 0,
      }));
    } else {
      days = Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 29 - i));
        return {
          date: format(date, "MMM dd"),
          fullDate: date,
          expenses: 0,
          income: 0,
        };
      });
    }

    let totalInc = 0;
    let totalExp = 0;

    transactions.forEach((transaction) => {
      const transactionDate = startOfDay(new Date(transaction.date));
      const dayData = days.find(
        (day) => day.fullDate.getTime() === transactionDate.getTime()
      );

      if (dayData) {
        if (transaction.type === "expense") {
          dayData.expenses += transaction.amount;
          totalExp += transaction.amount;
        } else if (transaction.type === "income") {
          dayData.income += transaction.amount;
          totalInc += transaction.amount;
        }
      }
    });

    const data = days.map(({ date, expenses, income }) => ({
      date,
      Expenses: expenses,
      Income: income,
    }));

    return {
      chartData: data,
      periodIncome: totalInc,
      periodExpenses: totalExp,
    };
  }, [transactions, timeframe]);

  const formatYAxis = (value: number) => {
    if (value >= 100000) return `₹${(value / 1000).toFixed(0)}k`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs space-y-1 text-card-foreground dark:bg-slate-900 dark:border-white/10">
          <p className="font-semibold text-foreground border-b border-border pb-1 dark:text-white dark:border-white/10">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-foreground dark:text-white">
                ₹{Number(entry.value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const content = (
    <div className="w-full flex flex-col justify-between overflow-hidden pt-1">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
          {timeframe === "month" ? "Current Month Breakdown" : "30-Day Breakdown"}
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setTimeframe("month")}
            className={`rounded-md px-2.5 py-1 transition-all ${
              timeframe === "month"
                ? "bg-background text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("30days")}
            className={`rounded-md px-2.5 py-1 transition-all ${
              timeframe === "30days"
                ? "bg-background text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {chartData.every((d) => d.Expenses === 0 && d.Income === 0) ? (
        <p className="text-muted-foreground text-center py-12 text-sm">No transaction data to display for this period</p>
      ) : (
        <div className="h-[220px] sm:h-[260px] w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval={timeframe === "month" ? 4 : 4}
                dy={10}
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
                height={28}
                wrapperStyle={{ paddingTop: "12px", fontSize: "11px" }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground dark:text-slate-300 font-medium ml-1 mr-3">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="Income"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ fill: "#10B981", r: 3 }}
                activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="Expenses"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ fill: "#EF4444", r: 3 }}
                activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Period Summary Cards aligned with chart timeframe */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
          <p className="text-muted-foreground">
            {timeframe === "month" ? "Monthly Income" : "30-Day Income"}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-emerald-600 dark:text-emerald-300">
            +{formatMoney(periodIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5">
          <p className="text-muted-foreground">
            {timeframe === "month" ? "Monthly Expense" : "30-Day Expense"}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-rose-600 dark:text-rose-300">
            -{formatMoney(periodExpenses)}
          </p>
        </div>
      </div>
    </div>
  );

  if (hideCardHeader) {
    return content;
  }

  return (
    <Card className="bg-card border-border shadow-sm h-full flex flex-col text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-3">{content}</CardContent>
    </Card>
  );
};
