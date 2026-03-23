import { create } from "zustand";

type ThemeState = {
  theme: "dark";
  toggleTheme: () => void;
};

export const themeStore = create<ThemeState>(() => ({
  theme: "dark",
  toggleTheme: () => undefined,
}));