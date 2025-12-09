import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Account, Transaction } from "@/hooks/useExpenseData";
import { XIcon, EditIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddTransactionProps {
  accounts: Account[];
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  onClose: () => void;
}

export const AddTransaction = ({ accounts, onAddTransaction, onClose }: AddTransactionProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    accountId: "",
    type: "" as "income" | "expense" | "",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [editMode, setEditMode] = useState(true);
  const [customCategory, setCustomCategory] = useState("");

  const categories = {
    expense: [
      "Food & Dining",
      "Transportation", 
      "Shopping",
      "Entertainment",
      "Bills & Utilities",
      "Healthcare",
      "Travel",
      "Education",
      "Other"
    ],
    income: [
      "Salary",
      "Business",
      "Investment",
      "Other"
    ]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountId || !formData.type || !formData.amount || !formData.category || !formData.description) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onAddTransaction({
      account_id: formData.accountId,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category || customCategory,
      description: formData.description,
      date: formData.date
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
      date: new Date().toISOString().split('T')[0]
    });
    setCustomCategory("");
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
                  }}
                  disabled={!formData.type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type && categories[formData.type].map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({ ...formData, category: "" });
                    setCustomCategory("");
                  }}
                  title="Add custom category"
                  className="px-3"
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
              </div>
              {!formData.category && (
                <Input
                  placeholder="Or enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2"
                />
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

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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