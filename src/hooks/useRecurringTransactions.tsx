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

  // Add recurring transaction
  const addRecurringTransaction = async (
    transaction: Omit<RecurringTransaction, "id" | "last_processed" | "is_active">
  ) => {
    if (!user) return;

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
      toast({
        title: "Recurring transaction created",
        description: `${transaction.description} will be added ${transaction.frequency}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating recurring transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update recurring transaction
  const updateRecurringTransaction = async (
    id: string,
    transaction: Partial<RecurringTransaction>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({
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
        })
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
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchRecurringTransactions();
      toast({
        title: "Recurring transaction deleted",
        description: "Your recurring transaction has been removed.",
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
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchRecurringTransactions();
      toast({
        title: isActive ? "Recurring transaction activated" : "Recurring transaction paused",
        description: isActive
          ? "Your recurring transaction is now active."
          : "Your recurring transaction has been paused.",
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
      fetchRecurringTransactions();
    }
  }, [user, fetchRecurringTransactions]);

  return {
    recurringTransactions,
    loading,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    refreshRecurringTransactions: fetchRecurringTransactions,
  };
};
