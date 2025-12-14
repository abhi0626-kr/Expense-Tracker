import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Transaction } from "@/hooks/useExpenseData";
import { CategoryBadge } from "./CategoryBadge";
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, ArrowRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (transactionId: string) => void;
}

export const TransactionList = ({ transactions, onDeleteTransaction }: TransactionListProps) => {
  const navigate = useNavigate();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
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
              {(() => {
                const isTransfer = transaction.category.toLowerCase().includes("transfer");
                const transferIsOut = isTransfer ? transaction.amount < 0 : false;
                const amountSign = isTransfer
                  ? (transferIsOut ? "-" : "+")
                  : (transaction.type === "income" ? "+" : "-");
                const amountValue = isTransfer ? Math.abs(transaction.amount) : transaction.amount;
                const amountClass = isTransfer
                  ? (transferIsOut ? "text-destructive" : "text-success")
                  : (transaction.type === "income" ? "text-success" : "text-destructive");

                return (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        amountSign === "+" 
                          ? "bg-success/20 text-success" 
                          : "bg-destructive/20 text-destructive"
                      }`}>
                        {amountSign === "+" ? (
                          <ArrowUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {transaction.description.replace(/\s*\([^)]*\)\s*$/, "")}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge
                            category={isTransfer
                              ? (transferIsOut ? "Transfer Out" : "Transfer In")
                              : transaction.category}
                          />
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
                      <div className={`text-sm md:text-lg font-bold whitespace-nowrap ${amountClass}`}>
                        {amountSign}₹{Math.abs(amountValue).toLocaleString('en-IN', { 
                          minimumFractionDigits: 2 
                        })}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransactionId(transaction.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction?
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <p className="text-sm font-medium text-foreground">
                                  {transaction.description}
                                </p>
                                <p className={`text-sm font-bold mt-1 ${amountClass}`}>
                                  {amountSign}₹{Math.abs(amountValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">
                                This action cannot be undone.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => onDeleteTransaction(transaction.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
