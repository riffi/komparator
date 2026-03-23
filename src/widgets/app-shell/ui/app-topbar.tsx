import { ReactNode } from "react";
import { Download, MoonStar, Settings, Upload } from "lucide-react";
import { themeStore } from "@/shared/config/theme";
import { Button } from "@/shared/ui/button";

type AppTopbarProps = {
  leadingAction?: ReactNode;
};

export function AppTopbar({ leadingAction }: AppTopbarProps) {
  const toggleTheme = themeStore((state) => state.toggleTheme);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/80 bg-[rgba(16,18,22,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {leadingAction}
          <div className="font-mono text-[15px] font-semibold tracking-[-0.04em] text-text">
            <span className="mr-2 text-primary">◈</span>
            Komparator
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:inline-flex">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="icon" size="icon" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="icon" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
            <MoonStar className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}