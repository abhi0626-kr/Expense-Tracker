import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Account, TransactionInput } from "@/hooks/useExpenseData";
import { XIcon, EditIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCategories, DEFAULT_CATEGORIES } from "@/hooks/useCategories";

interface AddTransactionProps {
  accounts: Account[];
  onAddTransaction: (transaction: TransactionInput) => Promise<boolean | void> | boolean | void;
  onClose: () => void;
}

interface SplitFormItem {
  accountId: string;
  amount: string;
}

export const AddTransaction = ({ accounts, onAddTransaction, onClose }: AddTransactionProps) => {
  const { toast } = useToast();
  const { getCategoriesByType, addCategory, deleteCategory, categories: allCategories } = useCategories();
  const [formData, setFormData] = useState({
    accountId: "",
    type: "" as "income" | "expense" | "",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5)
  });
  const [editMode, setEditMode] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitAllocations, setSplitAllocations] = useState<SplitFormItem[]>([
    { accountId: "", amount: "" },
    { accountId: "", amount: "" }
  ]);

  // Get categories from the database based on transaction type
  const categoryNames = useMemo(() => {
    if (!formData.type) return [];
    return getCategoriesByType(formData.type);
  }, [formData.type, getCategoriesByType]);

  // Get full category objects to check if they're custom (for delete functionality)
  const currentTypeCategories = useMemo(() => {
    if (!formData.type) return [];
    return allCategories.filter(cat => cat.type === formData.type);
  }, [formData.type, allCategories]);

  // Check if a category is custom (not a default one)
  const isCustomCategory = (categoryName: string) => {
    if (!formData.type) return false;
    const normalized = categoryName.trim().toLowerCase();
    const isDefault = DEFAULT_CATEGORIES[formData.type].some(
      name => name.toLowerCase() === normalized
    );
    return !isDefault;
  };

  // Prompt delete category
  const promptDeleteCategory = (categoryName: string, e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteCategory(categoryName);
    setDeleteDialogOpen(true);
  };

  // Execute delete after confirmation
  const handleDeleteCategory = async () => {
    if (!pendingDeleteCategory) return;
    const category = currentTypeCategories.find(cat => cat.name === pendingDeleteCategory);
    if (!category) {
      setDeleteDialogOpen(false);
      return;
    }

    const success = await deleteCategory(category.id);
    if (success && formData.category === pendingDeleteCategory) {
      setFormData({ ...formData, category: "" });
    }

    setPendingDeleteCategory(null);
    setDeleteDialogOpen(false);
  };

  const handleAddCustomCategory = async () => {
    if (!customCategory.trim()) {
      toast({
        title: "Invalid Category",
        description: "Please enter a category name",
        variant: "destructive"
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: "Select Transaction Type",
        description: "Please select a transaction type first",
        variant: "destructive"
      });
      return;
    }

    const success = await addCategory(customCategory.trim(), formData.type);
    if (success) {
      setFormData({ ...formData, category: customCategory.trim() });
      setCustomCategory("");
      setEditMode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if category or custom category is filled
    const categoryFilled = formData.category || customCategory.trim();
    
    if (!formData.type || !formData.amount || !categoryFilled || !formData.description) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!isSplitPayment && !formData.accountId) {
      toast({
        title: "Missing Account",
        description: "Please select an account",
        variant: "destructive"
      });
      return;
    }

    const totalAmount = parseFloat(formData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid total amount",
        variant: "destructive"
      });
      return;
    }

    let splitPayload: { account_id: string; amount: number }[] | undefined = undefined;

    if (isSplitPayment) {
      if (splitAllocations.length < 2) {
        toast({
          title: "Split Payment Needs Two Accounts",
          description: "Add at least two payment sources",
          variant: "destructive"
        });
        return;
      }

      const parsed = splitAllocations.map((allocation) => ({
        account_id: allocation.accountId,
        amount: parseFloat(allocation.amount)
      }));

      const hasInvalidRow = parsed.some(item => !item.account_id || isNaN(item.amount) || item.amount <= 0);
      if (hasInvalidRow) {
        toast({
          title: "Invalid Split Rows",
          description: "Each split row needs a valid account and amount",
          variant: "destructive"
        });
        return;
      }

      const duplicateAccounts = new Set(parsed.map(item => item.account_id)).size !== parsed.length;
      if (duplicateAccounts) {
        toast({
          title: "Duplicate Accounts",
          description: "Use each account only once in split payment",
          variant: "destructive"
        });
        return;
      }

      const splitSum = parsed.reduce((sum, item) => sum + item.amount, 0);
      if (Math.abs(splitSum - totalAmount) > 0.01) {
        toast({
          title: "Split Total Mismatch",
          description: "Split amounts must equal the total amount",
          variant: "destructive"
        });
        return;
      }

      splitPayload = parsed;
    }

    // If using custom category, save it first
    let finalCategory = formData.category;
    if (customCategory.trim() && !formData.category) {
      const success = await addCategory(customCategory.trim(), formData.type);
      if (!success) return;
      finalCategory = customCategory.trim();
    }

    const saveResult = await onAddTransaction({
      account_id: isSplitPayment ? splitPayload![0].account_id : formData.accountId,
      type: formData.type,
      amount: totalAmount,
      category: finalCategory,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      split_allocations: splitPayload
    });

    if (saveResult === false) {
      return;
    }

    toast({
      title: "Success",
      description: "Transaction added successfully",
      variant: "default"
    });

    setFormData({
      accountId: "",
      type: "" as "income" | "expense" | "",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    });
    setCustomCategory("");
    setEditMode(false);
    setIsSplitPayment(false);
    setSplitAllocations([
      { accountId: "", amount: "" },
      { accountId: "", amount: "" }
    ]);
  };

  // Show each account name only once to avoid duplicates in the dropdown
  const uniqueAccounts = useMemo(() => {
    const byName = new Map<string, Account>();
    for (const a of accounts) {
      const key = (a.name || "").trim().toLowerCase();
      if (!byName.has(key)) byName.set(key, a);
    }
    return Array.from(byName.values());
  }, [accounts]);

  const updateSplitRow = (index: number, next: Partial<SplitFormItem>) => {
    setSplitAllocations((current) =>
      current.map((row, i) => (i === index ? { ...row, ...next } : row))
    );
  };

  const addSplitRow = () => {
    setSplitAllocations((current) => [...current, { accountId: "", amount: "" }]);
  };

  const removeSplitRow = (index: number) => {
    setSplitAllocations((current) => {
      if (current.length <= 2) return current;
      return current.filter((_, i) => i !== index);
    });
  };

  const splitSum = splitAllocations.reduce((sum, row) => {
    const amount = parseFloat(row.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const normalizedSplitSum = Math.round((splitSum + Number.EPSILON) * 100) / 100;
  const enteredAmount = parseFloat(formData.amount);
  const normalizedEnteredAmount = isNaN(enteredAmount)
    ? 0
    : Math.round((enteredAmount + Number.EPSILON) * 100) / 100;
  const remainingAmount = Math.round(((normalizedEnteredAmount - normalizedSplitSum) + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    if (!isSplitPayment) return;

    const nextAmount = normalizedSplitSum > 0 ? normalizedSplitSum.toFixed(2) : "";
    setFormData((prev) => (prev.amount === nextAmount ? prev : { ...prev, amount: nextAmount }));
  }, [isSplitPayment, normalizedSplitSum]);

  const canSubmit =
    !!formData.type &&
    !!formData.amount &&
    (!!formData.category || !!customCategory) &&
    !!formData.description &&
    (isSplitPayment || !!formData.accountId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md bg-card shadow-financial max-h-[92dvh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">
            Add Transaction
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto">
          <form id="add-transaction-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select 
                value={formData.accountId} 
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                disabled={isSplitPayment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="split-payment">Split Payment</Label>
                <Button
                  id="split-payment"
                  type="button"
                  variant={isSplitPayment ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSplitPayment((prev) => !prev)}
                >
                  {isSplitPayment ? "Enabled" : "Enable"}
                </Button>
              </div>
              {isSplitPayment && (
                <div className="space-y-2">
                  {splitAllocations.map((row, index) => (
                    <div key={index} className="grid grid-cols-[1fr_110px_auto] gap-2 items-center">
                      <Select
                        value={row.accountId}
                        onValueChange={(value) => updateSplitRow(index, { accountId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.amount}
                        onChange={(e) => updateSplitRow(index, { amount: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSplitRow(index)}
                        disabled={splitAllocations.length <= 2}
                        title="Remove row"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addSplitRow}>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Source
                    </Button>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Split Total: ₹{normalizedSplitSum.toFixed(2)}</p>
                      <p className={remainingAmount === 0 ? "text-success" : "text-warning"}>
                        Remaining: ₹{remainingAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: "income" | "expense") => 
                  setFormData({ ...formData, type: value, category: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={isSplitPayment}
              />
              {isSplitPayment && (
                <p className="text-xs text-muted-foreground">Amount is auto-filled from split rows.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, category: value });
                    setCustomCategory("");
                    setEditMode(false);
                  }}
                  disabled={!formData.type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryNames.map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        <div className="flex items-center justify-between w-full pr-2">
                          <span>{categoryName}</span>
                          {isCustomCategory(categoryName) && (
                            <button
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onPointerUp={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => promptDeleteCategory(categoryName, e)}
                              className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors"
                              title="Delete category"
                            >
                              <Trash2Icon className="w-3 h-3 text-destructive" />
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
                    setEditMode(!editMode);
                    setFormData({ ...formData, category: "" });
                    setCustomCategory("");
                  }}
                  title="Add custom category"
                  className="px-3"
                  disabled={!formData.type}
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
              </div>
              {editMode && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter custom category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAddCustomCategory}
                    title="Save category"
                    className="px-3 bg-success hover:bg-success/90"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={handleDeleteCategory}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </form>
        </CardContent>
        <div className="sticky bottom-0 bg-card border-t border-border p-4">
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 border-muted-foreground text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-transaction-form"
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground shadow-financial"
              disabled={!canSubmit}
            >
              Add Transaction
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};