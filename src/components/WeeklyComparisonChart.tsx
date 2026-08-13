import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";

interface WeeklyComparisonChartProps {
  transactions: Transaction[];
  title?: string;
  hideCardHeader?: boolean;
}

export const WeeklyComparisonChart = ({
  transactions,
  title = "Weekly Spending Comparison (Last 8 Weeks)",
  hideCardHeader = false,
}: WeeklyComparisonChartProps) => {
  // Generate last 8 weeks data
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 7 - i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const weekTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
    });

    const expenses = weekTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = weekTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      week: format(weekStart, "MMM dd"),
      expenses,
      income,
    };
  });

  const content = (
    <div className="w-full flex flex-col justify-between overflow-hidden">
      {weeklyData.every((d) => d.expenses === 0 && d.income === 0) ? (
        <p className="text-muted-foreground text-center py-12 text-sm">No transaction data to display</p>
      ) : (
        <div className="h-[220px] sm:h-[280px] w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))", fontSize: "11px", paddingTop: "8px" }} />
              <Bar 
                dataKey="income" 
                fill="#10b981"
                radius={[3, 3, 0, 0]}
                name="Income"
                isAnimationActive={false}
              />
              <Bar 
                dataKey="expenses" 
                fill="#ef4444"
                radius={[3, 3, 0, 0]}
                name="Expenses"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  if (hideCardHeader) {
    return content;
  }

  return (
    <Card className="bg-card border-border shadow-sm h-full flex flex-col text-card-foreground dark:bg-slate-950/80 dark:border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg font-semibold text-foreground dark:text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-3">{content}</CardContent>
    </Card>
  );
};
