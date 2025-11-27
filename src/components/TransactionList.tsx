import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/hooks/useExpenseData";
import { CategoryBadge } from "./CategoryBadge";
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, ArrowRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (transactionId: string) => void;
}

export const TransactionList = ({ transactions, onDeleteTransaction }: TransactionListProps) => {
  const navigate = useNavigate();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card className="bg-gradient-card shadow-card-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Transactions
        </CardTitle>
        {transactions.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/transactions")}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            View All
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          recentTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`p-2 rounded-full flex-shrink-0 ${
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
                
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{transaction.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={transaction.category} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`text-sm md:text-lg font-bold whitespace-nowrap ${
                  transaction.type === "income" ? "text-success" : "text-destructive"
                }`}>
                  {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString('en-IN', { 
                    minimumFractionDigits: 2 
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTransaction(transaction.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};