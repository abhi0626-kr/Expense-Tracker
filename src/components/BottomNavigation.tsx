import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileSpreadsheet, Plus, BarChart3, SlidersHorizontal } from "lucide-react";

interface BottomNavigationProps {
  onAddClick?: () => void;
  onTransferClick?: () => void;
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

  const isMoreActive = location.pathname === "/features" || location.pathname === "/profile";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[390px] px-3 pb-3 pt-1 pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-around rounded-full border border-border/70 bg-card/90 px-2 py-1.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className={`group flex min-w-0 flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isActive("/")
              ? "text-primary dark:text-violet-300 font-semibold"
              : "text-muted-foreground/75 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
            {isActive("/") && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary dark:bg-violet-400" />
            )}
          </div>
          <span className="mt-1 text-[10px] tracking-tight leading-none">Home</span>
        </button>

        {/* History */}
        <button
          type="button"
          onClick={() => navigate("/transactions")}
          className={`group flex min-w-0 flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isActive("/transactions")
              ? "text-primary dark:text-violet-300 font-semibold"
              : "text-muted-foreground/75 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <FileSpreadsheet className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
            {isActive("/transactions") && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary dark:bg-violet-400" />
            )}
          </div>
          <span className="mt-1 text-[10px] tracking-tight leading-none">History</span>
        </button>

        {/* Center + Add Button */}
        <div className="flex shrink-0 items-center justify-center px-1.5">
          <button
            type="button"
            onClick={handleAddClick}
            className="-mt-2.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 text-white shadow-[0_4px_16px_rgba(124,58,237,0.4)] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_6px_20px_rgba(124,58,237,0.55)]"
            title="Add Transaction"
            aria-label="Add Transaction"
          >
            <Plus className="h-5 w-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Reports */}
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className={`group flex min-w-0 flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isActive("/reports")
              ? "text-primary dark:text-violet-300 font-semibold"
              : "text-muted-foreground/75 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <BarChart3 className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
            {isActive("/reports") && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary dark:bg-violet-400" />
            )}
          </div>
          <span className="mt-1 text-[10px] tracking-tight leading-none">Reports</span>
        </button>

        {/* More */}
        <button
          type="button"
          onClick={() => navigate("/features")}
          className={`group flex min-w-0 flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            isMoreActive
              ? "text-primary dark:text-violet-300 font-semibold"
              : "text-muted-foreground/75 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <SlidersHorizontal className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
            {isMoreActive && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary dark:bg-violet-400" />
            )}
          </div>
          <span className="mt-1 text-[10px] tracking-tight leading-none">More</span>
        </button>
      </div>
    </nav>
  );
};
