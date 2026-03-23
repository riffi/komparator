import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { AppSidebar } from "@/widgets/app-shell/ui/app-sidebar";
import { shellStore } from "@/widgets/app-shell/ui/shell-store";

export function AppShell() {
  const mobileOpen = shellStore((state) => state.mobileOpen);
  const desktopCollapsed = shellStore((state) => state.desktopCollapsed);
  const setMobileOpen = shellStore((state) => state.setMobileOpen);

  return (
    <div className="min-h-screen bg-transparent text-text">
      <button
        type="button"
        className="fixed left-4 top-4 z-40 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-raised/90 text-muted transition hover:bg-surface hover:text-text lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex min-h-screen w-full px-4 py-4 lg:pr-6">
        <AppSidebar />
        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 transition-[padding] duration-200",
            desktopCollapsed ? "lg:pl-[80px]" : "lg:pl-[272px]",
          )}
        >
          <Outlet />
        </main>
      </div>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/55 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}
    </div>
  );
}
