import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Investment {
  id: string;
  user_id: string;
  platform: string;
  investment_type: string;
  name: string;
  amount: number;
  current_value: number;
  purchase_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useInvestments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvestments();
    } else {
      setInvestments([]);
      setLoading(false);
    }
  }, [user]);

  const fetchInvestments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (error) throw error;

      setInvestments(data || []);
    } catch (error: any) {
      console.error("Error fetching investments:", error);
      toast({
        title: "Error loading investments",
        description: error.message || "Failed to load your investments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addInvestment = async (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add investments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("investments")
        .insert([
          {
            ...investment,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchInvestments();
      
      toast({
        title: "Investment added",
        description: `${investment.name} has been added to your portfolio.`,
      });

      return data;
    } catch (error: any) {
      console.error("Error adding investment:", error);
      toast({
        title: "Error adding investment",
        description: error.message || "Failed to add investment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update investments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("investments")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchInvestments();
      
      toast({
        title: "Investment updated",
        description: "Your investment has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating investment:", error);
      toast({
        title: "Error updating investment",
        description: error.message || "Failed to update investment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete investments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchInvestments();
      
      toast({
        title: "Investment deleted",
        description: "Your investment has been successfully removed.",
      });
    } catch (error: any) {
      console.error("Error deleting investment:", error);
      toast({
        title: "Error deleting investment",
        description: error.message || "Failed to delete investment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTotalInvested = () => {
    return investments.reduce((sum, inv) => sum + inv.amount, 0);
  };

  const getTotalCurrentValue = () => {
    return investments.reduce((sum, inv) => sum + inv.current_value, 0);
  };

  const getTotalReturns = () => {
    const invested = getTotalInvested();
    const current = getTotalCurrentValue();
    return current - invested;
  };

  const getReturnsPercentage = () => {
    const invested = getTotalInvested();
    const returns = getTotalReturns();
    return invested > 0 ? (returns / invested) * 100 : 0;
  };

  return {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getTotalInvested,
    getTotalCurrentValue,
    getTotalReturns,
    getReturnsPercentage,
    refreshInvestments: fetchInvestments,
  };
};
