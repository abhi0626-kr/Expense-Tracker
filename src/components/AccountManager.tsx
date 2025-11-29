import { useState } from "react";
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
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  CreditCard,
  Landmark,
  PiggyBank,
  Smartphone,
  Banknote,
  Eraser,
} from "lucide-react";
import { Account } from "@/hooks/useExpenseData";

const ACCOUNT_TYPES = [
  { value: "Checking", label: "Checking Account", icon: Landmark },
  { value: "Savings", label: "Savings Account", icon: PiggyBank },
  { value: "Credit", label: "Credit Card", icon: CreditCard },
  { value: "Cash", label: "Cash / Wallet", icon: Banknote },
  { value: "UPI", label: "UPI (GPay, PhonePe)", icon: Smartphone },
  { value: "Paytm", label: "Paytm Wallet", icon: Wallet },
  { value: "Other", label: "Other", icon: Wallet },
];

const ACCOUNT_COLORS = [
  { value: "from-blue-500 to-blue-600", label: "Blue", preview: "bg-blue-500" },
  { value: "from-green-500 to-green-600", label: "Green", preview: "bg-green-500" },
  { value: "from-purple-500 to-purple-600", label: "Purple", preview: "bg-purple-500" },
  { value: "from-orange-500 to-orange-600", label: "Orange", preview: "bg-orange-500" },
  { value: "from-pink-500 to-pink-600", label: "Pink", preview: "bg-pink-500" },
  { value: "from-cyan-500 to-cyan-600", label: "Cyan", preview: "bg-cyan-500" },
  { value: "from-red-500 to-red-600", label: "Red", preview: "bg-red-500" },
  { value: "from-yellow-500 to-yellow-600", label: "Yellow", preview: "bg-yellow-500" },
  { value: "from-indigo-500 to-indigo-600", label: "Indigo", preview: "bg-indigo-500" },
  { value: "from-teal-500 to-teal-600", label: "Teal", preview: "bg-teal-500" },
];

interface AccountManagerProps {
  accounts: Account[];
  onAddAccount: (account: Omit<Account, "id">) => Promise<void>;
  onUpdateAccount: (accountId: string, account: Omit<Account, "id">) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
  onRemoveDuplicates?: () => Promise<void>;
}

export const AccountManager = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onRemoveDuplicates,
}: AccountManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Checking",
    balance: "",
    color: "from-blue-500 to-blue-600",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Checking",
      balance: "",
      color: "from-blue-500 to-blue-600",
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.type) return;

    const accountData = {
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance) || 0,
      color: formData.color,
    };

    if (editingAccount) {
      await onUpdateAccount(editingAccount.id, accountData);
      setEditingAccount(null);
    } else {
      await onAddAccount(accountData);
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      color: account.color,
    });
    setEditingAccount(account);
    setIsAddDialogOpen(true);
  };

  const getAccountIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find((t) => t.value === type);
    if (accountType) {
      const Icon = accountType.icon;
      return <Icon className="h-5 w-5" />;
    }
    return <Wallet className="h-5 w-5" />;
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-primary" />
              Account Manager
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage your wallets and bank accounts
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onRemoveDuplicates && accounts.length > 3 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Remove Duplicates</span>
                    <span className="sm:hidden">Clean</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Duplicate Accounts?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove duplicate accounts with the same name, keeping the one with the highest balance or with transactions. Accounts with transactions cannot be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={onRemoveDuplicates}
                    >
                      Remove Duplicates
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    resetForm();
                    setEditingAccount(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? "Edit Account" : "Create New Account"}
                  </DialogTitle>
                  <DialogDescription>
                    Add a new wallet, bank account, or credit card
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    placeholder="e.g., HDFC Savings, Cash Wallet"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial Balance (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter current balance"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Card Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {ACCOUNT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`h-8 w-full rounded-md ${color.preview} transition-all ${
                          formData.color === color.value
                            ? "ring-2 ring-offset-2 ring-primary"
                            : "hover:scale-105"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, color: color.value })
                        }
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingAccount ? "Update" : "Create"} Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Total Balance Summary */}
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Balance</span>
            <span className="text-lg font-bold text-primary">
              ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No accounts yet</p>
            <p className="text-sm">Add your first account to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-3 sm:p-4 border rounded-lg bg-card/50"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Account Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center text-white shrink-0`}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm sm:text-base truncate">
                        {account.name}
                      </h4>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {account.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Balance + Actions */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm sm:text-base whitespace-nowrap ${
                        account.balance >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      ₹{account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleEdit(account)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{account.name}"?
                              This action cannot be undone. Make sure there are no
                              transactions linked to this account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => onDeleteAccount(account.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
