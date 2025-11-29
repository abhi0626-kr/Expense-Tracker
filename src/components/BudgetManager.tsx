import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Target,
  Bell,
} from "lucide-react";
import { useBudgets, Budget } from "@/hooks/useBudgets";

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Rent",
  "EMI",
  "Subscriptions",
  "Travel",
  "Personal Care",
  "Groceries",
  "Other",
];

export const BudgetManager = () => {
  const {
    budgets,
    alerts,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    markAlertAsRead,
    markAllAlertsAsRead,
  } = useBudgets();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly" as "weekly" | "monthly" | "yearly",
    alert_threshold: 80,
  });

  const resetForm = () => {
    setFormData({
      category: "",
      amount: "",
      period: "monthly",
      alert_threshold: 80,
    });
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.amount) return;

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        amount: parseFloat(formData.amount),
        period: formData.period,
        alert_threshold: formData.alert_threshold,
      });
      setEditingBudget(null);
    } else {
      await addBudget({
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        alert_threshold: formData.alert_threshold,
      });
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (budget: Budget) => {
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      alert_threshold: budget.alert_threshold,
    });
    setEditingBudget(budget);
    setIsAddDialogOpen(true);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    if (percentage >= 60) return "bg-orange-400";
    return "bg-green-500";
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "exceeded":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case "trending":
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                Budget Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAlertsAsRead}>
                Dismiss All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 sm:px-6">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start sm:items-center justify-between gap-2 p-2 sm:p-3 bg-background rounded-lg border"
              >
                <div className="flex items-start sm:items-center gap-2">
                  {getAlertIcon(alert.alert_type)}
                  <span className="text-xs sm:text-sm">{alert.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={() => markAlertAsRead(alert.id)}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Budget Manager
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Set spending limits and track your progress
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto" onClick={() => { resetForm(); setEditingBudget(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBudget ? "Edit Budget" : "Create New Budget"}
                  </DialogTitle>
                  <DialogDescription>
                    Set a spending limit for a category
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                      disabled={!!editingBudget}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.filter(
                          (cat) =>
                            editingBudget?.category === cat ||
                            !budgets.find((b) => b.category === cat)
                        ).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value: "weekly" | "monthly" | "yearly") =>
                        setFormData({ ...formData, period: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Alert at ({formData.alert_threshold}%)</Label>
                    <Input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={formData.alert_threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alert_threshold: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingBudget ? "Update" : "Create"} Budget
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No budgets set yet</p>
              <p className="text-sm">Create a budget to start tracking your spending</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="p-3 sm:p-4 border rounded-lg space-y-3 bg-card/50"
                >
                  {/* Header: Category + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-sm sm:text-base">{budget.category}</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {budget.period}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleEdit(budget)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => deleteBudget(budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">
                        ₹{budget.spent.toLocaleString("en-IN")} / ₹{budget.amount.toLocaleString("en-IN")}
                      </span>
                      <span
                        className={`font-semibold ${
                          budget.percentage >= 100
                            ? "text-red-500"
                            : budget.percentage >= 80
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(budget.percentage, 100)}
                      className={`h-2 ${getProgressColor(budget.percentage)}`}
                    />
                  </div>
                  
                  {/* Exceeded Warning */}
                  {budget.percentage >= 100 && (
                    <p className="text-xs text-red-500 flex items-center gap-1 pt-1 border-t border-red-500/20">
                      <AlertCircle className="h-3 w-3" />
                      Exceeded by ₹{(budget.spent - budget.amount).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
