import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface RecurringTransaction {
  id: string;
  account_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  last_processed: string | null;
  is_active: boolean;
}

export const useRecurringTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateNextOccurrence = useCallback((current: string, frequency: RecurringTransaction["frequency"]) => {
    const date = new Date(current);
    if (Number.isNaN(date.getTime())) return current;

    switch (frequency) {
      case "daily":
        date.setDate(date.getDate() + 1);
        break;
      case "weekly":
        date.setDate(date.getDate() + 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        break;
    }

    return date.toISOString().split("T")[0];
  }, []);

  // Fetch recurring transactions
  const fetchRecurringTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("next_occurrence", { ascending: true });

      if (error) {
        console.log("Recurring transactions table not ready:", error.message);
        setRecurringTransactions([]);
        setLoading(false);
        return;
      }

      setRecurringTransactions(
        (data || []).map((rt: any) => ({
          id: rt.id,
          account_id: rt.account_id,
          type: rt.type,
          amount: parseFloat(rt.amount),
          category: rt.category,
          description: rt.description,
          frequency: rt.frequency,
          start_date: rt.start_date,
          end_date: rt.end_date,
          next_occurrence: rt.next_occurrence,
          last_processed: rt.last_processed,
          is_active: rt.is_active,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching recurring transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const processDueRecurringTransactions = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    try {
      const { data: dueTransactions, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .lte("next_occurrence", todayStr)
        .or(`end_date.is.null,end_date.gte.${todayStr}`);

      if (error) throw error;

      for (const rt of dueTransactions || []) {
        let currentDate = rt.next_occurrence || todayStr;

        while (currentDate && currentDate <= todayStr) {
          if (rt.end_date && currentDate > rt.end_date) {
            break;
          }

          const { data: accountRow, error: accountError } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", rt.account_id)
            .eq("user_id", user.id)
            .single();

          if (accountError) throw accountError;

          const amountChange = rt.type === "income" ? rt.amount : -rt.amount;
          const nextBalance = (parseFloat(accountRow?.balance as any) || 0) + amountChange;

          const { error: txError } = await supabase.from("transactions").insert({
            user_id: user.id,
            account_id: rt.account_id,
            type: rt.type,
            amount: rt.amount,
            category: rt.category,
            description: rt.description,
            date: currentDate,
            time: "00:00",
          });

          if (txError) throw txError;

          const { error: balanceError } = await supabase
            .from("accounts")
            .update({ balance: nextBalance })
            .eq("id", rt.account_id)
            .eq("user_id", user.id);

          if (balanceError) throw balanceError;

          const upcoming = calculateNextOccurrence(currentDate, rt.frequency as RecurringTransaction["frequency"]);
          currentDate = upcoming;

          const stopAfterNext = rt.end_date && upcoming > rt.end_date;

          const { error: updateError } = await supabase
            .from("recurring_transactions")
            .update({
              last_processed: todayStr,
              next_occurrence: upcoming,
              is_active: stopAfterNext ? false : rt.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rt.id)
            .eq("user_id", user.id);

          if (updateError) throw updateError;

          if (stopAfterNext) {
            break;
          }
        }
      }

      if ((dueTransactions || []).length > 0) {
        await fetchRecurringTransactions();
      }
    } catch (error: any) {
      console.error("Error processing recurring transactions:", error);
      toast({
        title: "Recurring processing failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [calculateNextOccurrence, fetchRecurringTransactions, toast, user]);

  // Add recurring transaction
  const addRecurringTransaction = async (
    transaction: Omit<RecurringTransaction, "id" | "last_processed" | "is_active">,
    options?: { suppressToast?: boolean; toastMessage?: string }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("recurring_transactions").insert({
        user_id: user.id,
        account_id: transaction.account_id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        frequency: transaction.frequency,
        start_date: transaction.start_date,
        end_date: transaction.end_date,
        next_occurrence: transaction.next_occurrence || transaction.start_date,
        is_active: true,
      });

      if (error) throw error;

      await fetchRecurringTransactions();
      if (!options?.suppressToast) {
        toast({
          title: "Recurring transaction created",
          description:
            options?.toastMessage || `${transaction.description} will be added ${transaction.frequency}.`,
        });
      }
      return true;
    } catch (error: any) {
      toast({
        title: "Error creating recurring transaction",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Update recurring transaction
  const updateRecurringTransaction = async (
    id: string,
    transaction: Partial<RecurringTransaction>
  ) => {
    if (!user) return;

    try {
      const payload: Record<string, any> = {
        account_id: transaction.account_id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        frequency: transaction.frequency,
        start_date: transaction.start_date,
        end_date: transaction.end_date,
        is_active: transaction.is_active,
        updated_at: new Date().toISOString(),
      };

      if (transaction.start_date) {
        // Keep next_occurrence in sync when start date changes
        payload.next_occurrence = transaction.next_occurrence || transaction.start_date;
      } else if (transaction.next_occurrence) {
        payload.next_occurrence = transaction.next_occurrence;
      }

      const { error } = await supabase
        .from("recurring_transactions")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchRecurringTransactions();
      toast({
        title: "Recurring transaction updated",
        description: "Your recurring transaction has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating recurring transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete recurring transaction
  const deleteRecurringTransaction = async (id: string) => {
    if (!user) return;

    try {
      // Get the transaction being deleted
      const { data: txToDelete, error: fetchError } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      // Check if this is a transfer (Transfer Out or Transfer In)
      const isTransfer = txToDelete.category === "Transfer Out" || txToDelete.category === "Transfer In";
      
      // Delete the main transaction
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // If it's a transfer, find and delete the paired transaction
      if (isTransfer) {
        const pairedCategory = txToDelete.category === "Transfer Out" ? "Transfer In" : "Transfer Out";
        const { data: pairedTx } = await supabase
          .from("recurring_transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("amount", txToDelete.amount)
          .eq("category", pairedCategory)
          .eq("frequency", txToDelete.frequency)
          .eq("start_date", txToDelete.start_date);

        if (pairedTx && pairedTx.length > 0) {
          await supabase
            .from("recurring_transactions")
            .delete()
            .eq("id", pairedTx[0].id)
            .eq("user_id", user.id);
        }
      }

      await fetchRecurringTransactions();
      toast({
        title: "Recurring transaction deleted",
        description: isTransfer ? "Both transfer transactions have been removed." : "Your recurring transaction has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting recurring transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Toggle active status
  const toggleRecurringTransaction = async (id: string, isActive: boolean) => {
    if (!user) return;

    try {
      // Get the transaction being toggled
      const { data: txToToggle, error: fetchError } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      // Check if this is a transfer
      const isTransfer = txToToggle.category === "Transfer Out" || txToToggle.category === "Transfer In";

      // Toggle the main transaction
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // If it's a transfer, find and toggle the paired transaction
      if (isTransfer) {
        const pairedCategory = txToToggle.category === "Transfer Out" ? "Transfer In" : "Transfer Out";
        const { data: pairedTx } = await supabase
          .from("recurring_transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("amount", txToToggle.amount)
          .eq("category", pairedCategory)
          .eq("frequency", txToToggle.frequency)
          .eq("start_date", txToToggle.start_date);

        if (pairedTx && pairedTx.length > 0) {
          await supabase
            .from("recurring_transactions")
            .update({ is_active: isActive })
            .eq("id", pairedTx[0].id)
            .eq("user_id", user.id);
        }
      }

      await fetchRecurringTransactions();
      toast({
        title: isActive ? "Recurring transaction activated" : "Recurring transaction paused",
        description: isActive
          ? (isTransfer ? "Both transfer transactions are now active." : "Your recurring transaction is now active.")
          : (isTransfer ? "Both transfer transactions have been paused." : "Your recurring transaction has been paused."),
      });
    } catch (error: any) {
      toast({
        title: "Error updating recurring transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      processDueRecurringTransactions();
      fetchRecurringTransactions();
    }
  }, [user, fetchRecurringTransactions, processDueRecurringTransactions]);

  return {
    recurringTransactions,
    loading,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processDueRecurringTransactions,
    refreshRecurringTransactions: fetchRecurringTransactions,
  };
};
