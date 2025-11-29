import { useState, useEffect, useRef } from "react";
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
  type: "income" | "expense" | "transfer";
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
  const defaultAccountsCreated = useRef(false);

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
        type: transaction.type as "income" | "expense" | "transfer",
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
      // Check if accounts already exist to avoid duplicates
      const { data: existingAccounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id);

      if (existingAccounts && existingAccounts.length > 0) {
        // Accounts already exist, just fetch them
        await fetchAccounts();
        return;
      }

      // Insert default accounts
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
      const { data: newTransaction, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: transaction.account_id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date
        })
        .select()
        .single();

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

      // Sync to Google Sheets in the background
      if (newTransaction) {
        supabase.functions.invoke("sync-to-sheets", {
          body: { transaction: newTransaction }
        }).catch(error => {
          console.error("Failed to sync to Google Sheets:", error);
        });
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
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete transactions.",
        variant: "destructive",
      });
      return;
    }

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
      toast({
        title: "Transaction not found",
        description: "The transaction you're trying to delete doesn't exist.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, delete the transaction
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }

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
          .eq("id", transaction.account_id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Balance update error:", updateError);
          throw updateError;
        }
      }

      // Refetch data
      await Promise.all([fetchTransactions(), fetchAccounts()]);
      
      toast({
        title: "Transaction deleted",
        description: "Your transaction has been successfully removed.",
      });
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error deleting transaction",
        description: error.message || "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update account
  const updateAccount = async (accountId: string, updatedAccount: Omit<Account, "id">) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update accounts.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!updatedAccount.name || !updatedAccount.type) {
      toast({
        title: "Validation error",
        description: "Account name and type are required.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(updatedAccount.balance) || updatedAccount.balance < 0) {
      toast({
        title: "Validation error",
        description: "Please enter a valid balance amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          name: updatedAccount.name,
          type: updatedAccount.type,
          color: updatedAccount.color,
          balance: updatedAccount.balance
        })
        .eq("id", accountId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      // Optimistically update local state for immediate UI refresh
      setAccounts(prev => prev.map(a =>
        a.id === accountId
          ? { ...a, ...updatedAccount }
          : a
      ));

      // Also refetch from server to stay in sync
      await fetchAccounts();
      
      toast({
        title: "Account updated",
        description: "Your account has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast({
        title: "Error updating account",
        description: error.message || "Failed to update account. Please try again.",
        variant: "destructive",
      });
      // Refetch to reset state if update failed
      await fetchAccounts();
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
    if (user && accounts.length === 0 && !loading && !defaultAccountsCreated.current) {
      defaultAccountsCreated.current = true;
      createDefaultAccounts();
    }
  }, [user, accounts.length, loading]);

  // Transfer funds between accounts
  const transferFunds = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string
  ) => {
    if (!user) return;

    try {
      // Get both accounts
      const fromAccount = accounts.find(a => a.id === fromAccountId);
      const toAccount = accounts.find(a => a.id === toAccountId);

      if (!fromAccount || !toAccount) {
        throw new Error("Invalid accounts");
      }

      if (fromAccount.balance < amount) {
        throw new Error("Insufficient funds in source account");
      }

      // Update from account (deduct)
      const { error: fromError } = await supabase
        .from("accounts")
        .update({ balance: fromAccount.balance - amount })
        .eq("id", fromAccountId);

      if (fromError) throw fromError;

      // Update to account (add)
      const { error: toError } = await supabase
        .from("accounts")
        .update({ balance: toAccount.balance + amount })
        .eq("id", toAccountId);

      if (toError) throw toError;

      // Create transfer out transaction
      const { data: transOut, error: transOutError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: fromAccountId,
          type: "transfer",
          amount: -amount,
          category: "Transfer Out",
          description: description || `Transfer to ${toAccount.name}`,
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (transOutError) throw transOutError;

      // Create transfer in transaction
      const { data: transIn, error: transInError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: toAccountId,
          type: "transfer",
          amount: amount,
          category: "Transfer In",
          description: description || `Transfer from ${fromAccount.name}`,
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (transInError) throw transInError;

      // Sync both transactions to Google Sheets
      if (transOut) {
        supabase.functions.invoke("sync-to-sheets", {
          body: { transaction: transOut }
        }).catch(error => console.error("Failed to sync transfer out:", error));
      }
      if (transIn) {
        supabase.functions.invoke("sync-to-sheets", {
          body: { transaction: transIn }
        }).catch(error => console.error("Failed to sync transfer in:", error));
      }

      await fetchAccounts();
      await fetchTransactions();

      toast({
        title: "Transfer successful",
        description: `₹${amount.toFixed(2)} transferred from ${fromAccount.name} to ${toAccount.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add new account
  const addAccount = async (account: Omit<Account, "id">) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          name: account.name,
          type: account.type,
          balance: account.balance,
          color: account.color,
        });

      if (error) throw error;

      await fetchAccounts();

      toast({
        title: "Account created",
        description: `${account.name} has been added successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete account
  const deleteAccount = async (accountId: string) => {
    if (!user) return;

    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    // Check if account has transactions
    const accountTransactions = transactions.filter(t => t.account_id === accountId);
    if (accountTransactions.length > 0) {
      toast({
        title: "Cannot delete account",
        description: "This account has transactions. Delete or move transactions first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchAccounts();

      toast({
        title: "Account deleted",
        description: `${account.name} has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Remove duplicate accounts (keeps ones with transactions or highest balance)
  const removeDuplicateAccounts = async () => {
    if (!user) return;

    try {
      // Group accounts by name
      const accountsByName: { [key: string]: Account[] } = {};
      accounts.forEach((acc) => {
        const key = acc.name.toLowerCase().trim();
        if (!accountsByName[key]) {
          accountsByName[key] = [];
        }
        accountsByName[key].push(acc);
      });

      const accountsToDelete: string[] = [];

      // For each group of duplicates, keep the one with highest balance or transactions
      for (const name in accountsByName) {
        const group = accountsByName[name];
        if (group.length > 1) {
          // Sort by balance descending, keep the first one
          group.sort((a, b) => b.balance - a.balance);
          
          // Check which accounts have transactions
          const accountsWithTx: string[] = [];
          for (const acc of group) {
            const hasTx = transactions.some((t) => t.account_id === acc.id);
            if (hasTx) {
              accountsWithTx.push(acc.id);
            }
          }

          // Keep the account with transactions, or the one with highest balance
          let keepId: string;
          if (accountsWithTx.length > 0) {
            // Find the one with highest balance among those with transactions
            const withTx = group.filter((a) => accountsWithTx.includes(a.id));
            withTx.sort((a, b) => b.balance - a.balance);
            keepId = withTx[0].id;
          } else {
            keepId = group[0].id; // Highest balance
          }

          // Mark others for deletion
          group.forEach((acc) => {
            if (acc.id !== keepId) {
              // Only delete if no transactions
              const hasTx = transactions.some((t) => t.account_id === acc.id);
              if (!hasTx) {
                accountsToDelete.push(acc.id);
              }
            }
          });
        }
      }

      if (accountsToDelete.length === 0) {
        toast({
          title: "No duplicates found",
          description: "All accounts are unique or have transactions.",
        });
        return;
      }

      // Delete duplicate accounts
      const { error } = await supabase
        .from("accounts")
        .delete()
        .in("id", accountsToDelete)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchAccounts();

      toast({
        title: "Duplicates removed",
        description: `${accountsToDelete.length} duplicate account(s) have been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error removing duplicates",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    accounts,
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    updateAccount,
    addAccount,
    deleteAccount,
    removeDuplicateAccounts,
    transferFunds,
    refetch: () => {
      fetchAccounts();
      fetchTransactions();
    }
  };
};