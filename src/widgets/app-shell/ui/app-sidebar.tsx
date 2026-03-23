import { useEffect, useState } from "react";
import { BarChart3, Braces, FolderKanban, Grid2x2, Tags } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navigationItems } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { loadSidebarCategories, SidebarCategoryItem } from "@/shared/db/workspace";
import { shellStore } from "@/widgets/app-shell/ui/shell-store";

const iconMap = {
  experiments: Grid2x2,
  models: FolderKanban,
  wrappers: Braces,
  categories: Tags,
  stats: BarChart3,
};

export function AppSidebar() {
  const mobileOpen = shellStore((state) => state.mobileOpen);
  const setMobileOpen = shellStore((state) => state.setMobileOpen);
  const [categories, setCategories] = useState<SidebarCategoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const nextCategories = await loadSidebarCategories();
      if (!cancelled) {
        setCategories(nextCategories);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-[280px] border-r border-border/80 bg-raised/95 px-3 pb-4 pt-20 shadow-panel transition lg:sticky lg:top-[72px] lg:h-[calc(100vh-88px)] lg:w-[248px] lg:translate-x-0 lg:rounded-xl lg:border lg:pt-4",
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

      <div className="mt-6 border-t border-border/80 pt-5">
        <div className="px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
          Categories
        </div>
        <div className="mt-3 space-y-1">
          {categories.length === 0 ? (
            <div className="px-3 py-2 text-sm text-dim">No categories</div>
          ) : (
            categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-muted transition hover:bg-surface hover:text-text",
                  category.id === "all" && "bg-surface text-text",
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="flex-1 truncate">{category.name}</span>
                <span className="font-mono text-[11px] text-dim">{category.count}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}