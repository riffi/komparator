import { create } from "zustand";

type ShellState = {
  mobileOpen: boolean;
  desktopCollapsed: boolean;
  setMobileOpen: (value: boolean) => void;
  setDesktopCollapsed: (value: boolean) => void;
  toggleDesktopCollapsed: () => void;
};

export const shellStore = create<ShellState>((set) => ({
  mobileOpen: false,
  desktopCollapsed: false,
  setMobileOpen: (value) => set({ mobileOpen: value }),
  setDesktopCollapsed: (value) => set({ desktopCollapsed: value }),
  toggleDesktopCollapsed: () =>
    set((state) => ({ desktopCollapsed: !state.desktopCollapsed })),
}));
