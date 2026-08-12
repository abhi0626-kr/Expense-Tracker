import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Transaction } from "@/hooks/useExpenseData";

interface SpendingChartProps {
  transactions: Transaction[];
  title?: string;
  hideCardHeader?: boolean;
}

const EXPENSE_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#64748B", // Slate/Others
];

const INCOME_COLORS = [
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#64748B", // Slate/Others
];

const processChartData = (dataMap: Record<string, number>) => {
  const sorted = Object.entries(dataMap)
    .map(([name, value]) => ({ name, value: Math.abs(value) }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (sorted.length <= 5) return sorted;

  const top4 = sorted.slice(0, 4);
  const otherValue = sorted.slice(4).reduce((sum, item) => sum + item.value, 0);

  if (otherValue > 0) {
    top4.push({ name: "Others", value: otherValue });
  }

  return top4;
};

export const SpendingChart = ({ transactions, title = "Income & Expenses by Category", hideCardHeader = false }: SpendingChartProps) => {
  // Group income by category
  const incomeByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Group expenses by category
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomeData = processChartData(incomeByCategory);
  const expenseData = processChartData(expensesByCategory);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-xl backdrop-blur text-xs text-card-foreground dark:bg-slate-900/95 dark:border-white/10">
          <p className="font-semibold text-foreground dark:text-white">{payload[0].name}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            ₹{payload[0].value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const hasData = incomeData.length > 0 || expenseData.length > 0;

  const content = (
    <div className="w-full h-full flex flex-col justify-between">
      {!hasData ? (
        <p className="text-muted-foreground text-center py-12 text-sm">No transaction categories to display</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
          {/* Income Chart */}
          {incomeData.length > 0 && (
            <div className="flex flex-col items-center justify-between p-2 rounded-2xl border border-border/60 bg-muted/20 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Income Share</span>
              <div className="h-36 sm:h-44 w-full my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={54}
                      paddingAngle={4}
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
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Clean Legend */}
              <div className="w-full flex flex-wrap justify-center gap-1.5 pt-1 text-[10px]">
                {incomeData.map((entry, index) => (
                  <span
                    key={entry.name}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/60 border border-border text-foreground dark:bg-slate-900/80 dark:border-white/10 dark:text-slate-300 max-w-[120px] truncate"
                    title={`${entry.name}: ₹${entry.value.toLocaleString("en-IN")}`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                    />
                    <span className="truncate">{entry.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expense Chart */}
          {expenseData.length > 0 && (
            <div className="flex flex-col items-center justify-between p-2 rounded-2xl border border-border/60 bg-muted/20 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Expense Share</span>
              <div className="h-36 sm:h-44 w-full my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={54}
                      paddingAngle={4}
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
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Clean Legend */}
              <div className="w-full flex flex-wrap justify-center gap-1.5 pt-1 text-[10px]">
                {expenseData.map((entry, index) => (
                  <span
                    key={entry.name}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/60 border border-border text-foreground dark:bg-slate-900/80 dark:border-white/10 dark:text-slate-300 max-w-[120px] truncate"
                    title={`${entry.name}: ₹${entry.value.toLocaleString("en-IN")}`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                    />
                    <span className="truncate">{entry.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
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
        <CardTitle className="text-base font-semibold text-foreground dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-3">{content}</CardContent>
    </Card>
  );
};