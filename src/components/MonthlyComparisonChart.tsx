import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";

interface MonthlyComparisonChartProps {
  transactions: Transaction[];
}

export const MonthlyComparisonChart = ({ transactions }: MonthlyComparisonChartProps) => {
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

  return (
    <Card className="bg-gradient-card shadow-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Monthly Financial Overview (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyData.every((d) => d.expenses === 0 && d.income === 0) ? (
          <p className="text-muted-foreground text-center py-8">No transaction data to display</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
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
              <Bar 
                dataKey="net" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Net (Income - Expenses)"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
