import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";

interface SpendingChartProps {
  transactions: Transaction[];
}

export const SpendingChart = ({ transactions }: SpendingChartProps) => {
  // Group income by category
  const incomeByCategory = transactions
    .filter(t => t.type === "income")
    .reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomeData = Object.entries(incomeByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Group expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  const EXPENSE_COLORS = [
    '#ff3333ff', // red
    '#ff730eff', // orange
    '#F59E0B', // yellow
    '#dfdb00ff', // darker red
    '#ea0c7bff', // darker orange
    '#d90688ff', // darker yellow
  ];

  const INCOME_COLORS = [
    '#00ffaaff', // green
    '#00ffe1ff', // teal
    '#01d9ffff', // cyan
    '#00eea3ff', // darker green
    '#0D9488', // darker teal
    '#06a9d1ff', // darker cyan
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-foreground font-medium">
            ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const hasData = incomeData.length > 0 || expenseData.length > 0;

  return (
    <Card className="bg-gradient-card shadow-card-shadow h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Income & Expenses by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {!hasData ? (
          <p className="text-muted-foreground text-center py-8">No transactions to display</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Income Chart */}
            {incomeData.length > 0 && (
              <div className="space-y-2 h-full">
                <h3 className="text-sm font-medium text-success text-center">Income</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incomeData.map((entry, index) => (
                        <Cell 
                          key={`income-${index}`} 
                          fill={INCOME_COLORS[index % INCOME_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Expense Chart */}
            {expenseData.length > 0 && (
              <div className="space-y-2 h-full">
                <h3 className="text-sm font-medium text-destructive text-center">Expenses</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell 
                          key={`expense-${index}`} 
                          fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};