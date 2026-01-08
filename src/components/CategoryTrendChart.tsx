import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { useState, useMemo } from "react";

interface CategoryTrendChartProps {
  transactions: Transaction[];
}

export const CategoryTrendChart = ({ transactions }: CategoryTrendChartProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && txDate < start) return false;
      if (end && txDate > end) return false;
      
      return true;
    });
  }, [transactions, startDate, endDate]);

  // Group transactions by date
  const chartData = useMemo(() => {
    const dateMap: Record<string, { date: string; income: number; expenses: number }> = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short' 
      });
      
      if (!dateMap[date]) {
        dateMap[date] = { date, income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        dateMap[date].income += transaction.amount;
      } else if (transaction.type === "expense") {
        dateMap[date].expenses += transaction.amount;
      }
    });

    return Object.values(dateMap).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredTransactions]);

  return (
    <Card className="bg-gradient-card shadow-card-shadow h-full flex flex-col">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Top Spending Categories
          </CardTitle>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDates}
              className="h-8 px-2 text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="start-date" className="text-xs font-medium text-muted-foreground">
              Start Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-border/50 focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="end-date" className="text-xs font-medium text-muted-foreground">
              End Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-border/50 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No transaction data to display{startDate || endDate ? " for selected date range" : ""}
          </p>
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
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
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
                <Line 
                  type="monotone"
                  dataKey="income" 
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Income"
                />
                <Line 
                  type="monotone"
                  dataKey="expenses" 
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
