import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, SearchIcon, DownloadIcon, FileTextIcon, FileSpreadsheetIcon, BarChart3Icon } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useExpenseData, Transaction } from "@/hooks/useExpenseData";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BottomNavigation } from "@/components/BottomNavigation";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SpendingTrendChart } from "@/components/SpendingTrendChart";
import { CategoryTrendChart } from "@/components/CategoryTrendChart";
import { WeeklyComparisonChart } from "@/components/WeeklyComparisonChart";
import { MonthlyComparisonChart } from "@/components/MonthlyComparisonChart";

const formatTime12h = (time?: string) => {
  if (!time) return "Not available";
  const [hStr, m = "00"] = time.split(":");
  const hNum = Number(hStr);
  if (Number.isNaN(hNum)) return time;
  const period = hNum >= 12 ? "PM" : "AM";
  const hour12 = hNum % 12 === 0 ? 12 : hNum % 12;
  return `${hour12.toString().padStart(2, "0")}:${m.padStart(2, "0")} ${period}`;
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions, accounts, deleteTransaction, loading } = useExpenseData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<DisplayTransaction | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>([]);

  const accountLookup = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((account) => {
      map[account.id] = account.name;
    });
    return map;
  }, [accounts]);

  const getDisplayMeta = (display: DisplayTransaction) => {
    const transaction = display.transaction;
    const splitAmount = getDisplayAmount(display);
    const isSplit = isSplitDisplay(display);
    const category = (transaction.category || "").toLowerCase();
    const isTransfer = transaction.type === "transfer" || category.includes("transfer");
    const transferIsOut = isTransfer ? transaction.amount < 0 : false;
    const amountSign = isTransfer
      ? transferIsOut ? "-" : "+"
      : transaction.type === "income" ? "+" : "-";
    const amountValue = isTransfer ? Math.abs(transaction.amount) : splitAmount;
    const amountClass = isTransfer
      ? transferIsOut ? "text-destructive" : "text-success"
      : transaction.type === "income" ? "text-success" : "text-destructive";
    const typeLabel = isTransfer
      ? "Transfer"
      : isSplit
        ? "Split Payment"
      : transaction.type === "income" ? "Income" : "Expense";

    return { isTransfer, amountSign, amountValue, amountClass, typeLabel };
  };

  const handleCloseDetails = () => setSelectedTransaction(null);

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = stripMetaTags(t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayTransactions = useMemo(() => buildDisplayTransactions(filteredTransactions), [filteredTransactions]);

  useEffect(() => {
    setSelectedDisplayIds((prev) => {
      const next = prev.filter((id) =>
        displayTransactions.some((display) => display.transaction.id === id)
      );

      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }

      return next;
    });
  }, [displayTransactions]);

  const selectedDisplayTransactions = useMemo(
    () => displayTransactions.filter((display) => selectedDisplayIds.includes(display.transaction.id)),
    [displayTransactions, selectedDisplayIds]
  );

  const allVisibleSelected =
    displayTransactions.length > 0 && selectedDisplayIds.length === displayTransactions.length;

  const toggleDisplaySelection = (displayId: string, checked: boolean) => {
    setSelectedDisplayIds((prev) => {
      if (checked) {
        if (prev.includes(displayId)) return prev;
        return [...prev, displayId];
      }
      return prev.filter((id) => id !== displayId);
    });
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedDisplayIds([]);
  };

  const handleSelectAllVisible = () => {
    setSelectedDisplayIds(displayTransactions.map((display) => display.transaction.id));
  };

  const handleClearSelection = () => {
    setSelectedDisplayIds([]);
  };

  const handleBulkDelete = async () => {
    for (const display of selectedDisplayTransactions) {
      await handleDelete(display, deleteTransaction);
    }

    toast({
      title: "Transactions deleted",
      description: `${selectedDisplayTransactions.length} transaction${selectedDisplayTransactions.length !== 1 ? "s" : ""} deleted successfully.`,
    });

    setSelectedDisplayIds([]);
    setSelectionMode(false);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }
    
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredTransactions, filename);
    
    toast({
      title: "Export successful",
      description: `${filteredTransactions.length} transactions exported to CSV.`,
    });
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }
    
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    exportToPDF(filteredTransactions, filename);
    
    toast({
      title: "Export successful",
      description: `${filteredTransactions.length} transactions exported to PDF.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6 pb-8 md:pb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">Transaction History</h1>
                <p className="text-[11px] text-muted-foreground">View and filter all your transactions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                onClick={handleToggleSelectionMode}
                disabled={displayTransactions.length === 0}
                className="h-8 text-xs rounded-full"
              >
                {selectionMode ? "Cancel Selection" : "Select"}
              </Button>
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    disabled={filteredTransactions.length === 0}
                  >
                    <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Link to Dedicated Reports & Charts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
            <div className="space-y-0.5">
              <h2 className="text-xs sm:text-sm font-semibold text-foreground dark:text-white">Looking for Analytics & Charts?</h2>
              <p className="text-[11px] text-muted-foreground dark:text-slate-400">View detailed income vs expense trends and category breakdowns.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/reports")}
              className="h-8 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0 w-full sm:w-auto rounded-full"
            >
              <BarChart3Icon className="w-3.5 h-3.5 mr-1.5" />
              View Reports & Charts →
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-input border-border">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-input border-border">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {displayTransactions.length} Transaction{displayTransactions.length !== 1 ? 's' : ''}
                </CardTitle>
                {selectionMode && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={allVisibleSelected ? handleClearSelection : handleSelectAllVisible}
                      disabled={displayTransactions.length === 0}
                    >
                      {allVisibleSelected ? "Clear" : "Select All"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedDisplayIds.length} selected
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-destructive hover:bg-destructive/90"
                          disabled={selectedDisplayIds.length === 0}
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete Selected
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Transactions?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {`You are about to delete ${selectedDisplayIds.length} selected transaction${selectedDisplayIds.length !== 1 ? "s" : ""}.`}
                            <p className="mt-2 text-xs text-muted-foreground">This action cannot be undone.</p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleBulkDelete}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions found</p>
              ) : (
                displayTransactions.map((displayTx) => {
                  const transaction = displayTx.transaction;
                  const meta = getDisplayMeta(displayTx);
                  const transactionDate = new Date(transaction.date);
                  const formattedDate = transactionDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3 cursor-pointer"
                      onClick={() => {
                        if (selectionMode) {
                          toggleDisplaySelection(
                            displayTx.transaction.id,
                            !selectedDisplayIds.includes(displayTx.transaction.id)
                          );
                          return;
                        }
                        setSelectedTransaction(displayTx);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {selectionMode && (
                          <Checkbox
                            checked={selectedDisplayIds.includes(displayTx.transaction.id)}
                            onCheckedChange={(checked) =>
                              toggleDisplaySelection(displayTx.transaction.id, checked === true)
                            }
                            onClick={(event) => event.stopPropagation()}
                            aria-label="Select transaction"
                          />
                        )}
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
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{renderDescription(displayTx, accountLookup)}</span>
                            <span className="whitespace-nowrap">• {formattedDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`text-base md:text-lg font-bold whitespace-nowrap ${meta.amountClass}`}>
                          {meta.amountSign}₹{Math.abs(meta.amountValue).toLocaleString('en-IN', { 
                            minimumFractionDigits: 2 
                          })}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={(event) => event.stopPropagation()}
                              disabled={selectionMode}
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
                                    {renderDescription(displayTx, accountLookup)}
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
                                onClick={() => handleDelete(displayTx, deleteTransaction)}
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
          </Card>

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
                            <p className="text-foreground font-medium">{accountLookup[getFromAccountId(selectedTransaction)] || "Unknown account"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">To</p>
                            <p className="text-foreground font-medium">{accountLookup[getToAccountId(selectedTransaction)] || "Unknown account"}</p>
                          </div>
                        </>
                      ) : isSplitDisplay(selectedTransaction) ? (
                        <div className="sm:col-span-2">
                          <p className="text-muted-foreground">Accounts</p>
                          <p className="text-foreground font-medium">{getDisplayAccountNames(selectedTransaction, accountLookup)}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-muted-foreground">Account</p>
                          <p className="text-foreground font-medium">{accountLookup[selectedTransaction.transaction.account_id] || "Unknown account"}</p>
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
                        <p className="text-foreground font-medium break-words">{renderDescription(selectedTransaction, accountLookup)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        </div>

        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
};

export default TransactionHistory;

interface DisplayTransaction {
  transaction: Transaction;
  counterpart?: Transaction;
  splitParts?: Transaction[];
}

function buildDisplayTransactions(transactions: Transaction[]): DisplayTransaction[] {
  const processed = new Set<string>();
  const result: DisplayTransaction[] = [];
  const splitGroups = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    const splitId = getSplitId(tx.description);
    if (!splitId) return;
    const existing = splitGroups.get(splitId) || [];
    existing.push(tx);
    splitGroups.set(splitId, existing);
  });

  transactions.forEach((tx) => {
    if (processed.has(tx.id)) return;

    const splitId = getSplitId(tx.description);
    if (splitId) {
      const splitParts = (splitGroups.get(splitId) || []).filter((part) => part.id !== tx.id);
      splitParts.forEach((part) => processed.add(part.id));
      result.push({ transaction: tx, splitParts });
      processed.add(tx.id);
      return;
    }

    const category = (tx.category || "").toLowerCase();
    if (tx.type === "transfer" || category.includes("transfer")) {
      const counterpart = transactions.find((other) =>
        other.id !== tx.id &&
        !processed.has(other.id) &&
        (other.type === "transfer" || (other.category || "").toLowerCase().includes("transfer")) &&
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
}

function getFromAccountId(display: DisplayTransaction): string {
  const primaryOut = display.transaction.amount < 0;
  if (display.counterpart) {
    return primaryOut ? display.transaction.account_id : display.counterpart.account_id;
  }
  return display.transaction.account_id;
}

function getToAccountId(display: DisplayTransaction): string {
  const primaryOut = display.transaction.amount < 0;
  if (display.counterpart) {
    return primaryOut ? display.counterpart.account_id : display.transaction.account_id;
  }
  return display.transaction.account_id;
}

function renderDescription(
  display: DisplayTransaction,
  accountLookup: Record<string, string>
): string {
  const { transaction } = display;
  const category = (transaction.category || "").toLowerCase();
  if (transaction.type === "transfer" || category.includes("transfer")) {
    const from = accountLookup[getFromAccountId(display)] || "Unknown account";
    const to = accountLookup[getToAccountId(display)] || "Unknown account";
    return `Transfer: ${from} → ${to}`;
  }
  return stripMetaTags(transaction.description || "");
}

async function handleDelete(
  display: DisplayTransaction,
  deleteTransactionFn: (id: string) => Promise<void> | void
) {
  await deleteTransactionFn(display.transaction.id);
  if (display.splitParts) {
    for (const splitPart of display.splitParts) {
      await deleteTransactionFn(splitPart.id);
    }
  }
}

function getSplitId(description: string): string | null {
  const match = (description || "").match(/\[split:([a-z0-9-]+)\]\s*$/i);
  return match ? match[1] : null;
}

function stripMetaTags(description: string): string {
  return description.replace(/\s*\[split:[a-z0-9-]+\]\s*$/i, "").trim();
}

function isSplitDisplay(display: DisplayTransaction): boolean {
  return !!display.splitParts && display.splitParts.length > 0;
}

function getDisplayAmount(display: DisplayTransaction): number {
  if (!isSplitDisplay(display)) {
    return display.transaction.amount;
  }
  return [display.transaction, ...(display.splitParts || [])].reduce((sum, tx) => sum + tx.amount, 0);
}

function getDisplayAccountNames(
  display: DisplayTransaction,
  accountLookup: Record<string, string>
): string {
  const rows = [display.transaction, ...(display.splitParts || [])];
  const names = Array.from(
    new Set(rows.map((tx) => accountLookup[tx.account_id] || "Unknown account"))
  );
  return names.join(" + ");
}
