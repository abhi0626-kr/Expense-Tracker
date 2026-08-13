import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";

interface MonthlyComparisonChartProps {
  transactions: Transaction[];
  title?: string;
  hideCardHeader?: boolean;
}

export const MonthlyComparisonChart = ({
  transactions,
  title = "Monthly Financial Overview (Last 6 Months)",
  hideCardHeader = false,
}: MonthlyComparisonChartProps) => {
  // Generate last 6 months data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
    const monthEnd = endOfMonth(monthStart);
    
    const monthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
    });

    const expenses = monthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = monthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const net = income - expenses;

    return {
      month: format(monthStart, "MMM yyyy"),
      expenses,
      income,
      net,
    };
  });

  const content = (
    <div className="w-full flex flex-col justify-between overflow-hidden">
      {monthlyData.every((d) => d.expenses === 0 && d.income === 0) ? (
        <p className="text-muted-foreground text-center py-12 text-sm">No transaction data to display</p>
      ) : (
        <div className="h-[220px] sm:h-[280px] w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="month" 
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
              />
              <Bar 
                dataKey="expenses" 
                fill="#ef4444"
                radius={[3, 3, 0, 0]}
                name="Expenses"
              />
              <Bar 
                dataKey="net" 
                fill="#8b5cf6"
                radius={[3, 3, 0, 0]}
                name="Net Savings"
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
