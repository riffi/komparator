import Dexie from "dexie";
import { db } from "@/shared/db/schema";
import {
  ExperimentListItem,
  ExperimentRecord,
  ExperimentWorkspace,
  ModelRecord,
  ProviderRecord,
  WorkspaceResultItem,
  WrapperRecord,
} from "@/entities/experiment/model/types";

export type SidebarCategoryItem = {
  id: string;
  name: string;
  color: string;
  count: number;
};

export type SelectOption = {
  id: string;
  label: string;
};

export type ModelSelectOption = {
  id: string;
  label: string;
  providerName: string;
  modelName: string;
  modelVersion: string;
  modelComment: string;
};

export type CategoryManagerItem = {
  id: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
  count: number;
};

export type ProviderManagerItem = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  modelCount: number;
};

export type ModelManagerItem = {
  id: string;
  providerId: string;
  providerName: string;
  providerColor: string;
  name: string;
  version: string;
  comment: string;
  isActive: boolean;
  resultsCount: number;
  avgRating: number | null;
};

export type WrapperManagerItem = {
  id: string;
  name: string;
  template: string;
  isDefault: boolean;
  usageCount: number;
  updatedAt: string;
  updatedLabel: string;
};

function formatResultDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortResults(left: WorkspaceResultItem, right: WorkspaceResultItem) {
  return (right.rating ?? -1) - (left.rating ?? -1) || Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

function formatCreatedLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUpdatedLabel(value: string) {
  const diffHours = Math.max(1, Math.round((Date.now() - Date.parse(value)) / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const diffWeeks = Math.round(diffDays / 7);
  return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
}

export async function loadSidebarCategories(): Promise<SidebarCategoryItem[]> {
  const [categories, experiments] = await Promise.all([db.categories.toArray(), db.experiments.toArray()]);
  const counts = new Map<string, number>();

  for (const experiment of experiments) {
    if (experiment.categoryId) {
      counts.set(experiment.categoryId, (counts.get(experiment.categoryId) ?? 0) + 1);
    }
  }

  const items = categories
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      count: counts.get(category.id) ?? 0,
    }));

  return [
    {
      id: "all",
      name: "All",
      color: "#5b8def",
      count: experiments.length,
    },
    ...items,
  ];
}

export async function loadCategoryOptions(): Promise<SelectOption[]> {
  const categories = await db.categories.orderBy("sortOrder").toArray();

  return categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));
}

export async function loadWrapperOptions(): Promise<SelectOption[]> {
  const wrappers = await db.wrappers.orderBy("updatedAt").reverse().toArray();

  return wrappers.map((wrapper) => ({
    id: wrapper.id,
    label: wrapper.name,
  }));
}

export async function loadModelOptions(): Promise<ModelSelectOption[]> {
  const [models, providers] = await Promise.all([db.models.toArray(), db.providers.toArray()]);
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));

  return [...models]
    .sort((left, right) => {
      const leftProvider = providersById.get(left.providerId)?.name ?? "";
      const rightProvider = providersById.get(right.providerId)?.name ?? "";

      return (
        leftProvider.localeCompare(rightProvider) ||
        left.name.localeCompare(right.name) ||
        left.version.localeCompare(right.version)
      );
    })
    .map((model) => {
      const providerName = providersById.get(model.providerId)?.name ?? "Unknown";
      const commentPart = model.comment ? ` • ${model.comment}` : "";

      return {
        id: model.id,
        label: `${providerName} / ${model.name} ${model.version}${commentPart}`,
        providerName,
        modelName: model.name,
        modelVersion: model.version,
        modelComment: model.comment,
      };
    });
}

export async function createModelEntry(input: {
  providerName: string;
  modelName: string;
  modelVersion: string;
  modelComment: string;
  providerColor?: string;
  isActive?: boolean;
}) {
  const now = new Date().toISOString();
  const providerName = input.providerName.trim();
  const modelName = input.modelName.trim();
  const modelVersion = input.modelVersion.trim();
  const modelComment = input.modelComment.trim();

  const modelId = await db.transaction("rw", [db.providers, db.models], async () => {
    const providers = await db.providers.toArray();
    let provider =
      providers.find((item) => normalizeKey(item.name) === normalizeKey(providerName)) ?? null;

    if (!provider) {
      const providerRecord: ProviderRecord = {
        id: slugify(providerName) || crypto.randomUUID(),
        name: providerName,
        color: input.providerColor?.trim() || deriveProviderColor(providerName),
        isActive: true,
        createdAt: now,
      };
      await db.providers.add(providerRecord);
      provider = providerRecord;
    }

    const models = await db.models.where("providerId").equals(provider.id).toArray();
    const existingModel =
      models.find(
        (item) =>
          normalizeKey(item.name) === normalizeKey(modelName) &&
          normalizeKey(item.version) === normalizeKey(modelVersion) &&
          normalizeKey(item.comment) === normalizeKey(modelComment),
      ) ?? null;

    if (existingModel) {
      return existingModel.id;
    }

    const modelRecord: ModelRecord = {
      id: `${slugify(providerName)}-${slugify(modelName)}-${slugify(modelVersion) || crypto.randomUUID()}`,
      providerId: provider.id,
      name: modelName,
      version: modelVersion,
      comment: modelComment,
      isActive: input.isActive ?? true,
      createdAt: now,
    };
    await db.models.add(modelRecord);
    return modelRecord.id;
  });

  return modelId;
}

export async function loadProvidersCatalog(): Promise<ProviderManagerItem[]> {
  const [providers, models] = await Promise.all([db.providers.toArray(), db.models.toArray()]);
  const counts = new Map<string, number>();

  for (const model of models) {
    counts.set(model.providerId, (counts.get(model.providerId) ?? 0) + 1);
  }

  return [...providers]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      color: provider.color,
      isActive: provider.isActive,
      modelCount: counts.get(provider.id) ?? 0,
    }));
}

export async function createProviderEntry(input: { name: string; color: string }) {
  const now = new Date().toISOString();
  const name = input.name.trim();

  if (!name) {
    throw new Error("Provider name is required.");
  }

  const existing = await db.providers.toArray();
  const duplicate = existing.find((item) => normalizeKey(item.name) === normalizeKey(name));
  if (duplicate) {
    return duplicate.id;
  }

  const providerId = slugify(name) || crypto.randomUUID();
  await db.providers.add({
    id: providerId,
    name,
    color: input.color.trim() || deriveProviderColor(name),
    isActive: true,
    createdAt: now,
  });

  return providerId;
}

export async function updateProviderEntry(input: {
  providerId: string;
  name: string;
  color: string;
  isActive: boolean;
}) {
  await db.providers.update(input.providerId, {
    name: input.name.trim(),
    color: input.color.trim() || deriveProviderColor(input.name),
    isActive: input.isActive,
  });
}

export async function loadModelsCatalog(): Promise<ModelManagerItem[]> {
  const [models, providers, results] = await Promise.all([db.models.toArray(), db.providers.toArray(), db.results.toArray()]);
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));
  const stats = new Map<string, { count: number; ratedCount: number; ratingSum: number }>();

  for (const result of results) {
    const current = stats.get(result.modelId) ?? { count: 0, ratedCount: 0, ratingSum: 0 };
    current.count += 1;
    if (result.rating !== null) {
      current.ratedCount += 1;
      current.ratingSum += result.rating;
    }
    stats.set(result.modelId, current);
  }

  return [...models]
    .sort((left, right) => {
      const leftProvider = providersById.get(left.providerId)?.name ?? "";
      const rightProvider = providersById.get(right.providerId)?.name ?? "";

      return (
        leftProvider.localeCompare(rightProvider) ||
        left.name.localeCompare(right.name) ||
        left.version.localeCompare(right.version)
      );
    })
    .map((model) => {
      const provider = providersById.get(model.providerId);
      const modelStats = stats.get(model.id);

      return {
        id: model.id,
        providerId: model.providerId,
        providerName: provider?.name ?? "Unknown",
        providerColor: provider?.color ?? "#5b8def",
        name: model.name,
        version: model.version,
        comment: model.comment,
        isActive: model.isActive,
        resultsCount: modelStats?.count ?? 0,
        avgRating:
          modelStats && modelStats.ratedCount > 0 ? modelStats.ratingSum / modelStats.ratedCount : null,
      };
    });
}

export async function updateModelEntry(input: {
  modelId: string;
  providerId: string;
  name: string;
  version: string;
  comment: string;
  isActive: boolean;
}) {
  await db.models.update(input.modelId, {
    providerId: input.providerId,
    name: input.name.trim(),
    version: input.version.trim(),
    comment: input.comment.trim(),
    isActive: input.isActive,
  });
}

export async function updateModelActive(modelId: string, isActive: boolean) {
  await db.models.update(modelId, { isActive });
}

export async function loadWrappersCatalog(): Promise<WrapperManagerItem[]> {
  const [wrappers, experiments] = await Promise.all([db.wrappers.toArray(), db.experiments.toArray()]);
  const counts = new Map<string, number>();

  for (const experiment of experiments) {
    if (experiment.wrapperId) {
      counts.set(experiment.wrapperId, (counts.get(experiment.wrapperId) ?? 0) + 1);
    }
  }

  return [...wrappers]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .map((wrapper) => ({
      id: wrapper.id,
      name: wrapper.name,
      template: wrapper.template,
      isDefault: wrapper.isDefault,
      usageCount: counts.get(wrapper.id) ?? 0,
      updatedAt: wrapper.updatedAt,
      updatedLabel: formatUpdatedLabel(wrapper.updatedAt),
    }));
}

export async function createWrapperEntry(input: {
  name: string;
  template: string;
  isDefault: boolean;
}) {
  const now = new Date().toISOString();
  const name = input.name.trim();
  const template = input.template;

  if (!template.includes("{{prompt}}")) {
    throw new Error("Wrapper template must contain {{prompt}}.");
  }

  await db.transaction("rw", [db.wrappers], async () => {
    if (input.isDefault) {
      await db.wrappers.toCollection().modify({ isDefault: false, updatedAt: now });
    }

    await db.wrappers.add({
      id: crypto.randomUUID(),
      name,
      template,
      isDefault: input.isDefault,
      createdAt: now,
      updatedAt: now,
    });
  });
}

export async function updateWrapperEntry(input: {
  wrapperId: string;
  name: string;
  template: string;
  isDefault: boolean;
}) {
  const now = new Date().toISOString();

  if (!input.template.includes("{{prompt}}")) {
    throw new Error("Wrapper template must contain {{prompt}}.");
  }

  await db.transaction("rw", [db.wrappers], async () => {
    if (input.isDefault) {
      await db.wrappers.toCollection().modify({ isDefault: false, updatedAt: now });
    }

    await db.wrappers.update(input.wrapperId, {
      name: input.name.trim(),
      template: input.template,
      isDefault: input.isDefault,
      updatedAt: now,
    });
  });
}

export async function deleteWrapperEntry(wrapperId: string) {
  const usageCount = await db.experiments.where("wrapperId").equals(wrapperId).count();

  if (usageCount > 0) {
    throw new Error("Wrapper is still used by experiments.");
  }

  await db.wrappers.delete(wrapperId);
}

export async function loadExperimentsList(): Promise<ExperimentListItem[]> {
  const [experiments, categories, promptVersions, results] = await Promise.all([
    db.experiments.toArray(),
    db.categories.toArray(),
    db.promptVersions.toArray(),
    db.results.toArray(),
  ]);

  const categoriesById = new Map(categories.map((item) => [item.id, item]));
  const promptVersionsByExperiment = new Map<string, typeof promptVersions>();

  for (const version of promptVersions) {
    const list = promptVersionsByExperiment.get(version.experimentId) ?? [];
    list.push(version);
    promptVersionsByExperiment.set(version.experimentId, list);
  }

  const resultsByPromptVersion = new Map<string, typeof results>();
  for (const result of results) {
    const list = resultsByPromptVersion.get(result.promptVersionId) ?? [];
    list.push(result);
    resultsByPromptVersion.set(result.promptVersionId, list);
  }

  return experiments.map((experiment) => {
    const category = experiment.categoryId ? categoriesById.get(experiment.categoryId) : undefined;
    const experimentPromptVersions = promptVersionsByExperiment.get(experiment.id) ?? [];
    const experimentResults = experimentPromptVersions.flatMap((item) => resultsByPromptVersion.get(item.id) ?? []);
    const ratedResults = experimentResults.filter((item) => item.rating !== null);
    const avgRating = ratedResults.length
      ? ratedResults.reduce((sum, item) => sum + (item.rating ?? 0), 0) / ratedResults.length
      : null;

    return {
      id: experiment.id,
      title: experiment.title,
      description: experiment.description,
      categoryId: experiment.categoryId,
      categoryName: category?.name ?? "No category",
      categoryColor: category?.color ?? "#71717a",
      tags: experiment.tags,
      promptCount: experimentPromptVersions.length,
      resultCount: experimentResults.length,
      avgRating,
      createdAt: experiment.createdAt,
      updatedAt: experiment.updatedAt,
      createdLabel: formatCreatedLabel(experiment.createdAt),
      updatedLabel: formatUpdatedLabel(experiment.updatedAt),
    } satisfies ExperimentListItem;
  });
}

export async function loadExperimentWorkspace(experimentId: string): Promise<ExperimentWorkspace | null> {
  const experiment = await db.experiments.get(experimentId);

  if (!experiment) {
    return null;
  }

  const [category, wrapper, promptVersions] = await Promise.all([
    experiment.categoryId ? db.categories.get(experiment.categoryId) : Promise.resolve(undefined),
    experiment.wrapperId ? db.wrappers.get(experiment.wrapperId) : Promise.resolve(undefined),
    db.promptVersions.where("experimentId").equals(experiment.id).sortBy("versionNumber"),
  ]);

  const promptVersionIds = promptVersions.map((item) => item.id);
  const rawResults = promptVersionIds.length
    ? await db.results.where("promptVersionId").anyOf(promptVersionIds).toArray()
    : [];

  const modelIds = [...new Set(rawResults.map((item) => item.modelId))];
  const models = modelIds.length ? await db.models.bulkGet(modelIds) : [];
  const providerIds = [...new Set(models.filter(Boolean).map((item) => item!.providerId))];
  const providers = providerIds.length ? await db.providers.bulkGet(providerIds) : [];

  const modelsById = new Map(models.filter(Boolean).map((item) => [item!.id, item!]));
  const providersById = new Map(providers.filter(Boolean).map((item) => [item!.id, item!]));
  const promptVersionsById = new Map(promptVersions.map((item) => [item.id, item]));

  const results: WorkspaceResultItem[] = rawResults
    .map((result) => {
      const model = modelsById.get(result.modelId);
      const promptVersion = promptVersionsById.get(result.promptVersionId);
      const provider = model ? providersById.get(model.providerId) : undefined;

      if (!model || !promptVersion || !provider) {
        return null;
      }

      return {
        id: result.id,
        modelId: model.id,
        providerName: provider.name,
        providerColor: provider.color,
        modelName: model.name,
        modelVersion: model.version,
        modelComment: model.comment,
        promptVersionNumber: promptVersion.versionNumber,
        attempt: result.attempt,
        rating: result.rating,
        notes: result.notes,
        htmlContent: result.htmlContent,
        fileSizeBytes: result.fileSizeBytes,
        lineCount: result.lineCount,
        createdAt: result.createdAt,
        createdLabel: formatResultDate(result.createdAt),
      } satisfies WorkspaceResultItem;
    })
    .filter((item): item is WorkspaceResultItem => item !== null)
    .sort(sortResults);

  return {
    id: experiment.id,
    title: experiment.title,
    description: experiment.description,
    categoryId: experiment.categoryId,
    categoryName: category?.name ?? "No category",
    categoryColor: category?.color ?? "#71717a",
    tags: experiment.tags,
    wrapperId: experiment.wrapperId,
    wrapperName: wrapper?.name ?? "No wrapper",
    wrapperTemplate: wrapper?.template ?? "",
    createdAt: experiment.createdAt,
    updatedAt: experiment.updatedAt,
    promptVersions: [...promptVersions]
      .sort((left, right) => right.versionNumber - left.versionNumber)
      .map((item) => ({
        id: item.id,
        versionNumber: item.versionNumber,
        promptText: item.promptText,
        changeNote: item.changeNote,
        createdAt: item.createdAt,
      })),
    results,
  };
}

export async function updateResultNotes(resultId: string, notes: string) {
  await db.results.update(resultId, { notes });
}

export async function updateResultRating(resultId: string, rating: number | null) {
  await db.results.update(resultId, { rating });
}

export async function updateResultEntry(input: {
  resultId: string;
  experimentId: string;
  htmlContent: string;
  notes: string;
}) {
  const now = new Date().toISOString();
  const htmlContent = input.htmlContent.trim();
  const notes = input.notes.trim();

  await db.transaction("rw", [db.results, db.experiments], async () => {
    await db.results.update(input.resultId, {
      htmlContent,
      notes,
      fileSizeBytes: new Blob([htmlContent]).size,
      lineCount: countLines(htmlContent),
    });

    await db.experiments.update(input.experimentId, { updatedAt: now });
  });
}

export async function deleteResultEntry(input: { resultId: string; experimentId: string }) {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.results, db.experiments], async () => {
    await db.results.delete(input.resultId);
    await db.experiments.update(input.experimentId, { updatedAt: now });
  });
}

export async function createExperimentWithInitialPrompt(input: {
  title: string;
  description: string;
  categoryId: string | null;
  wrapperId: string | null;
  tags: string[];
  promptText: string;
  changeNote: string;
}) {
  const now = new Date().toISOString();
  const experimentId = crypto.randomUUID();
  const promptVersionId = crypto.randomUUID();

  await db.transaction("rw", [db.experiments, db.promptVersions], async () => {
    await db.experiments.add({
      id: experimentId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      wrapperId: input.wrapperId,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    });

    await db.promptVersions.add({
      id: promptVersionId,
      experimentId,
      versionNumber: 1,
      promptText: input.promptText,
      changeNote: input.changeNote,
      createdAt: now,
    });
  });

  return experimentId;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function deriveProviderColor(name: string) {
  const key = normalizeKey(name);

  if (key.includes("openai")) return "#5ec269";
  if (key.includes("anthropic")) return "#e8755a";
  if (key.includes("google")) return "#4a9eed";
  if (key.includes("meta")) return "#a578e6";
  if (key.includes("xai")) return "#9a9ca0";

  return "#5b8def";
}

function countLines(value: string) {
  return value.split(/\r\n|\r|\n/).length;
}

export async function createResultEntry(input: {
  experimentId: string;
  promptVersionId: string;
  modelId: string;
  htmlContent: string;
  rating: number | null;
  notes: string;
}) {
  const now = new Date().toISOString();
  const htmlContent = input.htmlContent.trim();
  const notes = input.notes.trim();
  const resultId = crypto.randomUUID();

  await db.transaction("rw", [db.providers, db.models, db.results, db.experiments], async () => {
    const model = await db.models.get(input.modelId);
    if (!model) {
      throw new Error("Selected model no longer exists.");
    }

    const previousAttempts = await db.results
      .where("[promptVersionId+modelId+attempt]")
      .between([input.promptVersionId, model.id, Dexie.minKey], [input.promptVersionId, model.id, Dexie.maxKey])
      .toArray();

    await db.results.add({
      id: resultId,
      promptVersionId: input.promptVersionId,
      modelId: model.id,
      attempt: previousAttempts.length + 1,
      htmlContent,
      rating: input.rating,
      notes,
      fileSizeBytes: new Blob([htmlContent]).size,
      lineCount: countLines(htmlContent),
      createdAt: now,
    });

    await db.experiments.update(input.experimentId, { updatedAt: now });
  });

  return resultId;
}

export async function updateExperimentEntry(input: {
  experimentId: string;
  title: string;
  description: string;
  categoryId: string | null;
  wrapperId: string | null;
  tags: string[];
}) {
  const now = new Date().toISOString();

  await db.experiments.update(input.experimentId, {
    title: input.title.trim(),
    description: input.description.trim(),
    categoryId: input.categoryId,
    wrapperId: input.wrapperId,
    tags: input.tags,
    updatedAt: now,
  });
}

export async function loadManageCategories(): Promise<CategoryManagerItem[]> {
  const [categories, experiments] = await Promise.all([db.categories.toArray(), db.experiments.toArray()]);
  const counts = new Map<string, number>();

  for (const experiment of experiments) {
    if (experiment.categoryId) {
      counts.set(experiment.categoryId, (counts.get(experiment.categoryId) ?? 0) + 1);
    }
  }

  return [...categories]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      sortOrder: category.sortOrder,
      count: counts.get(category.id) ?? 0,
    }));
}

export async function createCategoryEntry(input: {
  name: string;
  description: string;
  color: string;
}) {
  const now = new Date().toISOString();
  const categories = await db.categories.toArray();
  const nextSortOrder = categories.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;

  await db.categories.add({
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description.trim(),
    color: input.color.trim() || "#5b8def",
    sortOrder: nextSortOrder,
    createdAt: now,
  });
}

export async function updateCategoryEntry(input: {
  categoryId: string;
  name: string;
  description: string;
  color: string;
}) {
  await db.categories.update(input.categoryId, {
    name: input.name.trim(),
    description: input.description.trim(),
    color: input.color.trim() || "#5b8def",
  });
}

export async function deleteCategoryEntry(categoryId: string) {
  const experimentsUsingCategory = await db.experiments.where("categoryId").equals(categoryId).count();

  if (experimentsUsingCategory > 0) {
    throw new Error("Category is still used by experiments.");
  }

  await db.categories.delete(categoryId);
}

export async function updatePromptVersionEntry(input: {
  promptVersionId: string;
  promptText: string;
  changeNote: string;
  experimentId: string;
}) {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.promptVersions, db.experiments], async () => {
    await db.promptVersions.update(input.promptVersionId, {
      promptText: input.promptText,
      changeNote: input.changeNote,
    });
    await db.experiments.update(input.experimentId, { updatedAt: now });
  });
}

export async function createPromptVersionEntry(input: {
  experimentId: string;
  promptText: string;
  changeNote: string;
}) {
  const now = new Date().toISOString();

  const versions = await db.promptVersions.where("experimentId").equals(input.experimentId).toArray();
  const nextVersionNumber =
    versions.reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1;

  const promptVersionId = crypto.randomUUID();

  await db.transaction("rw", [db.promptVersions, db.experiments], async () => {
    await db.promptVersions.add({
      id: promptVersionId,
      experimentId: input.experimentId,
      versionNumber: nextVersionNumber,
      promptText: input.promptText,
      changeNote: input.changeNote,
      createdAt: now,
    });
    await db.experiments.update(input.experimentId, { updatedAt: now });
  });

  return promptVersionId;
}
