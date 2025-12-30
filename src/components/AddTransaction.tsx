import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Account, Transaction } from "@/hooks/useExpenseData";
import { XIcon, EditIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";

interface AddTransactionProps {
  accounts: Account[];
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  onClose: () => void;
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
    const category = currentTypeCategories.find(cat => cat.name === categoryName);
    return category ? category.id.startsWith('custom-') : false;
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
    
    if (!formData.accountId || !formData.type || !formData.amount || !categoryFilled || !formData.description) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // If using custom category, save it first
    let finalCategory = formData.category;
    if (customCategory.trim() && !formData.category) {
      const success = await addCategory(customCategory.trim(), formData.type);
      if (!success) return;
      finalCategory = customCategory.trim();
    }

    onAddTransaction({
      account_id: formData.accountId,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: finalCategory,
      description: formData.description,
      date: formData.date,
      time: formData.time
    });

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-card shadow-financial">
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
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select 
                value={formData.accountId} 
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
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
              />
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

            <div className="flex gap-3 pt-4">
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
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground shadow-financial"
                disabled={!formData.accountId || !formData.type || !formData.amount || (!formData.category && !customCategory) || !formData.description}
              >
                Add Transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};