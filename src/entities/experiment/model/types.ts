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
    htmlContent: string;
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
  htmlContent: string;
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
