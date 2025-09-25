import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account } from "@/hooks/useExpenseData";
import { XIcon } from "lucide-react";

interface EditAccountProps {
  account: Account;
  onUpdateAccount: (accountId: string, updatedAccount: Omit<Account, "id">) => void;
  onClose: () => void;
}

export const EditAccount = ({ account, onUpdateAccount, onClose }: EditAccountProps) => {
  const [formData, setFormData] = useState({
    name: account.name,
    type: account.type,
    balance: account.balance.toString(),
    color: account.color
  });

  const accountTypes = [
    "Checking",
    "Savings", 
    "Credit",
    "Investment",
    "Cash"
  ];

  const colorOptions = [
    { label: "Blue", value: "from-blue-500 to-blue-600" },
    { label: "Green", value: "from-green-500 to-green-600" },
    { label: "Purple", value: "from-purple-500 to-purple-600" },
    { label: "Red", value: "from-red-500 to-red-600" },
    { label: "Orange", value: "from-orange-500 to-orange-600" },
    { label: "Pink", value: "from-pink-500 to-pink-600" },
    { label: "Indigo", value: "from-indigo-500 to-indigo-600" },
    { label: "Teal", value: "from-teal-500 to-teal-600" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.balance) {
      return;
    }

    onUpdateAccount(account.id, {
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance),
      color: formData.color
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-card shadow-financial">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">
            Edit Account
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
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                type="text"
                placeholder="Account name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Card Color</Label>
              <Select 
                value={formData.color} 
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${color.value}`} />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 border-muted-foreground text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground shadow-financial"
                disabled={!formData.name || !formData.type || !formData.balance}
              >
                Update Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};