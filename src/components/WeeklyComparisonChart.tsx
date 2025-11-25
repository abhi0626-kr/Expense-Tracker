import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";

interface WeeklyComparisonChartProps {
  transactions: Transaction[];
}

export const WeeklyComparisonChart = ({ transactions }: WeeklyComparisonChartProps) => {
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

  return (
    <Card className="bg-gradient-card shadow-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Weekly Spending Comparison (Last 8 Weeks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weeklyData.every((d) => d.expenses === 0 && d.income === 0) ? (
          <p className="text-muted-foreground text-center py-8">No transaction data to display</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
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
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
              <Bar 
                dataKey="income" 
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
                name="Income"
              />
              <Bar 
                dataKey="expenses" 
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
                name="Expenses"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
