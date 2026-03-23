import { PropsWithChildren, useEffect } from "react";
import { themeStore } from "@/shared/config/theme";
import { ensureDatabaseReady } from "@/shared/db/dexie";

export function AppProvider({ children }: PropsWithChildren) {
  const theme = themeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    void ensureDatabaseReady();
  }, []);

  return children;
}
