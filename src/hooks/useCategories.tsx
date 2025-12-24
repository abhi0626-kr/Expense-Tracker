import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
}

// Default categories to ensure they exist
const defaultCategories = {
  expense: [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Travel",
    "Education",
    "Other"
  ],
  income: [
    "Salary",
    "Business",
    "Investment",
    "Other"
  ]
};

export const useCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Load categories from localStorage
  const loadFromLocalStorage = () => {
    if (!user) return [];
    const stored = localStorage.getItem(`categories_${user.id}`);
    if (stored) {
      try {
        return JSON.parse(stored) as Category[];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Save categories to localStorage
  const saveToLocalStorage = (cats: Category[]) => {
    if (!user) return;
    localStorage.setItem(`categories_${user.id}`, JSON.stringify(cats));
  };

  // Initialize default categories
  const initializeDefaultCategories = (): Category[] => {
    if (!user) return [];
    
    const allDefaults: Category[] = [
      ...defaultCategories.expense.map(name => ({
        id: `default-expense-${name.toLowerCase().replace(/\s+/g, '-')}`,
        user_id: user.id,
        name,
        type: "expense" as const,
        created_at: new Date().toISOString()
      })),
      ...defaultCategories.income.map(name => ({
        id: `default-income-${name.toLowerCase().replace(/\s+/g, '-')}`,
        user_id: user.id,
        name,
        type: "income" as const,
        created_at: new Date().toISOString()
      }))
    ];
    return allDefaults;
  };

  // Fetch categories
  const fetchCategories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("categories" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) {
        // If table doesn't exist, use localStorage fallback
        console.warn("Categories table not found, using localStorage:", error.message);
        setUseLocalStorage(true);
        
        let localCategories = loadFromLocalStorage();
        if (localCategories.length === 0) {
          localCategories = initializeDefaultCategories();
          saveToLocalStorage(localCategories);
        }
        setCategories(localCategories);
        setLoading(false);
        return;
      }

      const dbCategories = (data as unknown as Category[]) || [];
      
      // If no categories exist in DB, create defaults
      if (dbCategories.length === 0) {
        await createDefaultCategories();
      } else {
        setCategories(dbCategories);
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      // Fallback to localStorage
      setUseLocalStorage(true);
      let localCategories = loadFromLocalStorage();
      if (localCategories.length === 0) {
        localCategories = initializeDefaultCategories();
        saveToLocalStorage(localCategories);
      }
      setCategories(localCategories);
    } finally {
      setLoading(false);
    }
  };

  // Create default categories for new users
  const createDefaultCategories = async () => {
    if (!user) return;

    try {
      const allDefaults = [
        ...defaultCategories.expense.map(name => ({ name, type: "expense" as const })),
        ...defaultCategories.income.map(name => ({ name, type: "income" as const }))
      ];

      const categoriesToInsert = allDefaults.map(cat => ({
        user_id: user.id,
        name: cat.name,
        type: cat.type
      }));

      const { error } = await supabase
        .from("categories" as any)
        .insert(categoriesToInsert);

      if (error && !error.message.includes("duplicate key")) {
        throw error;
      }

      // Fetch categories after creating defaults
      await fetchCategories();
    } catch (error: any) {
      console.error("Error creating default categories:", error);
    }
  };

  // Add a new category
  const addCategory = async (name: string, type: "income" | "expense") => {
    if (!user) return false;

    try {
      // Check if category already exists
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
      );

      if (existingCategory) {
        toast({
          title: "Category exists",
          description: "This category already exists",
          variant: "default",
        });
        return true; // Return true since the category exists
      }

      if (useLocalStorage) {
        // Add to localStorage
        const newCategory: Category = {
          id: `custom-${type}-${Date.now()}`,
          user_id: user.id,
          name: name.trim(),
          type,
          created_at: new Date().toISOString()
        };
        
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        saveToLocalStorage(updatedCategories);
        
        toast({
          title: "Category added",
          description: `"${name}" has been added to your categories`,
          variant: "default",
        });
        return true;
      }

      // Try to add to database
      const { data, error } = await supabase
        .from("categories" as any)
        .insert({
          user_id: user.id,
          name: name.trim(),
          type: type
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("duplicate key")) {
          toast({
            title: "Category exists",
            description: "This category already exists",
            variant: "default",
          });
          return true;
        }
        throw error;
      }

      setCategories([...categories, data as unknown as Category]);
      
      toast({
        title: "Category added",
        description: `"${name}" has been added to your categories`,
        variant: "default",
      });

      return true;
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast({
        title: "Error adding category",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a category
  const deleteCategory = async (id: string) => {
    if (!user) return false;

    try {
      if (useLocalStorage) {
        // Delete from localStorage
        const updatedCategories = categories.filter(cat => cat.id !== id);
        setCategories(updatedCategories);
        saveToLocalStorage(updatedCategories);
        
        toast({
          title: "Category deleted",
          description: "Category has been removed",
          variant: "default",
        });
        return true;
      }

      const { error } = await supabase
        .from("categories" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCategories(categories.filter(cat => cat.id !== id));
      
      toast({
        title: "Category deleted",
        description: "Category has been removed",
        variant: "default",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Get categories by type
  const getCategoriesByType = (type: "income" | "expense") => {
    return categories
      .filter(cat => cat.type === type)
      .map(cat => cat.name)
      .sort();
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
    getCategoriesByType,
    fetchCategories
  };
};
