import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Investment } from "@/hooks/useInvestments";
import { XIcon } from "lucide-react";

interface AddInvestmentProps {
  onAddInvestment: (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
  editingInvestment?: Investment | null;
  onUpdateInvestment?: (id: string, updates: Partial<Investment>) => void;
}

export const AddInvestment = ({ onAddInvestment, onClose, editingInvestment, onUpdateInvestment }: AddInvestmentProps) => {
  const [formData, setFormData] = useState({
    platform: editingInvestment?.platform || "",
    investment_type: editingInvestment?.investment_type || "",
    name: editingInvestment?.name || "",
    amount: editingInvestment?.amount?.toString() || "",
    current_value: editingInvestment?.current_value?.toString() || "",
    purchase_date: editingInvestment?.purchase_date || new Date().toISOString().split('T')[0],
    notes: editingInvestment?.notes || ""
  });

  const platforms = [
    "GPay",
    "PhonePe",
    "Zerodha",
    "Groww",
    "Upstox",
    "Paytm Money",
    "ET Money",
    "Kuvera",
    "Other"
  ];

  const investmentTypes = [
    "Mutual Funds",
    "Stocks",
    "Fixed Deposit",
    "Gold",
    "Real Estate",
    "Crypto",
    "PPF",
    "NPS",
    "Other"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.investment_type || !formData.name || 
        !formData.amount || !formData.current_value || !formData.purchase_date) {
      return;
    }

    const investmentData = {
      platform: formData.platform,
      investment_type: formData.investment_type,
      name: formData.name,
      amount: parseFloat(formData.amount),
      current_value: parseFloat(formData.current_value),
      purchase_date: formData.purchase_date,
      notes: formData.notes || undefined
    };

    if (editingInvestment && onUpdateInvestment) {
      onUpdateInvestment(editingInvestment.id, investmentData);
    } else {
      onAddInvestment(investmentData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-card shadow-financial max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">
            {editingInvestment ? "Edit Investment" : "Add Investment"}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select 
                  value={formData.platform} 
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investment_type">Investment Type</Label>
                <Select 
                  value={formData.investment_type} 
                  onValueChange={(value) => setFormData({ ...formData, investment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Investment Name</Label>
              <Input
                type="text"
                placeholder="e.g., HDFC Balanced Advantage Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Invested Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_value">Current Value (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="12000.00"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!formData.platform || !formData.investment_type || !formData.name || 
                         !formData.amount || !formData.current_value || !formData.purchase_date}
              >
                {editingInvestment ? "Update Investment" : "Add Investment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
