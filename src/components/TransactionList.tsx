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
import { Account, Transaction } from "@/hooks/useExpenseData";
import { CategoryBadge } from "./CategoryBadge";
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, ArrowRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransactionListProps {
  transactions: Transaction[];
  accounts?: Account[];
  onDeleteTransaction: (transactionId: string) => void;
}

const formatTime12h = (time?: string) => {
  if (!time) return "Not available";
  const [hStr, m = "00"] = time.split(":");
  const hNum = Number(hStr);
  if (Number.isNaN(hNum)) return time;
  const period = hNum >= 12 ? "PM" : "AM";
  const hour12 = hNum % 12 === 0 ? 12 : hNum % 12;
  return `${hour12.toString().padStart(2, "0")}:${m.padStart(2, "0")} ${period}`;
};

export const TransactionList = ({ transactions, accounts, onDeleteTransaction }: TransactionListProps) => {
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState<DisplayTransaction | null>(null);

  const recentTransactions = useMemo(() => buildDisplayTransactions(transactions).slice(0, 5), [transactions]);

  const accountLookup = useMemo(() => {
    const map: Record<string, Account> = {};
    accounts?.forEach((account) => {
      map[account.id] = account;
    });
    return map;
  }, [accounts]);

  const getDisplayMeta = (display: DisplayTransaction) => {
    const transaction = display.transaction;
    const isTransfer = transaction.type === "transfer" || transaction.category.toLowerCase().includes("transfer");
    const transferIsOut = isTransfer ? transaction.amount < 0 : false;
    const amountSign = isTransfer
      ? transferIsOut ? "-" : "+"
      : transaction.type === "income" ? "+" : "-";
    const amountValue = isTransfer ? Math.abs(transaction.amount) : transaction.amount;
    const amountClass = isTransfer
      ? transferIsOut ? "text-destructive" : "text-success"
      : transaction.type === "income" ? "text-success" : "text-destructive";
    const typeLabel = isTransfer
      ? "Transfer"
      : transaction.type === "income" ? "Income" : "Expense";

    return { isTransfer, transferIsOut, amountSign, amountValue, amountClass, typeLabel };
  };

  const getAccountName = (accountId: string) => accountLookup[accountId]?.name || "Unknown account";

  const handleCloseDetails = () => setSelectedTransaction(null);

  const handleDelete = async (display: DisplayTransaction) => {
    await onDeleteTransaction(display.transaction.id);
    if (display.counterpart) {
      await onDeleteTransaction(display.counterpart.id);
    }
  };

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
          recentTransactions.map((displayTx) => {
            const transaction = displayTx.transaction;
            const meta = getDisplayMeta(displayTx);
            const transactionDate = new Date(transaction.date);
            const formattedDate = transactionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

            return (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3 cursor-pointer"
                onClick={() => setSelectedTransaction(displayTx)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    meta.amountSign === "+" 
                      ? "bg-success/20 text-success" 
                      : "bg-destructive/20 text-destructive"
                  }`}>
                    {meta.amountSign === "+" ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                        {meta.isTransfer ? meta.typeLabel : transaction.category}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {renderDescription(displayTx, getAccountName)}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`text-sm md:text-lg font-bold whitespace-nowrap ${meta.amountClass}`}>
                    {meta.amountSign}₹{Math.abs(meta.amountValue).toLocaleString('en-IN', { 
                      minimumFractionDigits: 2 
                    })}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex"
                        onClick={(event) => event.stopPropagation()}
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
                            <p className={`text-sm font-bold mt-1 ${meta.amountClass}`}>
                              {meta.amountSign}₹{Math.abs(meta.amountValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                          onClick={() => handleDelete(displayTx)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && handleCloseDetails()}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Full breakdown of this transaction</DialogDescription>
          </DialogHeader>

          {selectedTransaction && (() => {
            const meta = getDisplayMeta(selectedTransaction);
            const transactionDate = new Date(selectedTransaction.transaction.date);
            const hasValidDate = !isNaN(transactionDate.getTime());
            const formattedDate = hasValidDate
              ? transactionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : "Not available";
            const formattedTime = formatTime12h(selectedTransaction.transaction.time);

            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className={`text-xl font-bold ${meta.amountClass}`}>
                      {meta.amountSign}₹{Math.abs(meta.amountValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <CategoryBadge category={meta.isTransfer ? meta.typeLabel : selectedTransaction.transaction.category} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="text-foreground font-medium">{meta.typeLabel}</p>
                  </div>
                  {meta.isTransfer ? (
                    <>
                      <div>
                        <p className="text-muted-foreground">From</p>
                        <p className="text-foreground font-medium">{getAccountName(getFromAccountId(selectedTransaction))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">To</p>
                        <p className="text-foreground font-medium">{getAccountName(getToAccountId(selectedTransaction))}</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-muted-foreground">Account</p>
                      <p className="text-foreground font-medium">{getAccountName(selectedTransaction.transaction.account_id)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="text-foreground font-medium">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="text-foreground font-medium">{formattedTime}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Description</p>
                    <p className="text-foreground font-medium break-words">{renderDescription(selectedTransaction, getAccountName)}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

interface DisplayTransaction {
  transaction: Transaction;
  counterpart?: Transaction;
}

const buildDisplayTransactions = (transactions: Transaction[]): DisplayTransaction[] => {
  const processed = new Set<string>();
  const result: DisplayTransaction[] = [];

  transactions.forEach((tx) => {
    if (processed.has(tx.id)) return;

    if (tx.type === "transfer" || tx.category.toLowerCase().includes("transfer")) {
      const counterpart = transactions.find((other) =>
        other.id !== tx.id &&
        !processed.has(other.id) &&
        (other.type === "transfer" || other.category.toLowerCase().includes("transfer")) &&
        Math.abs(other.amount) === Math.abs(tx.amount) &&
        new Date(other.date).toDateString() === new Date(tx.date).toDateString()
      );

      if (counterpart) {
        processed.add(counterpart.id);
      }

      result.push({ transaction: tx, counterpart });
      processed.add(tx.id);
      return;
    }

    result.push({ transaction: tx });
    processed.add(tx.id);
  });

  return result;
};

const getFromAccountId = (display: DisplayTransaction): string => {
  const primaryOut = display.transaction.amount < 0;
  if (display.counterpart) {
    return primaryOut ? display.transaction.account_id : display.counterpart.account_id;
  }
  return display.transaction.account_id;
};

const getToAccountId = (display: DisplayTransaction): string => {
  const primaryOut = display.transaction.amount < 0;
  if (display.counterpart) {
    return primaryOut ? display.counterpart.account_id : display.transaction.account_id;
  }
  return display.transaction.account_id;
};

const renderDescription = (
  display: DisplayTransaction,
  getAccountName: (id: string) => string
): string => {
  const { transaction, counterpart } = display;
  if (transaction.type === "transfer" || transaction.category.toLowerCase().includes("transfer")) {
    const from = getAccountName(getFromAccountId(display));
    const to = getAccountName(getToAccountId(display));
    return `Transfer: ${from} → ${to}`;
  }
  return transaction.description.replace(/\s*\([^)]*\)\s*$/, "");
};
