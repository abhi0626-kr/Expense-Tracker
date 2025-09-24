import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

export const useExpenseData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch accounts
  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setAccounts(data.map(account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance ? parseFloat(account.balance.toString()) : 0,
        color: account.color
      })));
    } catch (error: any) {
      toast({
        title: "Error fetching accounts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      setTransactions(data.map(transaction => ({
        id: transaction.id,
        account_id: transaction.account_id,
        type: transaction.type as "income" | "expense",
        amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date
      })));
    } catch (error: any) {
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Create default accounts for new users
  const createDefaultAccounts = async () => {
    if (!user) return;

    const defaultAccounts = [
      {
        user_id: user.id,
        name: "Main Checking",
        type: "Checking",
        balance: 0,
        color: "from-blue-500 to-blue-600"
      },
      {
        user_id: user.id,
        name: "Savings Account",
        type: "Savings",
        balance: 0,
        color: "from-green-500 to-green-600"
      },
      {
        user_id: user.id,
        name: "Credit Card",
        type: "Credit",
        balance: 0,
        color: "from-purple-500 to-purple-600"
      }
    ];

    try {
      const { error } = await supabase
        .from("accounts")
        .insert(defaultAccounts);

      if (error) throw error;

      await fetchAccounts();
      toast({
        title: "Welcome!",
        description: "Default accounts have been created for you.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating default accounts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add transaction
  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: transaction.account_id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date
        });

      if (error) throw error;

      // Update account balance
      const account = accounts.find(a => a.id === transaction.account_id);
      if (account) {
        const balanceChange = transaction.type === "income" 
          ? transaction.amount 
          : -transaction.amount;
        
        const newBalance = account.balance + balanceChange;
        
        const { error: updateError } = await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", transaction.account_id);

        if (updateError) throw updateError;
      }

      await fetchTransactions();
      await fetchAccounts();
      
      toast({
        title: "Transaction added",
        description: "Your transaction has been successfully recorded.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete transaction
  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;

      // Revert account balance
      const account = accounts.find(a => a.id === transaction.account_id);
      if (account) {
        const balanceChange = transaction.type === "income" 
          ? -transaction.amount 
          : transaction.amount;
        
        const newBalance = account.balance + balanceChange;
        
        const { error: updateError } = await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", transaction.account_id);

        if (updateError) throw updateError;
      }

      await fetchTransactions();
      await fetchAccounts();
      
      toast({
        title: "Transaction deleted",
        description: "Your transaction has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update account
  const updateAccount = async (accountId: string, updatedAccount: Omit<Account, "id" | "balance">) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          name: updatedAccount.name,
          type: updatedAccount.type,
          color: updatedAccount.color
        })
        .eq("id", accountId);

      if (error) throw error;

      await fetchAccounts();
      
      toast({
        title: "Account updated",
        description: "Your account has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchAccounts(), fetchTransactions()]).then(() => {
        setLoading(false);
      });
    } else {
      setAccounts([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  // Create default accounts if none exist
  useEffect(() => {
    if (user && accounts.length === 0 && !loading) {
      createDefaultAccounts();
    }
  }, [user, accounts.length, loading]);

  return {
    accounts,
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    updateAccount,
    refetch: () => {
      fetchAccounts();
      fetchTransactions();
    }
  };
};