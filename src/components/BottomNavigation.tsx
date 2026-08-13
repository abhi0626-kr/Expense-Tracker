import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileSpreadsheet, Plus, BarChart3, SlidersHorizontal } from "lucide-react";

interface BottomNavigationProps {
  onAddClick?: () => void;
}

export const BottomNavigation = ({ onAddClick }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      navigate("/?add=true");
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] px-3 pb-3 pt-2">
      <div className="flex items-end justify-between rounded-[28px] border border-border bg-card/95 px-2 py-2 text-card-foreground shadow-2xl dark:border-white/10 dark:bg-slate-950/95 dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all ${
            isActive("/") ? "text-primary dark:text-violet-300 font-semibold" : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </button>

        {/* Transactions / History */}
        <button
          type="button"
          onClick={() => navigate("/transactions")}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all ${
            isActive("/transactions") ? "text-primary dark:text-violet-300 font-semibold" : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FileSpreadsheet className="h-5 w-5" />
          <span>History</span>
        </button>

        {/* Center + Add Button */}
        <button
          type="button"
          onClick={handleAddClick}
          className="-mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-cyan-500 to-emerald-400 text-white shadow-[0_18px_50px_rgba(124,58,237,0.45)] hover:scale-105 active:scale-95 transition-all"
          title="Add Transaction"
        >
          <Plus className="h-7 w-7 text-white stroke-[2.5]" />
        </button>

        {/* Reports */}
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all ${
            isActive("/reports") ? "text-primary dark:text-violet-300 font-semibold" : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Reports</span>
        </button>

        {/* More / Advanced Features */}
        <button
          type="button"
          onClick={() => navigate("/features")}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all ${
            isActive("/features") || isActive("/profile") ? "text-primary dark:text-violet-300 font-semibold" : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
};
