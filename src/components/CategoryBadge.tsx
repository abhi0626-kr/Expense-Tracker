interface CategoryBadgeProps {
  category: string;
}

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Food & Dining": "bg-orange-100 text-orange-800",
      "Transportation": "bg-blue-100 text-blue-800", 
      "Shopping": "bg-purple-100 text-purple-800",
      "Entertainment": "bg-pink-100 text-pink-800",
      "Bills & Utilities": "bg-red-100 text-red-800",
      "Healthcare": "bg-green-100 text-green-800",
      "Travel": "bg-indigo-100 text-indigo-800",
      "Education": "bg-yellow-100 text-yellow-800",
      "Salary": "bg-emerald-100 text-emerald-800",
      "Business": "bg-teal-100 text-teal-800",
      "Investment": "bg-cyan-100 text-cyan-800",
      "Transfer In": "bg-slate-100 text-slate-800",
      "Transfer Out": "bg-slate-100 text-slate-800",
      "Other": "bg-gray-100 text-gray-800"
    };
    
    return colors[category] || colors["Other"];
  };

  const isTransfer = category.toLowerCase().includes("transfer");
  const sizeClass = isTransfer ? "px-2 py-0.5" : "px-2 py-1";

  return (
    <span className={`inline-flex items-center ${sizeClass} rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
      {category}
    </span>
  );
};