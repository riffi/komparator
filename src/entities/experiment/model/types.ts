import { ExperimentStatus, ExperimentSort } from "@/features/experiment-filters/model/use-experiment-filters";

export type ExperimentListItem = {
  id: string;
  title: string;
  description: string;
  status: ExperimentStatus;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  tags: string[];
  promptCount: number;
  resultCount: number;
  avgRating: number | null;
  createdAt: string;
  updatedAt: string;
  createdLabel: string;
  updatedLabel: string;
};

export type ExperimentFilterInput = {
  query: string;
  statuses: ExperimentStatus[];
  category: string;
  tagQuery: string;
  sort: ExperimentSort;
};