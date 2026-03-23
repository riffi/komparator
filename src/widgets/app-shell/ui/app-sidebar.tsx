import { BarChart3, Braces, FolderKanban, Grid2x2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navigationItems } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { shellStore } from "@/widgets/app-shell/ui/shell-store";

const iconMap = {
  experiments: Grid2x2,
  models: FolderKanban,
  wrappers: Braces,
  stats: BarChart3,
};

export function AppSidebar() {
  const mobileOpen = shellStore((state) => state.mobileOpen);
  const setMobileOpen = shellStore((state) => state.setMobileOpen);

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-14 z-30 w-[280px] border-r border-border/80 bg-raised/95 px-3 pb-4 pt-6 transition lg:w-[248px] lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
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
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-text",
                  isActive && "bg-primary-soft/60 text-primary",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
