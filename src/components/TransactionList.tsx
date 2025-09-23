import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "./Dashboard";
import { CategoryBadge } from "./CategoryBadge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <Card className="bg-gradient-card shadow-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          transactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === "income" 
                    ? "bg-success/20 text-success" 
                    : "bg-destructive/20 text-destructive"
                }`}>
                  {transaction.type === "income" ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{transaction.description}</p>
                  <div className="flex items-center space-x-2">
                    <CategoryBadge category={transaction.category} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`text-lg font-bold ${
                transaction.type === "income" ? "text-success" : "text-destructive"
              }`}>
                {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString('en-US', { 
                  minimumFractionDigits: 2 
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};