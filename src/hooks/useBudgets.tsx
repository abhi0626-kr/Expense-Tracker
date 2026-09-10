import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Budget {
  id: string;
  category: string;
  account_id?: string | null;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  alert_threshold: number;
  spent: number;
  percentage: number;
}

export interface BudgetAlert {
  id: string;
  budget_id: string;
  alert_type: "warning" | "exceeded" | "trending";
  percentage_used: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

const LOCAL_ACCOUNT_MAP_KEY = "expense-tracker:budget-account-map";

const getLocalBudgetAccountMap = (): Record<string, string> => {
  try {
    const saved = localStorage.getItem(LOCAL_ACCOUNT_MAP_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveLocalBudgetAccount = (budgetId: string, accountId: string) => {
  try {
    const map = getLocalBudgetAccountMap();
    map[budgetId] = accountId;
    localStorage.setItem(LOCAL_ACCOUNT_MAP_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Error saving local budget account map:", e);
  }
};

const removeLocalBudgetAccount = (budgetId: string) => {
  try {
    const map = getLocalBudgetAccountMap();
    delete map[budgetId];
    localStorage.setItem(LOCAL_ACCOUNT_MAP_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Error removing local budget account map:", e);
  }
};

export const useBudgets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch budgets with spending data
  const fetchBudgets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const localAccountMap = getLocalBudgetAccountMap();

      // Get budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (budgetError) {
        console.log("Budgets table not ready:", budgetError.message);
        setBudgets([]);
        setLoading(false);
        return;
      }

      // Get transactions for current period to calculate spending
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("category, amount, date, type, account_id")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startOfYear.toISOString().split("T")[0]);

      if (txError) throw txError;

      // Calculate spending per budget (filtered by category and account_id)
      const budgetsWithSpending = (budgetData || []).map((budget: any) => {
        let periodStart: Date;
        switch (budget.period) {
          case "weekly":
            periodStart = startOfWeek;
            break;
          case "yearly":
            periodStart = startOfYear;
            break;
          default:
            periodStart = startOfMonth;
        }

        const effectiveAccountId = budget.account_id || localAccountMap[budget.id] || "all";

        const spent = (transactions || [])
          .filter((t: any) => {
            if (new Date(t.date) < periodStart) return false;

            // Category filter check (unless "All Categories")
            if (
              budget.category &&
              budget.category !== "All Categories" &&
              budget.category !== "all" &&
              t.category !== budget.category
            ) {
              return false;
            }

            // Account filter check (unless "all")
            if (
              effectiveAccountId &&
              effectiveAccountId !== "all" &&
              effectiveAccountId !== "All Accounts" &&
              t.account_id !== effectiveAccountId
            ) {
              return false;
            }

            return true;
          })
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          id: budget.id,
          category: budget.category || "All Categories",
          account_id: effectiveAccountId,
          amount: parseFloat(budget.amount),
          period: budget.period,
          alert_threshold: budget.alert_threshold,
          spent,
          percentage,
        };
      });

      setBudgets(budgetsWithSpending);

      // Check for alerts
      await checkBudgetAlerts(budgetsWithSpending);
    } catch (error: any) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check and create budget alerts
  const checkBudgetAlerts = async (budgetList: Budget[]) => {
    if (!user) return;

    const newAlerts: BudgetAlert[] = [];
    
    for (const budget of budgetList) {
      let alertType: "warning" | "exceeded" | "trending" | null = null;
      let message = "";
      const label = budget.category === "All Categories" ? "overall" : budget.category;

      if (budget.percentage >= 100) {
        alertType = "exceeded";
        message = `You've exceeded your ${label} budget! Spent ₹${budget.spent.toLocaleString("en-IN")} of ₹${budget.amount.toLocaleString("en-IN")}`;
      } else if (budget.percentage >= budget.alert_threshold) {
        alertType = "warning";
        message = `You've spent ${budget.percentage.toFixed(0)}% of your ${label} budget`;
      } else if (budget.percentage >= 60) {
        const daysInPeriod = budget.period === "weekly" ? 7 : budget.period === "monthly" ? 30 : 365;
        const now = new Date();
        const dayOfPeriod = budget.period === "weekly" 
          ? now.getDay() 
          : budget.period === "monthly" 
            ? now.getDate() 
            : Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        
        const expectedPercentage = (dayOfPeriod / daysInPeriod) * 100;
        if (budget.percentage > expectedPercentage + 20) {
          alertType = "trending";
          message = `You're trending higher this ${budget.period}. ${label} spending is above average.`;
        }
      }

      if (alertType) {
        newAlerts.push({
          id: `${budget.id}-${alertType}`,
          budget_id: budget.id,
          alert_type: alertType,
          percentage_used: budget.percentage,
          message,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    setAlerts(newAlerts);
  };

  // Add budget
  const addBudget = async (budget: Omit<Budget, "id" | "spent" | "percentage">) => {
    if (!user) return;

    try {
      const payload: any = {
        user_id: user.id,
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        alert_threshold: budget.alert_threshold,
      };

      if (budget.account_id && budget.account_id !== "all") {
        payload.account_id = budget.account_id;
      }

      let insertedId: string | null = null;

      const { data: insertedData, error } = await supabase
        .from("budgets")
        .insert(payload)
        .select("id")
        .maybeSingle();

      if (error) {
        if (error.message?.includes("account_id")) {
          delete payload.account_id;
          const { data: retryData, error: retryError } = await supabase
            .from("budgets")
            .insert(payload)
            .select("id")
            .single();
          if (retryError) throw retryError;
          if (retryData) insertedId = retryData.id;
        } else {
          throw error;
        }
      } else if (insertedData) {
        insertedId = insertedData.id;
      }

      if (insertedId && budget.account_id) {
        saveLocalBudgetAccount(insertedId, budget.account_id);
      }

      await fetchBudgets();
      toast({
        title: "Budget created",
        description: `Budget for ${budget.category} has been set.`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating budget",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update budget
  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    if (!user) return;

    try {
      const updatePayload: any = {
        amount: budget.amount,
        period: budget.period,
        alert_threshold: budget.alert_threshold,
      };
      if (budget.category) {
        updatePayload.category = budget.category;
      }
      if (budget.account_id !== undefined) {
        updatePayload.account_id = budget.account_id === "all" ? null : budget.account_id;
      }

      const { error } = await supabase
        .from("budgets")
        .update(updatePayload)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error && error.message?.includes("account_id")) {
        delete updatePayload.account_id;
        const { error: retryError } = await supabase
          .from("budgets")
          .update(updatePayload)
          .eq("id", id)
          .eq("user_id", user.id);
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }

      if (budget.account_id !== undefined) {
        saveLocalBudgetAccount(id, budget.account_id || "all");
      }

      await fetchBudgets();
      toast({
        title: "Budget updated",
        description: "Your budget has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating budget",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete budget
  const deleteBudget = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      removeLocalBudgetAccount(id);
      await fetchBudgets();
      toast({
        title: "Budget deleted",
        description: "Your budget has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting budget",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Mark alert as read
  const markAlertAsRead = async (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Mark all alerts as read
  const markAllAlertsAsRead = async () => {
    setAlerts([]);
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user, fetchBudgets]);

  return {
    budgets,
    alerts,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    markAlertAsRead,
    markAllAlertsAsRead,
    refreshBudgets: fetchBudgets,
  };
};
