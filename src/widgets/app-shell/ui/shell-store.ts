import { create } from "zustand";

type ShellState = {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
};

export const shellStore = create<ShellState>((set) => ({
  mobileOpen: false,
  setMobileOpen: (value) => set({ mobileOpen: value }),
}));