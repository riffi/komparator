import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/widgets/app-shell/ui/app-sidebar";
import { AppTopbar } from "@/widgets/app-shell/ui/app-topbar";
import { shellStore } from "@/widgets/app-shell/ui/shell-store";

export function AppShell() {
  const mobileOpen = shellStore((state) => state.mobileOpen);
  const setMobileOpen = shellStore((state) => state.setMobileOpen);

  return (
    <div className="min-h-screen bg-transparent text-text">
      <AppTopbar
        leadingAction={
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted transition hover:border-border/80 hover:bg-surface hover:text-text lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        }
      />
      <div className="mx-auto flex w-full max-w-[1600px] gap-4 px-4 pb-4 pt-[72px] lg:px-6">
        <AppSidebar />
        <main className="min-w-0 flex-1">
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