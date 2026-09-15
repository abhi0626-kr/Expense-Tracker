import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  members: string[]; // List of member names e.g. ["You", "Rahul", "Priya"]
  created_at: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string; // Legacy single payer name e.g. "You" or "Rahul"
  paid_by_map?: Record<string, number>; // Multiple payers: member -> amount paid e.g. { "Rahul": 600, "Priya": 400 }
  category: string;
  date: string;
  split_type: "equal" | "custom";
  splits: Record<string, number>; // Member name -> amount owed
  created_at: string;
}

export interface GroupSettlement {
  id: string;
  group_id: string;
  from_member: string; // Member paying
  to_member: string;   // Member receiving
  amount: number;
  date: string;
  created_at: string;
}

export interface DebtTransfer {
  from: string;
  to: string;
  amount: number;
}

const STORAGE_GROUPS = "expense-tracker:groups";
const STORAGE_EXPENSES = "expense-tracker:group-expenses";
const STORAGE_SETTLEMENTS = "expense-tracker:group-settlements";

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveLocalData = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
};

export const useGroupExpenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [groups, setGroups] = useState<Group[]>(() => getLocalData<Group[]>(STORAGE_GROUPS, []));
  const [expenses, setExpenses] = useState<GroupExpense[]>(() => getLocalData<GroupExpense[]>(STORAGE_EXPENSES, []));
  const [settlements, setSettlements] = useState<GroupSettlement[]>(() => getLocalData<GroupSettlement[]>(STORAGE_SETTLEMENTS, []));
  const [loading, setLoading] = useState(false);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    saveLocalData(STORAGE_GROUPS, groups);
  }, [groups]);

  useEffect(() => {
    saveLocalData(STORAGE_EXPENSES, expenses);
  }, [expenses]);

  useEffect(() => {
    saveLocalData(STORAGE_SETTLEMENTS, settlements);
  }, [settlements]);

  // Create Group
  const createGroup = useCallback((name: string, members: string[], description?: string, icon?: string): Group => {
    // Ensure "You" is always in member list
    const sanitizedMembers = Array.from(new Set(["You", ...members.map((m) => m.trim()).filter(Boolean)]));
    
    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      description: description || "",
      icon: icon || "🏖️",
      members: sanitizedMembers,
      created_at: new Date().toISOString(),
    };

    setGroups((prev) => [newGroup, ...prev]);
    toast({
      title: "Group Created 🎉",
      description: `"${name}" with ${sanitizedMembers.length} members has been created.`,
    });
    return newGroup;
  }, [toast]);

  // Add Member to Group
  const addMemberToGroup = useCallback((groupId: string, memberName: string) => {
    const trimmed = memberName.trim();
    if (!trimmed) return;

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId && !g.members.includes(trimmed)) {
          return { ...g, members: [...g.members, trimmed] };
        }
        return g;
      })
    );

    toast({
      title: "Member Added",
      description: `${trimmed} added to group.`,
    });
  }, [toast]);

  // Delete Group
  const deleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setExpenses((prev) => prev.filter((e) => e.group_id !== groupId));
    setSettlements((prev) => prev.filter((s) => s.group_id !== groupId));

    toast({
      title: "Group Deleted",
      description: "Group and all associated expenses were removed.",
    });
  }, [toast]);

  // Add Group Expense
  const addGroupExpense = useCallback((
    expenseData: Omit<GroupExpense, "id" | "created_at">
  ): GroupExpense => {
    const newExpense: GroupExpense = {
      ...expenseData,
      id: `gexp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);

    toast({
      title: "Expense Added 🧾",
      description: `₹${expenseData.amount.toLocaleString("en-IN")} for "${expenseData.title}" recorded.`,
    });

    return newExpense;
  }, [toast]);

  // Delete Group Expense
  const deleteGroupExpense = useCallback((expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    toast({
      title: "Expense Removed",
      description: "Group expense deleted.",
    });
  }, [toast]);

  // Add Settlement Payment
  const addSettlement = useCallback((
    groupId: string,
    fromMember: string,
    toMember: string,
    amount: number
  ) => {
    if (fromMember === toMember) {
      toast({
        title: "Invalid Settlement",
        description: "Payer and receiver cannot be the same person.",
        variant: "destructive",
      });
      return;
    }

    const newSettlement: GroupSettlement = {
      id: `settle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      group_id: groupId,
      from_member: fromMember,
      to_member: toMember,
      amount,
      date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    };

    setSettlements((prev) => [newSettlement, ...prev]);

    toast({
      title: "Settlement Recorded 🤝",
      description: `${fromMember} paid ${toMember} ₹${amount.toLocaleString("en-IN")}.`,
    });
  }, [toast]);

  // Compute Net Balances for Members in a Group
  const getGroupMemberBalances = useCallback((groupId: string): Record<string, number> => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return {};

    const balances: Record<string, number> = {};
    group.members.forEach((m) => {
      balances[m] = 0;
    });

    // 1. Process Expenses
    const groupExpensesList = expenses.filter((e) => e.group_id === groupId);
    groupExpensesList.forEach((exp) => {
      // Payers get credited their paid contributions
      if (exp.paid_by_map && Object.keys(exp.paid_by_map).length > 0) {
        Object.entries(exp.paid_by_map).forEach(([payer, paidAmount]) => {
          if (balances[payer] !== undefined) {
            balances[payer] += paidAmount;
          } else {
            balances[payer] = paidAmount;
          }
        });
      } else {
        // Fallback for single payer
        if (balances[exp.paid_by] !== undefined) {
          balances[exp.paid_by] += exp.amount;
        } else {
          balances[exp.paid_by] = exp.amount;
        }
      }

      // Each participant gets debited their split share
      Object.entries(exp.splits).forEach(([member, share]) => {
        if (balances[member] !== undefined) {
          balances[member] -= share;
        } else {
          balances[member] = -share;
        }
      });
    });

    // 2. Process Settlements
    const groupSettlementsList = settlements.filter((s) => s.group_id === groupId);
    groupSettlementsList.forEach((set) => {
      // Payer increases their balance (since they cleared debt)
      if (balances[set.from_member] !== undefined) {
        balances[set.from_member] += set.amount;
      }
      // Receiver decreases their balance (since they received money owed)
      if (balances[set.to_member] !== undefined) {
        balances[set.to_member] -= set.amount;
      }
    });

    return balances;
  }, [groups, expenses, settlements]);

  // Simplify Debts Algorithm (Greedy algorithm for minimum transfer count)
  const getSimplifiedDebts = useCallback((groupId: string): DebtTransfer[] => {
    const balances = getGroupMemberBalances(groupId);
    
    // Separate into debtors (negative balance) and creditors (positive balance)
    const debtors: { member: string; amount: number }[] = [];
    const creditors: { member: string; amount: number }[] = [];

    Object.entries(balances).forEach(([member, bal]) => {
      const rounded = Math.round(bal * 100) / 100;
      if (rounded < -0.01) {
        debtors.push({ member, amount: -rounded });
      } else if (rounded > 0.01) {
        creditors.push({ member, amount: rounded });
      }
    });

    const transfers: DebtTransfer[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const transferAmount = Math.min(debtor.amount, creditor.amount);
      if (transferAmount > 0.01) {
        transfers.push({
          from: debtor.member,
          to: creditor.member,
          amount: Math.round(transferAmount * 100) / 100,
        });
      }

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return transfers;
  }, [getGroupMemberBalances]);

  // Calculate Overall Net Balance for "You" across all groups
  const getOverallUserBalance = useCallback((): number => {
    let total = 0;
    groups.forEach((g) => {
      const balances = getGroupMemberBalances(g.id);
      if (balances["You"]) {
        total += balances["You"];
      }
    });
    return total;
  }, [groups, getGroupMemberBalances]);

  return {
    groups,
    expenses,
    settlements,
    loading,
    createGroup,
    deleteGroup,
    addMemberToGroup,
    addGroupExpense,
    deleteGroupExpense,
    addSettlement,
    getGroupMemberBalances,
    getSimplifiedDebts,
    getOverallUserBalance,
  };
};
