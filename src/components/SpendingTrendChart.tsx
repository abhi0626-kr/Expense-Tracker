import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { format, startOfDay, subDays } from "date-fns";

interface SpendingTrendChartProps {
  transactions: Transaction[];
}

export const SpendingTrendChart = ({ transactions }: SpendingTrendChartProps) => {
  // Generate last 30 days data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 29 - i));
    return {
      date: format(date, "MMM dd"),
      fullDate: date,
      expenses: 0,
      income: 0,
    };
  });

  // Aggregate transactions by day
  transactions.forEach((transaction) => {
    const transactionDate = startOfDay(new Date(transaction.date));
    const dayData = last30Days.find(
      (day) => day.fullDate.getTime() === transactionDate.getTime()
    );
    
    if (dayData) {
      if (transaction.type === "expense") {
        dayData.expenses += transaction.amount;
      } else if (transaction.type === "income") {
        dayData.income += transaction.amount;
      }
    }
  });

  const chartData = last30Days.map(({ date, expenses, income }) => ({
    date,
    Expenses: expenses,
    Income: income,
  }));

  return (
    <Card className="bg-gradient-card shadow-card-shadow h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Income vs Expenses Trend (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {chartData.every((d) => d.Expenses === 0 && d.Income === 0) ? (
          <p className="text-muted-foreground text-center py-8">No transaction data to display</p>
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
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
                <Legend 
                  wrapperStyle={{ color: "hsl(var(--foreground))" }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="Income"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--success))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Expenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--destructive))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
