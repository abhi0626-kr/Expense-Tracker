import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";

interface CategoryTrendChartProps {
  transactions: Transaction[];
}

export const CategoryTrendChart = ({ transactions }: CategoryTrendChartProps) => {
  // Get unique categories and aggregate data
  const categoryData = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8); // Top 8 categories

  return (
    <Card className="bg-gradient-card shadow-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Top Spending Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No expense data to display</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
              />
              <YAxis 
                type="category"
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, "Amount"]}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                name="Spending"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
