import { ExperimentSort } from "@/features/experiment-filters/model/use-experiment-filters";

export type ExperimentListItem = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
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
  topResultPreview: {
    resultId: string;
    rating: number | null;
    providerName: string;
    providerColor: string;
    modelName: string;
    modelVersion: string;
  } | null;
};

export type ExperimentFilterInput = {
  query: string;
  sort: ExperimentSort;
};

export type ExperimentsPageInput = {
  offset: number;
  limit: number;
  query: string;
  sort: ExperimentSort;
};

export type ExperimentsPageResult = {
  items: ExperimentListItem[];
  total: number;
};

export type CategoryRecord = {
  id: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
  createdAt: string;
};

export type WrapperRecord = {
  id: string;
  name: string;
  template: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExperimentRecord = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  wrapperId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type PromptVersionRecord = {
  id: string;
  experimentId: string;
  versionNumber: number;
  promptText: string;
  changeNote: string;
  createdAt: string;
};

export type ProviderRecord = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
};

export type ModelRecord = {
  id: string;
  providerId: string;
  name: string;
  version: string;
  comment: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export type ResultRecord = {
  id: string;
  promptVersionId: string;
  modelId: string;
  attempt: number;
  htmlContent: string;
  rating: number | null;
  notes: string;
  fileSizeBytes: number;
  lineCount: number;
  createdAt: string;
};

export type StatsWorkspaceRecord = {
  id: "workspace";
  experimentsCount: number;
  promptVersionsCount: number;
  resultsCount: number;
  ratedResultsCount: number;
  usedModelsCount: number;
  providersCount: number;
  ratingSum: number;
  updatedAt: string;
};

export type StatsModelRecord = {
  modelId: string;
  resultsCount: number;
  ratedCount: number;
  ratingSum: number;
  wins: number;
  experimentsParticipatedCount: number;
  updatedAt: string;
};

export type StatsProviderRecord = {
  providerId: string;
  resultsCount: number;
  ratedCount: number;
  ratingSum: number;
  updatedAt: string;
};

export type WorkspaceResultItem = {
  id: string;
  modelId: string;
  providerName: string;
  providerColor: string;
  modelName: string;
  modelVersion: string;
  modelComment: string;
  promptVersionNumber: number;
  attempt: number;
  rating: number | null;
  notes: string;
  fileSizeBytes: number;
  lineCount: number;
  createdAt: string;
  createdLabel: string;
};

export type WorkspacePromptVersion = {
  id: string;
  versionNumber: number;
  promptText: string;
  changeNote: string;
  createdAt: string;
};

export type ExperimentWorkspace = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  tags: string[];
  wrapperId: string | null;
  wrapperName: string;
  wrapperTemplate: string;
  createdAt: string;
  updatedAt: string;
  promptVersions: WorkspacePromptVersion[];
  results: WorkspaceResultItem[];
};
