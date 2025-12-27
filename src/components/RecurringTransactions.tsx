import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Repeat,
  Calendar,
  Pause,
  Play,
} from "lucide-react";
import { useRecurringTransactions, RecurringTransaction } from "@/hooks/useRecurringTransactions";
import { useCategories } from "@/hooks/useCategories";
import { Account } from "@/hooks/useExpenseData";

const EXPENSE_CATEGORIES = [
  "Rent",
  "EMI",
  "Subscriptions",
  "Bills & Utilities",
  "Insurance",
  "Loan Payment",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Interest",
  "Dividends",
  "Rental Income",
  "Other Income",
];

interface RecurringTransactionsProps {
  accounts: Account[];
}

export const RecurringTransactions = ({ accounts }: RecurringTransactionsProps) => {
  const {
    recurringTransactions,
    loading,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
  } = useRecurringTransactions();

  const { getCategoriesByType, addCategory, deleteCategory, categories: allCategories } = useCategories();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState({
    account_id: "",
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  const [categoryEditMode, setCategoryEditMode] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resetForm = () => {
    setFormData({
      account_id: accounts[0]?.id || "",
      type: "expense",
      amount: "",
      category: "",
      description: "",
      frequency: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
    });
  };

  const handleSubmit = async () => {
    const finalCategory = formData.category || customCategory.trim();
    if (!formData.account_id || !formData.amount || !finalCategory || !formData.description) return;

    // Persist custom category if used
    if (!formData.category && customCategory.trim()) {
      const ok = await addCategory(customCategory.trim(), formData.type);
      if (ok) {
        setFormData({ ...formData, category: customCategory.trim() });
      }
    }

    const transactionData = {
      account_id: formData.account_id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: finalCategory,
      description: formData.description,
      frequency: formData.frequency,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      next_occurrence: formData.start_date,
    };

    if (editingTransaction) {
      await updateRecurringTransaction(editingTransaction.id, transactionData);
      setEditingTransaction(null);
    } else {
      await addRecurringTransaction(transactionData);
    }

    resetForm();
    setCategoryEditMode(false);
    setCustomCategory("");
    setIsAddDialogOpen(false);
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setFormData({
      account_id: transaction.account_id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      frequency: transaction.frequency,
      start_date: transaction.start_date,
      end_date: transaction.end_date || "",
    });
    setEditingTransaction(transaction);
    setIsAddDialogOpen(true);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "yearly": return "Yearly";
      default: return freq;
    }
  };

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || "Unknown";
  };

  // Categories union: recurring defaults + user categories
  const categoryNames = useMemo(() => {
    const fromHook = getCategoriesByType(formData.type);
    const recurringDefaults = formData.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const set = new Set<string>([...recurringDefaults, ...fromHook]);
    return Array.from(set);
  }, [formData.type, getCategoriesByType]);

  const currentTypeCategories = useMemo(() => {
    return allCategories.filter(c => c.type === formData.type);
  }, [allCategories, formData.type]);

  const isCustomCategory = (name: string) => {
    const c = currentTypeCategories.find(cat => cat.name === name);
    return !!c && c.id.startsWith("custom-");
  };

  const promptDeleteCategory = (name: string, e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteCategory(name);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!pendingDeleteCategory) return;
    const c = currentTypeCategories.find(cat => cat.name === pendingDeleteCategory);
    if (!c) { setDeleteDialogOpen(false); return; }
    const ok = await deleteCategory(c.id);
    if (ok && formData.category === pendingDeleteCategory) {
      setFormData({ ...formData, category: "" });
    }
    setPendingDeleteCategory(null);
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Repeat className="h-5 w-5 text-primary" />
              Recurring Transactions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Automate rent, subscriptions, EMI, and more
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => { resetForm(); setEditingTransaction(null); }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recurring
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? "Edit Recurring Transaction" : "Add Recurring Transaction"}
                </DialogTitle>
                <DialogDescription>
                  Set up automatic transactions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "income" | "expense") =>
                      setFormData({ ...formData, type: value, category: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, account_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        setFormData({ ...formData, category: value });
                        setCustomCategory("");
                        setCategoryEditMode(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            <div className="flex items-center justify-between w-full pr-2">
                              <span>{name}</span>
                              {isCustomCategory(name) && (
                                <button
                                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                  onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                  onClick={(e) => promptDeleteCategory(name, e)}
                                  className="ml-2 p-1 hover:bg-destructive/10 rounded"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </button>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategoryEditMode(!categoryEditMode);
                        setFormData({ ...formData, category: "" });
                        setCustomCategory("");
                      }}
                      title="Add custom category"
                      className="px-3"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  {categoryEditMode && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(customCategory.trim(), formData.type).then((ok) => { if (ok) { setFormData({ ...formData, category: customCategory.trim() }); setCustomCategory(""); setCategoryEditMode(false); } }); } }}
                      />
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!customCategory.trim()) return;
                          const ok = await addCategory(customCategory.trim(), formData.type);
                          if (ok) {
                            setFormData({ ...formData, category: customCategory.trim() });
                            setCustomCategory("");
                            setCategoryEditMode(false);
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {`Are you sure you want to delete "${pendingDeleteCategory || "this category"}"?`}
                        <p className="mt-2 text-xs text-muted-foreground">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteCategoryConfirm}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Netflix Subscription"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTransaction ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {recurringTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Repeat className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recurring transactions</p>
            <p className="text-sm">Add rent, EMI, subscriptions to automate</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurringTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-3 sm:p-4 border rounded-lg bg-card/50 ${
                  !transaction.is_active ? "opacity-50" : ""
                }`}
              >
                {/* Mobile Layout */}
                <div className="flex flex-col gap-3">
                  {/* Header: Title + Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base truncate">
                        {transaction.description}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge
                          variant={transaction.type === "income" ? "default" : "secondary"}
                          className="text-xs px-1.5 py-0"
                        >
                          {transaction.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {getFrequencyLabel(transaction.frequency)}
                        </Badge>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-base sm:text-lg whitespace-nowrap ${
                        transaction.type === "income"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}₹
                      {transaction.amount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Details Row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{transaction.category}</span>
                    <span>•</span>
                    <span>{getAccountName(transaction.account_id)}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Next: {new Date(transaction.next_occurrence).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() =>
                        toggleRecurringTransaction(
                          transaction.id,
                          !transaction.is_active
                        )
                      }
                      title={transaction.is_active ? "Pause" : "Resume"}
                    >
                      {transaction.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleEdit(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => deleteRecurringTransaction(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
