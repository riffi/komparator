import { create } from "zustand";

export type ExperimentSort = "newest" | "oldest" | "results" | "rating";
export type ExperimentStatus = "draft" | "active" | "completed" | "archived";

type FilterState = {
  query: string;
  statuses: ExperimentStatus[];
  category: string;
  tagQuery: string;
  sort: ExperimentSort;
  setQuery: (value: string) => void;
  toggleStatus: (value: ExperimentStatus) => void;
  setCategory: (value: string) => void;
  setTagQuery: (value: string) => void;
  setSort: (value: ExperimentSort) => void;
  reset: () => void;
};

const defaultStatuses: ExperimentStatus[] = ["draft", "active", "completed"];

export const filterStore = create<FilterState>((set) => ({
  query: "",
  statuses: defaultStatuses,
  category: "all",
  tagQuery: "",
  sort: "newest",
  setQuery: (value) => set({ query: value }),
  toggleStatus: (value) =>
    set((state) => {
      const exists = state.statuses.includes(value);
      const next = exists
        ? state.statuses.filter((status) => status !== value)
        : [...state.statuses, value];

      return { statuses: next };
    }),
  setCategory: (value) => set({ category: value }),
  setTagQuery: (value) => set({ tagQuery: value }),
  setSort: (value) => set({ sort: value }),
  reset: () =>
    set({
      query: "",
      statuses: defaultStatuses,
      category: "all",
      tagQuery: "",
      sort: "newest",
    }),
}));