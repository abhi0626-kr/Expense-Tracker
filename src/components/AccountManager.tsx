import { useState, useEffect } from "react";
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
  ArrowRightLeft,
} from "lucide-react";
import { Account } from "@/hooks/useExpenseData";
import { useAuth } from "@/hooks/useAuth";
import { Star, StarOff, GripVertical } from "lucide-react";
import { getPinnedAccountIds, setPinnedAccountIds } from "@/lib/pinnedAccount";
import { useToast } from "@/hooks/use-toast";
import { Reorder } from "framer-motion";
import { TransferFunds } from "./TransferFunds";

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
  onReorderAccounts?: (accounts: Account[]) => void;
  onTransferFunds?: (fromAccountId: string, toAccountId: string, amount: number, description?: string, date?: string, time?: string) => Promise<boolean | void>;
}

export const AccountManager = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onRemoveDuplicates,
  onReorderAccounts,
  onTransferFunds,
}: AccountManagerProps) => {
  const { user } = useAuth();
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  useEffect(() => {
    setPinnedIds(getPinnedAccountIds(user?.id));
  }, [user?.id]);

  const togglePin = (accountId: string) => {
    if (!user?.id) return;
    const isPinned = pinnedIds.includes(accountId);
    if (isPinned) {
      const next = pinnedIds.filter((id) => id !== accountId);
      setPinnedAccountIds(user.id, next);
      setPinnedIds(next);
      return;
    }
    // limit pins to 3
    if (pinnedIds.length >= 3) {
      toast({
        title: "Maximum pinned accounts",
        description: "You can pin up to 3 accounts.",
      });
      return;
    }
    const next = [accountId, ...pinnedIds];
    setPinnedAccountIds(user.id, next);
    setPinnedIds(next);
  };
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
            <CardDescription className="text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
              <span>Manage your wallets and bank accounts</span>
              {accounts.length > 1 && (
                <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">• Hold & drag to reorder</span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {accounts.length >= 2 && onTransferFunds && (
              <Button
                size="sm"
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
                onClick={() => setIsTransferDialogOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1.5 text-cyan-500 dark:text-cyan-400" />
                <span>Transfer</span>
              </Button>
            )}
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
          <Reorder.Group
            axis="y"
            values={accounts}
            onReorder={(newOrder) => {
              if (onReorderAccounts) {
                onReorderAccounts(newOrder);
              }
            }}
            className="space-y-3"
          >
            {accounts.map((account) => (
              <Reorder.Item
                key={account.id}
                value={account}
                className="select-none rounded-xl border border-border bg-card/70 p-3 sm:p-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/90 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/90 active:shadow-lg touch-none"
                whileDrag={{
                  scale: 1.02,
                  boxShadow: "0 14px 36px -6px rgba(0, 0, 0, 0.4)",
                  borderColor: "rgba(124, 58, 237, 0.6)",
                  zIndex: 50,
                }}
              >
                <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                  {/* Account Info + Drag Grip */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground/60 hover:text-foreground touch-none shrink-0"
                      title="Hold & drag to reorder"
                    >
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div
                      className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${account.color} flex items-center justify-center text-white shrink-0 shadow-sm`}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
                          {account.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                          {account.type}
                        </Badge>
                      </div>
                      <p
                        className={`text-xs sm:text-sm font-bold mt-0.5 whitespace-nowrap ${
                          account.balance >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                        }`}
                      >
                        ₹{account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-0.5 shrink-0"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(account);
                      }}
                      title="Edit Account"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(account.id);
                      }}
                      title={pinnedIds.includes(account.id) ? "Unpin account" : "Pin account"}
                    >
                      {pinnedIds.includes(account.id) ? (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Delete Account"
                          onClick={(e) => e.stopPropagation()}
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
                            className="bg-rose-500 hover:bg-rose-600"
                            onClick={() => onDeleteAccount(account.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </CardContent>

      {/* Transfer Funds Modal */}
      {onTransferFunds && (
        <TransferFunds
          open={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          accounts={accounts}
          onTransfer={onTransferFunds}
        />
      )}
    </Card>
  );
};
