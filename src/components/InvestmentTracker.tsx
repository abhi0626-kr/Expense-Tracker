import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInvestments, Investment } from "@/hooks/useInvestments";
import { InvestmentCard } from "./InvestmentCard";
import { AddInvestment } from "./AddInvestment";
import { PlusIcon, TrendingUpIcon } from "lucide-react";

export const InvestmentTracker = () => {
  const {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getTotalInvested,
    getTotalCurrentValue,
    getTotalReturns,
    getReturnsPercentage,
  } = useInvestments();

  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const handleAddInvestment = async (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => {
    await addInvestment(investment);
    setShowAddInvestment(false);
  };

  const handleUpdateInvestment = async (id: string, updates: Partial<Investment>) => {
    await updateInvestment(id, updates);
    setEditingInvestment(null);
  };

  const handleEditClick = (investment: Investment) => {
    setEditingInvestment(investment);
    setShowAddInvestment(true);
  };

  const handleClose = () => {
    setShowAddInvestment(false);
    setEditingInvestment(null);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-card-shadow">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading investments...</div>
        </CardContent>
      </Card>
    );
  }

  const totalInvested = getTotalInvested();
  const totalCurrentValue = getTotalCurrentValue();
  const totalReturns = getTotalReturns();
  const returnsPercentage = getReturnsPercentage();
  const isPositive = totalReturns >= 0;

  return (
    <>
      <Card className="bg-gradient-card shadow-card-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-primary" />
            Investment Portfolio
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddInvestment(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Investment
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Cards */}
          {investments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Returns</p>
                <p className={`text-2xl font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? "+" : ""}₹{Math.abs(totalReturns).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
                  {returnsPercentage > 0 ? "+" : ""}{returnsPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {/* Investment List */}
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📈</div>
              <p className="text-muted-foreground mb-4">No investments tracked yet</p>
              <Button
                onClick={() => setShowAddInvestment(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Your First Investment
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investments.map((investment) => (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  onEdit={handleEditClick}
                  onDelete={deleteInvestment}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddInvestment && (
        <AddInvestment
          onAddInvestment={handleAddInvestment}
          onClose={handleClose}
          editingInvestment={editingInvestment}
          onUpdateInvestment={handleUpdateInvestment}
        />
      )}
    </>
  );
};
