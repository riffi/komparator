import { ExperimentSort } from "@/features/experiment-filters/model/use-experiment-filters";

export type ExperimentListItem = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  tags: string[];
  versionCount: number;
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
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WrapperVersionRecord = {
  id: string;
  wrapperId: string;
  versionNumber: number;
  template: string;
  changeNote: string;
  createdAt: string;
};

export type ExperimentRecord = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wrapperId?: string | null;
};

export type ExperimentVersionRecord = {
  id: string;
  experimentId: string;
  versionNumber: number;
  promptText: string;
  wrapperVersionId: string | null;
  changeNote: string;
  createdAt: string;
};

export type PromptVersionRecord = ExperimentVersionRecord & {
  wrapperVersionId?: string | null;
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
  sourceType: "manual" | "catalog";
  catalogModelId: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type CatalogStateRecord = {
  id: "default";
  version: string;
  sourceLabel: string;
  importedAt: string;
  previousVersion: string | null;
  presetDiffs: Array<{
    presetId: string;
    modelCountDelta: number;
  }>;
};

export type CatalogProviderRecord = {
  id: string;
  canonicalSlug: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogModelRecord = {
  id: string;
  providerCatalogId: string;
  name: string;
  version: string;
  displayName: string;
  aliases: string[];
  status: "active" | "deprecated";
  createdAt: string;
  updatedAt: string;
};

export type CatalogPresetRecord = {
  id: string;
  title: string;
  description: string;
  modelIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ModelMatchRecord = {
  id: string;
  catalogModelId: string;
  localModelId: string;
  matchType: "exact" | "alias" | "normalized";
  confidence: number;
  status: "pending" | "linked" | "ignored";
  createdAt: string;
  updatedAt: string;
};

export type ResultRecord = {
  id: string;
  experimentVersionId: string;
  modelId: string;
  attempt: number;
  composedPromptSnapshot: string;
  promptTextSnapshot: string;
  wrapperVersionId: string | null;
  wrapperNameSnapshot: string | null;
  wrapperTemplateSnapshot: string | null;
  htmlContent: string;
  rating: number | null;
  notes: string;
  fileSizeBytes: number;
  lineCount: number;
  createdAt: string;
  promptVersionId?: string;
};

export type StatsWorkspaceRecord = {
  id: "workspace";
  experimentsCount: number;
  experimentVersionsCount: number;
  resultsCount: number;
  ratedResultsCount: number;
  usedModelsCount: number;
  providersCount: number;
  ratingSum: number;
  updatedAt: string;
  promptVersionsCount?: number;
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
  experimentVersionId: string;
  experimentVersionNumber: number;
  promptVersionNumber: number;
  attempt: number;
  rating: number | null;
  notes: string;
  composedPromptSnapshot: string;
  promptTextSnapshot: string;
  wrapperVersionId: string | null;
  wrapperName: string;
  wrapperVersionNumber: number | null;
  wrapperTemplateSnapshot: string | null;
  fileSizeBytes: number;
  lineCount: number;
  createdAt: string;
  createdLabel: string;
};

export type WorkspaceExperimentVersion = {
  id: string;
  versionNumber: number;
  promptText: string;
  wrapperVersionId: string | null;
  wrapperName: string;
  wrapperVersionNumber: number | null;
  wrapperTemplate: string;
  changeNote: string;
  createdAt: string;
  resultCount: number;
};

export type ExperimentWorkspace = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versions: WorkspaceExperimentVersion[];
  promptVersions: WorkspaceExperimentVersion[];
  results: WorkspaceResultItem[];
};

export type CatalogSummary = {
  version: string | null;
  sourceLabel: string | null;
  importedAt: string | null;
  providersCount: number;
  modelsCount: number;
  presetsCount: number;
  matchesPendingCount: number;
};
