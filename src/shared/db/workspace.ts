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
    counts.set(experiment.categoryId, (counts.get(experiment.categoryId) ?? 0) + 1);
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
    const category = categoriesById.get(experiment.categoryId);
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
      status: experiment.status,
      categoryId: experiment.categoryId,
      categoryName: category?.name ?? "Unknown",
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
    db.categories.get(experiment.categoryId),
    db.wrappers.get(experiment.wrapperId),
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
    status: experiment.status,
    categoryName: category?.name ?? "Unknown",
    categoryColor: category?.color ?? "#71717a",
    tags: experiment.tags,
    wrapperName: wrapper?.name ?? "Unknown",
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

export async function createExperimentWithInitialPrompt(input: {
  title: string;
  description: string;
  status: ExperimentRecord["status"];
  categoryId: string;
  wrapperId: string;
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
      status: input.status,
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
  providerName: string;
  modelName: string;
  modelVersion: string;
  modelComment: string;
  htmlContent: string;
  rating: number | null;
  notes: string;
}) {
  const now = new Date().toISOString();
  const providerName = input.providerName.trim();
  const modelName = input.modelName.trim();
  const modelVersion = input.modelVersion.trim();
  const modelComment = input.modelComment.trim();
  const htmlContent = input.htmlContent.trim();
  const notes = input.notes.trim();

  await db.transaction("rw", [db.providers, db.models, db.results, db.experiments], async () => {
    const providers = await db.providers.toArray();
    let provider =
      providers.find((item) => normalizeKey(item.name) === normalizeKey(providerName)) ?? null;

    if (!provider) {
      const providerRecord: ProviderRecord = {
        id: slugify(providerName) || crypto.randomUUID(),
        name: providerName,
        color: deriveProviderColor(providerName),
        isActive: true,
        createdAt: now,
      };
      await db.providers.add(providerRecord);
      provider = providerRecord;
    }

    const models = await db.models.where("providerId").equals(provider.id).toArray();
    let model =
      models.find(
        (item) =>
          normalizeKey(item.name) === normalizeKey(modelName) &&
          normalizeKey(item.version) === normalizeKey(modelVersion) &&
          normalizeKey(item.comment) === normalizeKey(modelComment),
      ) ?? null;

    if (!model) {
      const modelRecord: ModelRecord = {
        id: `${slugify(providerName)}-${slugify(modelName)}-${slugify(modelVersion) || crypto.randomUUID()}`,
        providerId: provider.id,
        name: modelName,
        version: modelVersion,
        comment: modelComment,
        isActive: true,
        createdAt: now,
      };
      await db.models.add(modelRecord);
      model = modelRecord;
    }

    const previousAttempts = await db.results
      .where("[promptVersionId+modelId+attempt]")
      .between([input.promptVersionId, model.id, Dexie.minKey], [input.promptVersionId, model.id, Dexie.maxKey])
      .toArray();

    await db.results.add({
      id: crypto.randomUUID(),
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
}

export async function updateExperimentEntry(input: {
  experimentId: string;
  title: string;
  description: string;
  status: ExperimentRecord["status"];
  categoryId: string;
  wrapperId: string;
  tags: string[];
}) {
  const now = new Date().toISOString();

  await db.experiments.update(input.experimentId, {
    title: input.title.trim(),
    description: input.description.trim(),
    status: input.status,
    categoryId: input.categoryId,
    wrapperId: input.wrapperId,
    tags: input.tags,
    updatedAt: now,
  });
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
