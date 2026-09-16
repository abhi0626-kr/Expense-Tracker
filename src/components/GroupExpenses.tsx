import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpandableText } from "@/components/ExpandableText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  ArrowLeft,
  Receipt,
  HandCoins,
  Trash2,
  UserPlus,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Sparkles,
  Calendar,
  Wallet,
  FileSpreadsheet,
  Printer,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
} from "lucide-react";
import { useGroupExpenses, Group, GroupExpense } from "@/hooks/useGroupExpenses";
import { useExpenseData } from "@/hooks/useExpenseData";
import { exportGroupToCSV, exportGroupToPDF } from "@/utils/groupExport";

const EMOJI_OPTIONS = ["🏖️", "🏠", "🍕", "🚗", "🎉", "✈️", "☕", "🛒", "🎮", "⚽"];

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Rent",
  "Travel",
  "Groceries",
  "Other",
];

export const GroupExpenses = () => {
  const {
    groups,
    expenses,
    settlements,
    createGroup,
    deleteGroup,
    addMemberToGroup,
    addGroupExpense,
    deleteGroupExpense,
    addSettlement,
    getGroupMemberBalances,
    getSimplifiedDebts,
    getOverallUserBalance,
    refreshCloudData,
  } = useGroupExpenses();

  const { addTransaction, accounts } = useExpenseData();

  // Active view state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "members">("expenses");

  // Modals state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Forms state
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    icon: "🏖️",
    membersInput: "Max Verstappen, Abhishek",
  });

  const [newMemberName, setNewMemberName] = useState("");

  const [expenseFormData, setExpenseFormData] = useState({
    title: "",
    amount: "",
    paid_by: "You",
    payerMode: "single" as "single" | "multiple",
    multiplePayers: {} as Record<string, string>,
    category: "Food & Dining",
    split_type: "equal" as "equal" | "custom",
    participatingMembers: [] as string[],
    customSplits: {} as Record<string, string>,
    syncToPersonal: false, // Default false to isolate group expenses from normal transactions
  });

  const [settlementFormData, setSettlementFormData] = useState({
    from_member: "",
    to_member: "You",
    amount: "",
  });

  // Selected active group object
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  // Group balances for selected group
  const currentGroupBalances = useMemo(() => {
    if (!selectedGroupId) return {};
    return getGroupMemberBalances(selectedGroupId);
  }, [selectedGroupId, getGroupMemberBalances]);

  // Simplified debts for selected group
  const currentSimplifiedDebts = useMemo(() => {
    if (!selectedGroupId) return [];
    return getSimplifiedDebts(selectedGroupId);
  }, [selectedGroupId, getSimplifiedDebts]);

  // Total spent in selected group
  const currentGroupTotalSpent = useMemo(() => {
    if (!selectedGroupId) return 0;
    return expenses
      .filter((e) => e.group_id === selectedGroupId)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [selectedGroupId, expenses]);

  // Reset Create Group form
  const resetGroupForm = () => {
    setNewGroupData({
      name: "",
      description: "",
      icon: "🏖️",
      membersInput: "Max Verstappen, Abhishek",
    });
  };

  // Handle Create Group
  const handleCreateGroup = () => {
    if (!newGroupData.name.trim()) return;

    const membersArray = newGroupData.membersInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    const group = createGroup(
      newGroupData.name.trim(),
      membersArray,
      newGroupData.description.trim(),
      newGroupData.icon
    );

    resetGroupForm();
    setIsCreateGroupOpen(false);
    setSelectedGroupId(group.id);
  };

  // Open Add Expense Dialog for group
  const handleOpenAddExpense = () => {
    if (!selectedGroup) return;
    setExpenseFormData({
      title: "",
      amount: "",
      paid_by: "You",
      payerMode: "single",
      multiplePayers: selectedGroup.members.reduce((acc, m) => ({ ...acc, [m]: "" }), {}),
      category: "Food & Dining",
      split_type: "equal",
      participatingMembers: [...selectedGroup.members],
      customSplits: selectedGroup.members.reduce((acc, m) => ({ ...acc, [m]: "" }), {}),
      syncToPersonal: false,
    });
    setIsAddExpenseOpen(true);
  };

  // Handle Add Expense Submit
  const handleAddExpenseSubmit = async () => {
    if (!selectedGroup || !expenseFormData.title.trim()) return;

    let numAmount = parseFloat(expenseFormData.amount) || 0;
    let finalPaidByMap: Record<string, number> | undefined = undefined;
    let mainPaidBy = expenseFormData.paid_by;

    if (expenseFormData.payerMode === "multiple") {
      finalPaidByMap = {};
      let sumPaid = 0;
      Object.entries(expenseFormData.multiplePayers).forEach(([m, val]) => {
        const p = parseFloat(val);
        if (!isNaN(p) && p > 0) {
          finalPaidByMap![m] = p;
          sumPaid += p;
        }
      });
      if (sumPaid <= 0) return;
      numAmount = sumPaid;
      mainPaidBy = Object.keys(finalPaidByMap).join(", ");
    } else {
      if (isNaN(numAmount) || numAmount <= 0) return;
    }

    const finalSplits: Record<string, number> = {};

    if (expenseFormData.split_type === "equal") {
      const participants = expenseFormData.participatingMembers.length > 0
        ? expenseFormData.participatingMembers
        : selectedGroup.members;

      const perPerson = numAmount / participants.length;
      participants.forEach((m) => {
        finalSplits[m] = Math.round(perPerson * 100) / 100;
      });
    } else {
      Object.entries(expenseFormData.customSplits).forEach(([m, val]) => {
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed > 0) {
          finalSplits[m] = parsed;
        }
      });
    }

    addGroupExpense({
      group_id: selectedGroup.id,
      title: expenseFormData.title.trim(),
      amount: numAmount,
      paid_by: mainPaidBy,
      paid_by_map: finalPaidByMap,
      category: expenseFormData.category,
      date: new Date().toISOString().split("T")[0],
      split_type: expenseFormData.split_type,
      splits: finalSplits,
    });

    // Optionally sync "Your Share" to personal expense tracker if user explicitly toggles it
    if (expenseFormData.syncToPersonal && finalSplits["You"] > 0) {
      const defaultAccount = accounts[0]?.id || "";
      await addTransaction({
        account_id: defaultAccount,
        type: "expense",
        amount: finalSplits["You"],
        category: expenseFormData.category,
        description: `Group (${selectedGroup.name}): ${expenseFormData.title}`,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      });
    }

    setIsAddExpenseOpen(false);
  };

  // Open Settle Up Modal
  const handleOpenSettleUp = (transfer?: { from: string; to: string; amount: number }) => {
    if (!selectedGroup) return;
    const defaultFrom = transfer?.from || selectedGroup.members.find((m) => m !== "You") || selectedGroup.members[0] || "";
    const defaultTo = transfer?.to || (defaultFrom === "You" ? (selectedGroup.members.find((m) => m !== "You") || "") : "You");

    setSettlementFormData({
      from_member: defaultFrom,
      to_member: defaultTo,
      amount: transfer?.amount ? transfer.amount.toString() : "",
    });
    setIsSettleUpOpen(true);
  };

  // Handle Settlement Submit
  const handleSettlementSubmit = () => {
    if (!selectedGroup || !settlementFormData.from_member || !settlementFormData.to_member || !settlementFormData.amount) return;
    
    if (settlementFormData.from_member === settlementFormData.to_member) {
      toast({
        title: "Invalid Settlement",
        description: "Payer and receiver cannot be the same person.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(settlementFormData.amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    addSettlement(
      selectedGroup.id,
      settlementFormData.from_member,
      settlementFormData.to_member,
      numAmount
    );

    setIsSettleUpOpen(false);
  };

  // Add Member Submit
  const handleAddMemberSubmit = () => {
    if (!selectedGroup || !newMemberName.trim()) return;
    addMemberToGroup(selectedGroup.id, newMemberName.trim());
    setNewMemberName("");
    setIsAddMemberOpen(false);
  };

  const overallBalance = getOverallUserBalance();

  return (
    <div className="space-y-6">
      {!selectedGroup ? (
        /* GROUPS LIST OVERVIEW */
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border bg-card/90 shadow-md backdrop-blur-xl dark:bg-slate-950/80 dark:border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Groups</p>
                  <p className="text-2xl font-bold text-foreground">{groups.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
                  <Users className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/90 shadow-md backdrop-blur-xl dark:bg-slate-950/80 dark:border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Net Group Balance</p>
                  <p className={`text-2xl font-bold ${overallBalance > 0 ? "text-green-500" : overallBalance < 0 ? "text-red-500" : "text-foreground"}`}>
                    {overallBalance >= 0 ? `+₹${overallBalance.toLocaleString("en-IN")}` : `-₹${Math.abs(overallBalance).toLocaleString("en-IN")}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {overallBalance > 0 ? "You are owed overall 🤑" : overallBalance < 0 ? "You owe overall 💸" : "You are fully settled up 👍"}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl ${overallBalance >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  <HandCoins className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-500" />
                Your Expense Groups
              </h2>
              <p className="text-xs text-muted-foreground">Manage shared trip expenses, house bills, and friends</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refreshCloudData(true)}
                title="Sync Groups across devices via Supabase cloud"
                className="border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 text-xs gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sync Cloud</span>
              </Button>

              <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white shadow-md">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Group
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-500" />
                    Create Expense Group
                  </DialogTitle>
                  <DialogDescription>
                    Start a new group to track and split expenses with friends or housemates.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  <div className="space-y-2">
                    <Label>Group Icon</Label>
                    <div className="flex flex-wrap gap-2">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewGroupData({ ...newGroupData, icon: emoji })}
                          className={`text-xl p-2 rounded-xl border transition-all ${
                            newGroupData.icon === emoji
                              ? "border-violet-500 bg-violet-500/20 scale-110"
                              : "border-border bg-muted/20 hover:bg-muted"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Group Name</Label>
                    <Input
                      placeholder="e.g. Goa Trip 🏖️, Flatmates 🏠, Dinner Party 🍕"
                      value={newGroupData.name}
                      onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add Members (comma-separated)</Label>
                    <Input
                      placeholder="e.g. Rahul, Priya, Amit"
                      value={newGroupData.membersInput}
                      onChange={(e) => setNewGroupData({ ...newGroupData, membersInput: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Note: You ("You") are automatically included in every group.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} className="bg-violet-600 hover:bg-violet-700 text-white">
                    Create Group
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Groups Grid */}
          {groups.length === 0 ? (
            <Card className="border-dashed border-2 p-8 text-center bg-card/40">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40 animate-pulse" />
              <h3 className="text-base font-semibold text-foreground">No groups yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Create a group for your next trip or house rent to automatically calculate who owes what!
              </p>
              <Button
                onClick={() => setIsCreateGroupOpen(true)}
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white size-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Your First Group
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const balances = getGroupMemberBalances(group.id);
                const userBal = balances["You"] || 0;
                const groupExp = expenses.filter((e) => e.group_id === group.id);
                const totalSpent = groupExp.reduce((sum, e) => sum + e.amount, 0);

                return (
                  <Card
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className="cursor-pointer border-border bg-card/90 hover:border-violet-500/50 hover:shadow-lg transition-all backdrop-blur-xl dark:bg-slate-950/80 group overflow-hidden"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                            {group.icon || "🏖️"}
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold group-hover:text-violet-500 transition-colors">
                              {group.name}
                            </CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                              <Users className="h-3 w-3 inline-block" />
                              {group.members.length} members ({group.members.join(", ")})
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs font-medium px-2.5 py-1 ${
                              userBal > 0
                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                                : userBal < 0
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {userBal > 0
                              ? `+₹${userBal.toLocaleString("en-IN")}`
                              : userBal < 0
                              ? `-₹${Math.abs(userBal).toLocaleString("en-IN")}`
                              : "Settled"}
                          </Badge>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{group.name}"? This will permanently delete the group and all its recorded expenses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteGroup(group.id);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete Group
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>Total Spent: <strong className="text-foreground">₹{totalSpent.toLocaleString("en-IN")}</strong></span>
                        <span className="text-violet-500 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          View Details <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* GROUP DETAIL VIEW */
        <div className="space-y-5">
          {/* Header & Back Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedGroupId(null)}
                className="h-9 w-9 border-border"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedGroup.icon || "🏖️"}</span>
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">{selectedGroup.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedGroup.members.length} Members: {selectedGroup.members.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportGroupToCSV(selectedGroup, expenses, settlements, currentGroupBalances, currentSimplifiedDebts)}
                className="border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 text-xs gap-1"
                title="Download CSV Report"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => exportGroupToPDF(selectedGroup, expenses, settlements, currentGroupBalances, currentSimplifiedDebts)}
                className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 text-xs gap-1"
                title="Print / Save PDF Report"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenAddExpense}
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-md text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Expense
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenSettleUp()}
                className="border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10"
              >
                <HandCoins className="h-4 w-4 mr-1.5" />
                Settle Up
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{selectedGroup.name}"? All associated expenses and settlements will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteGroup(selectedGroup.id);
                        setSelectedGroupId(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Group
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Group Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card/60 p-3 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Group Total Spent</p>
                <p className="text-lg font-bold text-foreground">₹{currentGroupTotalSpent.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-3 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${(currentGroupBalances["You"] || 0) >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                <HandCoins className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Your Balance in Group</p>
                <p className={`text-lg font-bold ${(currentGroupBalances["You"] || 0) > 0 ? "text-green-500" : (currentGroupBalances["You"] || 0) < 0 ? "text-red-500" : "text-foreground"}`}>
                  {(currentGroupBalances["You"] || 0) >= 0 ? `+₹${(currentGroupBalances["You"] || 0).toLocaleString("en-IN")}` : `-₹${Math.abs(currentGroupBalances["You"] || 0).toLocaleString("en-IN")}`}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-3 flex items-center gap-3 justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Members</p>
                <p className="text-lg font-bold text-foreground">{selectedGroup.members.length} friends</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddMemberOpen(true)}
                className="h-8 text-xs text-violet-500 hover:bg-violet-500/10"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Add Member
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border space-x-4 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveTab("expenses")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "expenses"
                  ? "border-violet-500 text-violet-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span className="sm:hidden">Expenses ({expenses.filter((e) => e.group_id === selectedGroup.id).length})</span>
              <span className="hidden sm:inline">Group Expenses ({expenses.filter((e) => e.group_id === selectedGroup.id).length})</span>
            </button>

            <button
              onClick={() => setActiveTab("balances")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "balances"
                  ? "border-violet-500 text-violet-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <HandCoins className="h-3.5 w-3.5" />
              <span className="sm:hidden">Balances ({currentSimplifiedDebts.length})</span>
              <span className="hidden sm:inline">Balances & Settle Up ({currentSimplifiedDebts.length})</span>
            </button>
          </div>

          {/* TAB CONTENTS */}

          {/* 1. EXPENSES TAB */}
          {activeTab === "expenses" && (
            <div className="space-y-3">
              {expenses.filter((e) => e.group_id === selectedGroup.id).length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No expenses in this group yet</p>
                  <p className="text-xs opacity-75">Click "Add Expense" to record a bill or payment</p>
                </div>
              ) : (
                expenses
                  .filter((e) => e.group_id === selectedGroup.id)
                  .map((expense) => {
                    const yourShare = expense.splits["You"] || 0;

                    return (
                      <div
                        key={expense.id}
                        className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3 hover:bg-card/90 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                            <Receipt className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{expense.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>
                                Paid by{" "}
                                <strong className="text-foreground font-medium">
                                  {expense.paid_by_map && Object.keys(expense.paid_by_map).length > 0
                                    ? Object.entries(expense.paid_by_map)
                                        .map(([p, a]) => `${p} (₹${a})`)
                                        .join(" & ")
                                    : expense.paid_by}
                                </strong>
                              </span>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {expense.category}
                              </Badge>
                              <span>•</span>
                              <span>{expense.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="text-sm font-bold text-foreground">₹{expense.amount.toLocaleString("en-IN")}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Your share: <strong className="text-violet-500">₹{yourShare.toLocaleString("en-IN")}</strong>
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGroupExpense(expense.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* 2. BALANCES & SETTLEMENTS TAB */}
          {activeTab === "balances" && (
            <div className="space-y-5">
              {/* Simplified Debts Box */}
              <Card className="border-violet-500/30 bg-violet-500/5 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-4 w-4" />
                    Simplified Settle-Up Transfers
                  </CardTitle>
                  <ExpandableText
                    text="Optimized list of minimal payments required to clear all group debts"
                    maxChars={45}
                    className="text-xs text-muted-foreground"
                  />
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentSimplifiedDebts.length === 0 ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Everyone is settled up! No pending payments.
                    </div>
                  ) : (
                    currentSimplifiedDebts.map((transfer, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border bg-background/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 overflow-hidden"
                      >
                        <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs min-w-0 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <Badge variant="outline" className="font-semibold text-xs truncate max-w-[110px] sm:max-w-[140px]">
                              {transfer.from}
                            </Badge>
                            <span className="text-muted-foreground text-[11px]">pays</span>
                            <Badge variant="outline" className="font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs truncate max-w-[110px] sm:max-w-[140px]">
                              {transfer.to}
                            </Badge>
                          </div>
                          <span className="font-extrabold text-foreground text-xs sm:text-sm ml-auto sm:ml-2 whitespace-nowrap">
                            ₹{transfer.amount.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleOpenSettleUp(transfer)}
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto shrink-0 font-medium shadow-sm"
                        >
                          Record Settlement
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Detailed Member Balances List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member Net Balances</h4>
                {selectedGroup.members.map((member) => {
                  const bal = currentGroupBalances[member] || 0;

                  return (
                    <div
                      key={member}
                      className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="text-xs font-bold bg-violet-500/10 text-violet-500">
                            {member.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-semibold text-foreground">{member}</span>
                          {member === "You" && <Badge variant="outline" className="text-[10px] ml-2 px-1">You</Badge>}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-bold ${bal > 0 ? "text-green-500" : bal < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {bal > 0 ? `+₹${bal.toLocaleString("en-IN")}` : bal < 0 ? `-₹${Math.abs(bal).toLocaleString("en-IN")}` : "₹0"}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {bal > 0 ? "gets back" : bal < 0 ? "owes" : "settled"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD EXPENSE DIALOG */}
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto max-h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader className="shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-violet-500" />
                  Add Group Expense
                </DialogTitle>
                <DialogDescription>
                  Record a shared payment for {selectedGroup.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 overflow-y-auto max-h-[60vh] pr-1.5 scrollbar-thin">
                <div className="space-y-2">
                  <Label>Expense Description</Label>
                  <Input
                    placeholder="e.g. Dinner, Hotel, Cab, Groceries"
                    value={expenseFormData.title}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                  />
                </div>

                {/* PAYER MODE SELECTOR */}
                <div className="space-y-2 border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Who Paid?</Label>
                    <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpenseFormData({ ...expenseFormData, payerMode: "single" })}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                          expenseFormData.payerMode === "single"
                            ? "bg-violet-600 text-white font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Single Payer
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseFormData({ ...expenseFormData, payerMode: "multiple" })}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                          expenseFormData.payerMode === "multiple"
                            ? "bg-violet-600 text-white font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Multiple Payers (2+)
                      </button>
                    </div>
                  </div>

                  {expenseFormData.payerMode === "single" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Amount (₹)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={expenseFormData.amount}
                          onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Paid By</Label>
                        <Select
                          value={expenseFormData.paid_by}
                          onValueChange={(val) => setExpenseFormData({ ...expenseFormData, paid_by: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedGroup.members.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-muted/20 p-2.5 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Enter amount paid by each person:</span>
                        <span className="font-bold text-violet-500">
                          Total: ₹
                          {Object.values(expenseFormData.multiplePayers)
                            .reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
                            .toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {selectedGroup.members.map((m) => (
                          <div key={m} className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border/40">
                            <span className="text-xs font-medium w-24 truncate">{m}</span>
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                placeholder="0"
                                className="h-8 text-xs pl-6"
                                value={expenseFormData.multiplePayers[m] || ""}
                                onChange={(e) =>
                                  setExpenseFormData({
                                    ...expenseFormData,
                                    multiplePayers: {
                                      ...expenseFormData.multiplePayers,
                                      [m]: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={expenseFormData.category}
                    onValueChange={(val) => setExpenseFormData({ ...expenseFormData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Split Strategy</Label>
                    <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpenseFormData({ ...expenseFormData, split_type: "equal" })}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                          expenseFormData.split_type === "equal"
                            ? "bg-violet-600 text-white font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Equal
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseFormData({ ...expenseFormData, split_type: "custom" })}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                          expenseFormData.split_type === "custom"
                            ? "bg-violet-600 text-white font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {expenseFormData.split_type === "equal" ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Select participating members ({selectedGroup.members.length}):</span>
                        <button
                          type="button"
                          onClick={() => {
                            const allSelected = expenseFormData.participatingMembers.length === selectedGroup.members.length;
                            setExpenseFormData({
                              ...expenseFormData,
                              participatingMembers: allSelected ? [] : [...selectedGroup.members],
                            });
                          }}
                          className="text-violet-500 hover:underline font-semibold text-[10px]"
                        >
                          {expenseFormData.participatingMembers.length === selectedGroup.members.length
                            ? "Clear All"
                            : "Select All"}
                        </button>
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 border border-border/50 rounded-xl p-2 bg-muted/10">
                        {selectedGroup.members.map((m) => {
                          const isChecked = expenseFormData.participatingMembers.includes(m);
                          return (
                            <div key={m} className="flex items-center justify-between p-2 rounded-lg border border-border bg-card/60">
                              <span className="text-xs font-medium text-foreground">{m}</span>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setExpenseFormData({
                                      ...expenseFormData,
                                      participatingMembers: [...expenseFormData.participatingMembers, m],
                                    });
                                  } else {
                                    setExpenseFormData({
                                      ...expenseFormData,
                                      participatingMembers: expenseFormData.participatingMembers.filter((item) => item !== m),
                                    });
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-muted-foreground">Enter custom share per person:</p>
                      <div className="max-h-44 overflow-y-auto space-y-2 pr-1 border border-border/50 rounded-xl p-2 bg-muted/10">
                        {selectedGroup.members.map((m) => (
                          <div key={m} className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium w-24 truncate">{m}</span>
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-8 text-xs"
                              value={expenseFormData.customSplits[m] || ""}
                              onChange={(e) =>
                                setExpenseFormData({
                                  ...expenseFormData,
                                  customSplits: {
                                    ...expenseFormData.customSplits,
                                    [m]: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sync Checkbox */}
                <div className="flex items-center space-x-2 pt-2 border-t border-border">
                  <Checkbox
                    id="sync-personal"
                    checked={expenseFormData.syncToPersonal}
                    onCheckedChange={(checked) =>
                      setExpenseFormData({ ...expenseFormData, syncToPersonal: !!checked })
                    }
                  />
                  <Label htmlFor="sync-personal" className="text-xs font-normal cursor-pointer text-muted-foreground">
                    Optionally sync <strong>Your Share</strong> to personal transactions
                  </Label>
                </div>
              </div>

              <DialogFooter className="shrink-0 pt-3 border-t border-border mt-2">
                <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpenseSubmit} className="bg-violet-600 hover:bg-violet-700 text-white">
                  Add Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* SETTLE UP DIALOG */}
          <Dialog open={isSettleUpOpen} onOpenChange={setIsSettleUpOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HandCoins className="h-5 w-5 text-green-500" />
                  Record Settlement Payment
                </DialogTitle>
                <DialogDescription>
                  Record a direct payment between members to settle balance debts
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Who is paying?</Label>
                  <Select
                    value={settlementFormData.from_member}
                    onValueChange={(val) => {
                      const nextTo = settlementFormData.to_member === val
                        ? (selectedGroup.members.find((m) => m !== val) || "")
                        : settlementFormData.to_member;
                      setSettlementFormData({ ...settlementFormData, from_member: val, to_member: nextTo });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedGroup.members
                        .filter((m) => m !== settlementFormData.to_member)
                        .map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Who is receiving?</Label>
                  <Select
                    value={settlementFormData.to_member}
                    onValueChange={(val) => {
                      const nextFrom = settlementFormData.from_member === val
                        ? (selectedGroup.members.find((m) => m !== val) || "")
                        : settlementFormData.from_member;
                      setSettlementFormData({ ...settlementFormData, to_member: val, from_member: nextFrom });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select receiver" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedGroup.members
                        .filter((m) => m !== settlementFormData.from_member)
                        .map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Settlement Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={settlementFormData.amount}
                    onChange={(e) => setSettlementFormData({ ...settlementFormData, amount: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettleUpOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSettlementSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                  Confirm Settlement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ADD MEMBER DIALOG */}
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-violet-500" />
                  Add Member to Group
                </DialogTitle>
                <DialogDescription>
                  Add a friend or housemate to {selectedGroup.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <Label>Member Name</Label>
                <Input
                  placeholder="e.g. Vikram, Ananya"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMemberSubmit} className="bg-violet-600 hover:bg-violet-700 text-white">
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};