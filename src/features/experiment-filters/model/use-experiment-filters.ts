import { create } from "zustand";

export type ExperimentSort = "updated" | "newest" | "oldest" | "title";
export type ExperimentsViewMode = "all" | "grouped";

type FilterState = {
  query: string;
  sort: ExperimentSort;
  viewMode: ExperimentsViewMode;
  setQuery: (value: string) => void;
  setSort: (value: ExperimentSort) => void;
  setViewMode: (value: ExperimentsViewMode) => void;
  reset: () => void;
};

export const filterStore = create<FilterState>((set) => ({
  query: "",
  sort: "updated",
  viewMode: "all",
  setQuery: (value) => set({ query: value }),
  setSort: (value) => set({ sort: value }),
  setViewMode: (value) => set({ viewMode: value }),
  reset: () =>
    set({
      query: "",
      sort: "updated",
      viewMode: "all",
    }),
}));
