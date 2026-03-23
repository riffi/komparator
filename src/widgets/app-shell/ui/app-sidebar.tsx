import { BarChart3, Braces, ChevronLeft, ChevronRight, FolderKanban, Grid2x2, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navigationItems } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { shellStore } from "@/widgets/app-shell/ui/shell-store";

const iconMap = {
  experiments: Grid2x2,
  models: FolderKanban,
  wrappers: Braces,
  stats: BarChart3,
  settings: Settings,
};

export function AppSidebar() {
  const mobileOpen = shellStore((state) => state.mobileOpen);
  const desktopCollapsed = shellStore((state) => state.desktopCollapsed);
  const setMobileOpen = shellStore((state) => state.setMobileOpen);
  const toggleDesktopCollapsed = shellStore((state) => state.toggleDesktopCollapsed);

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-30 flex w-[280px] flex-col border-r border-border/80 bg-raised/95 pb-4 pt-5 transition-[width,transform] duration-200",
        desktopCollapsed ? "lg:w-[72px]" : "lg:w-[248px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className={cn("mb-5 border-b border-border/80 pb-4", desktopCollapsed ? "px-1.5" : "px-3")}>
        <div className={cn("flex items-center", desktopCollapsed ? "justify-center" : "justify-between gap-3")}>
          {desktopCollapsed ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-[radial-gradient(circle_at_30%_30%,rgba(91,141,239,0.35),transparent_60%),rgba(15,18,24,0.95)] shadow-[0_10px_30px_rgba(91,141,239,0.12)]">
              <span className="text-xl text-primary">◈</span>
            </div>
          ) : (
            <div className="font-mono text-[15px] font-semibold tracking-[-0.04em] text-text">
              <span className="mr-2 text-primary">◈</span>
              Komparator
            </div>
          )}
        </div>
      </div>
      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group relative flex rounded-md py-2.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-text",
                  desktopCollapsed ? "mx-auto w-11 justify-center px-1.5" : "items-center gap-3 px-3",
                  isActive && "bg-primary-soft/60 text-primary",
                )
              }
            >
              <Icon className={cn(desktopCollapsed ? "h-5 w-5" : "h-4 w-4")} />
              {desktopCollapsed ? null : item.label}
              {desktopCollapsed ? (
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-40 -translate-y-1/2 whitespace-nowrap rounded-md border border-border/80 bg-raised px-2.5 py-1.5 text-xs font-medium text-text opacity-0 shadow-panel transition group-hover:opacity-100">
                  {item.label}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
      <div className={cn("mt-auto border-t border-border/80 pt-4", desktopCollapsed ? "px-1.5" : "px-3")}>
        <button
          type="button"
          className={cn(
            "hidden rounded-md text-muted transition hover:bg-surface hover:text-text lg:flex",
            desktopCollapsed ? "h-10 w-full items-center justify-center px-1.5" : "w-full items-center gap-3 px-3 py-2.5 text-sm font-medium",
          )}
          onClick={toggleDesktopCollapsed}
          aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={desktopCollapsed ? "Expand sidebar" : undefined}
        >
          {desktopCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {desktopCollapsed ? null : "Collapse sidebar"}
        </button>
      </div>
    </aside>
  );
}
