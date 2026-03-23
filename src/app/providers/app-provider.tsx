import { PropsWithChildren, useEffect } from "react";
import { themeStore } from "@/shared/config/theme";

export function AppProvider({ children }: PropsWithChildren) {
  const theme = themeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return children;
}