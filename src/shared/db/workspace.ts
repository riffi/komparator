import Dexie from "dexie";
import { db } from "@/shared/db/schema";
import {
  CatalogModelRecord,
  CatalogPresetRecord,
  CatalogProviderRecord,
  CatalogStateRecord,
  CatalogSummary,
  ExperimentVersionRecord,
  ExperimentListItem,
  ExperimentsPageInput,
  ExperimentsPageResult,
  ExperimentRecord,
  ExperimentWorkspace,
  ModelRecord,
  ModelMatchRecord,
  ProviderRecord,
  StatsModelRecord,
  StatsProviderRecord,
  StatsWorkspaceRecord,
  WorkspaceResultItem,
  WrapperRecord,
  WrapperVersionRecord,
} from "@/entities/experiment/model/types";
import { buildPromptForClipboard } from "@/shared/lib/prompt";
import { builtInModelCatalog, CatalogImportPayload } from "@/shared/db/model-catalog";

const MODEL_CATALOG_URL = "/catalog/models.json";

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

export type WrapperSelectOption = SelectOption & {
  template: string;
  wrapperName: string;
  versionNumber: number;
};

export type ModelSelectOption = {
  id: string;
  label: string;
  providerId: string;
  providerColor: string;
  providerName: string;
  modelName: string;
  modelVersion: string;
  modelComment: string;
  isActive: boolean;
  lastUsedAt: string | null;
  sourceType: "manual" | "catalog";
  catalogModelId: string | null;
  catalogDisplayName: string | null;
  pendingMatchCount: number;
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
  sourceType: "manual" | "catalog";
  catalogModelId: string | null;
  catalogDisplayName: string | null;
  pendingMatchCount: number;
};

export type CatalogPresetItem = {
  id: string;
  title: string;
  description: string;
  modelCount: number;
  modelCountDelta: number;
};

export type CatalogModelBrowserItem = {
  id: string;
  providerName: string;
  providerColor: string;
  displayName: string;
  name: string;
  version: string;
  aliases: string[];
  presetIds: string[];
  status: "active" | "deprecated";
  linkedLocalModelId: string | null;
  linkedLocalLabel: string | null;
  pendingMatchId: string | null;
  pendingMatchConfidence: number | null;
};

export type ModelMatchItem = {
  id: string;
  catalogModelId: string;
  catalogDisplayName: string;
  catalogProviderName: string;
  localModelId: string;
  localLabel: string;
  matchType: "exact" | "alias" | "normalized";
  confidence: number;
  status: "pending" | "linked" | "ignored";
};

export type WrapperManagerItem = {
  id: string;
  name: string;
  template: string;
  latestVersionId: string;
  latestVersionNumber: number;
  isDefault: boolean;
  usageCount: number;
  updatedAt: string;
  updatedLabel: string;
};

export type WrapperDetailVersionItem = {
  id: string;
  versionNumber: number;
  template: string;
  changeNote: string;
  createdAt: string;
  createdLabel: string;
  usageCount: number;
  isLatest: boolean;
};

export type WrapperDetailData = {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  updatedLabel: string;
  latestVersionId: string;
  latestVersionNumber: number;
  usageCount: number;
  versions: WrapperDetailVersionItem[];
};

export type StatsSummaryCard = {
  label: string;
  value: string;
  helper: string;
};

export type StatsLeaderboardItem = {
  modelId: string;
  providerName: string;
  providerColor: string;
  modelName: string;
  modelVersion: string;
  avgRating: number;
  ratedCount: number;
  winRate: number;
};

export type StatsProviderBreakdownItem = {
  providerId: string;
  providerName: string;
  providerColor: string;
  avgRating: number;
  resultsCount: number;
};

export type StatsCategoryMatrixRow = {
  categoryId: string;
  categoryName: string;
  color: string;
  values: Array<{
    modelId: string;
    avgRating: number | null;
    resultsCount: number;
  }>;
};

export type StatsHistorySeries = {
  modelId: string;
  label: string;
  color: string;
  points: Array<{
    date: string;
    avgRating: number;
  }>;
};

export type StatsDashboardData = {
  summary: StatsSummaryCard[];
  leaderboard: StatsLeaderboardItem[];
  providerBreakdown: StatsProviderBreakdownItem[];
  categoryModels: Array<{
    modelId: string;
    label: string;
    providerColor: string;
  }>;
  categoryMatrix: StatsCategoryMatrixRow[];
  ratingHistory: StatsHistorySeries[];
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

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function normalizeLooseKey(value: string) {
  return normalizeKey(value).replace(/[\s._-]+/g, " ").replace(/\s+/g, " ").trim();
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
  if (key.includes("mistral")) return "#f59e0b";
  if (key.includes("xiaomi")) return "#fb923c";

  return "#5b8def";
}

function countLines(value: string) {
  return value.split(/\r\n|\r|\n/).length;
}

function getLocalModelLabel(model: ModelRecord, providerName: string, catalogDisplayName?: string | null) {
  const baseName = catalogDisplayName ?? `${model.name} ${model.version}`.trim();
  const commentPart = model.comment ? ` • ${model.comment}` : "";
  return `${providerName} / ${baseName}${commentPart}`;
}

function getLatestWrapperVersions(wrapperVersions: WrapperVersionRecord[]) {
  const latestByWrapperId = new Map<string, WrapperVersionRecord>();

  for (const version of wrapperVersions) {
    const current = latestByWrapperId.get(version.wrapperId);
    if (!current || version.versionNumber > current.versionNumber) {
      latestByWrapperId.set(version.wrapperId, version);
    }
  }

  return latestByWrapperId;
}

export async function ensureCatalogReady() {
  const current = await db.catalogState.get("default");
  if (current) {
    return;
  }

  try {
    await syncRemoteCatalog();
  } catch {
    await importCatalogPayload(builtInModelCatalog);
  }
}

async function recomputeModelMatches() {
  const [catalogModels, catalogProviders, localModels, localProviders] = await Promise.all([
    db.catalogModels.toArray(),
    db.catalogProviders.toArray(),
    db.models.toArray(),
    db.providers.toArray(),
  ]);

  const catalogProvidersById = new Map(catalogProviders.map((item) => [item.id, item]));
  const localProvidersById = new Map(localProviders.map((item) => [item.id, item]));
  const nextMatches = new Map<string, ModelMatchRecord>();
  const now = new Date().toISOString();

  for (const catalogModel of catalogModels) {
    const linkedLocal = localModels.find((item) => item.catalogModelId === catalogModel.id);
    if (linkedLocal) {
      continue;
    }

    const catalogProvider = catalogProvidersById.get(catalogModel.providerCatalogId);
    if (!catalogProvider) {
      continue;
    }

    const catalogProviderKey = normalizeLooseKey(catalogProvider.name);
    const exactCatalogKey = normalizeLooseKey(`${catalogModel.name} ${catalogModel.version}`);
    const aliasKeys = new Set([
      exactCatalogKey,
      normalizeLooseKey(catalogModel.displayName),
      ...catalogModel.aliases.map((alias) => normalizeLooseKey(alias)),
    ]);

    for (const localModel of localModels) {
      if (localModel.catalogModelId) {
        continue;
      }

      const localProvider = localProvidersById.get(localModel.providerId);
      if (!localProvider || normalizeLooseKey(localProvider.name) !== catalogProviderKey) {
        continue;
      }

      const localKey = normalizeLooseKey(`${localModel.name} ${localModel.version}`);
      let matchType: ModelMatchRecord["matchType"] | null = null;
      let confidence = 0;

      if (localKey === exactCatalogKey) {
        matchType = "exact";
        confidence = 1;
      } else if (aliasKeys.has(localKey)) {
        matchType = "alias";
        confidence = 0.94;
      } else if (
        normalizeLooseKey(localModel.version) === normalizeLooseKey(catalogModel.version) &&
        (normalizeLooseKey(localModel.name).includes(normalizeLooseKey(catalogModel.name)) ||
          normalizeLooseKey(catalogModel.name).includes(normalizeLooseKey(localModel.name)))
      ) {
        matchType = "normalized";
        confidence = 0.78;
      }

      if (!matchType) {
        continue;
      }

      const id = `${catalogModel.id}__${localModel.id}`;
      nextMatches.set(id, {
        id,
        catalogModelId: catalogModel.id,
        localModelId: localModel.id,
        matchType,
        confidence,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const previous = await db.modelMatches.toArray();
  for (const item of previous) {
    if ((item.status === "ignored" || item.status === "linked") && !nextMatches.has(item.id)) {
      nextMatches.set(item.id, item);
    } else if (item.status !== "pending" && nextMatches.has(item.id)) {
      nextMatches.set(item.id, { ...nextMatches.get(item.id)!, status: item.status, createdAt: item.createdAt });
    }
  }

  await db.transaction("rw", [db.modelMatches], async () => {
    await db.modelMatches.clear();
    if (nextMatches.size > 0) {
      await db.modelMatches.bulkAdd([...nextMatches.values()]);
    }
  });
}

async function importCatalogPayload(payload: CatalogImportPayload) {
  const now = new Date().toISOString();

  await db.transaction(
    "rw",
    [db.catalogState, db.catalogProviders, db.catalogModels, db.catalogPresets],
    async () => {
      const previousState = await db.catalogState.get("default");
      const previousPresets = await db.catalogPresets.toArray();
      const previousPresetCounts = new Map(previousPresets.map((preset) => [preset.id, preset.modelIds.length]));

      await db.catalogProviders.clear();
      await db.catalogModels.clear();
      await db.catalogPresets.clear();

      const providerRows: CatalogProviderRecord[] = payload.providers.map((provider) => ({
        id: provider.id,
        canonicalSlug: provider.canonicalSlug,
        name: provider.name,
        color: provider.color,
        isActive: provider.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      }));
      const modelRows: CatalogModelRecord[] = payload.models.map((model) => ({
        id: model.id,
        providerCatalogId: model.providerId,
        name: model.name,
        version: model.version,
        displayName: model.displayName,
        aliases: model.aliases ?? [],
        status: model.status ?? "active",
        createdAt: now,
        updatedAt: now,
      }));
      const presetRows: CatalogPresetRecord[] = payload.presets.map((preset) => ({
        id: preset.id,
        title: preset.title,
        description: preset.description,
        modelIds: preset.modelIds,
        createdAt: now,
        updatedAt: now,
      }));
      const presetDiffs = payload.presets.map((preset) => ({
        presetId: preset.id,
        modelCountDelta: preset.modelIds.length - (previousPresetCounts.get(preset.id) ?? preset.modelIds.length),
      }));
      const stateRow: CatalogStateRecord = {
        id: "default",
        version: payload.version,
        sourceLabel: payload.sourceLabel,
        importedAt: now,
        previousVersion: previousState?.version ?? null,
        presetDiffs,
      };

      if (providerRows.length > 0) {
        await db.catalogProviders.bulkAdd(providerRows);
      }
      if (modelRows.length > 0) {
        await db.catalogModels.bulkAdd(modelRows);
      }
      if (presetRows.length > 0) {
        await db.catalogPresets.bulkAdd(presetRows);
      }
      await db.catalogState.put(stateRow);
    },
  );

  await recomputeModelMatches();
}

function assertCatalogPayload(value: unknown): asserts value is CatalogImportPayload {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid catalog payload.");
  }

  const payload = value as Record<string, unknown>;
  if (
    typeof payload.version !== "string" ||
    typeof payload.sourceLabel !== "string" ||
    !Array.isArray(payload.providers) ||
    !Array.isArray(payload.models) ||
    !Array.isArray(payload.presets)
  ) {
    throw new Error("Invalid catalog payload.");
  }
}

async function fetchRemoteCatalogPayload() {
  const response = await fetch(MODEL_CATALOG_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;
  assertCatalogPayload(payload);
  return payload;
}

async function rebuildStatsAggregates() {
  const [experiments, experimentVersions, providers, models, results] = await Promise.all([
    db.experiments.toArray(),
    db.experimentVersions.toArray(),
    db.providers.toArray(),
    db.models.toArray(),
    db.results.toArray(),
  ]);

  const now = new Date().toISOString();
  const experimentVersionsById = new Map(experimentVersions.map((item) => [item.id, item]));
  const modelsById = new Map(models.map((item) => [item.id, item]));
  const resultsByModelId = new Map<string, typeof results>();
  const modelStats = new Map<string, StatsModelRecord>();
  const providerStats = new Map<string, StatsProviderRecord>();
  const experimentWinners = new Map<string, { topRating: number; modelIds: Set<string> }>();
  let ratedResultsCount = 0;
  let ratingSum = 0;

  for (const result of results) {
    const list = resultsByModelId.get(result.modelId) ?? [];
    list.push(result);
    resultsByModelId.set(result.modelId, list);

    const model = modelsById.get(result.modelId);
    if (!model) {
      continue;
    }

    const modelRecord = modelStats.get(model.id) ?? {
      modelId: model.id,
      resultsCount: 0,
      ratedCount: 0,
      ratingSum: 0,
      wins: 0,
      experimentsParticipatedCount: 0,
      updatedAt: now,
    };
    modelRecord.resultsCount += 1;

    const providerRecord = providerStats.get(model.providerId) ?? {
      providerId: model.providerId,
      resultsCount: 0,
      ratedCount: 0,
      ratingSum: 0,
      updatedAt: now,
    };
    providerRecord.resultsCount += 1;

    if (result.rating !== null) {
      ratedResultsCount += 1;
      ratingSum += result.rating;
      modelRecord.ratedCount += 1;
      modelRecord.ratingSum += result.rating;
      providerRecord.ratedCount += 1;
      providerRecord.ratingSum += result.rating;

      const experimentVersion = experimentVersionsById.get(result.experimentVersionId);
      if (experimentVersion) {
        const winnerRecord = experimentWinners.get(experimentVersion.experimentId);
        if (!winnerRecord || result.rating > winnerRecord.topRating) {
          experimentWinners.set(experimentVersion.experimentId, {
            topRating: result.rating,
            modelIds: new Set([model.id]),
          });
        } else if (result.rating === winnerRecord.topRating) {
          winnerRecord.modelIds.add(model.id);
        }
      }
    }

    modelStats.set(model.id, modelRecord);
    providerStats.set(model.providerId, providerRecord);
  }

  for (const model of models) {
    const experimentsParticipated = new Set<string>();

    for (const result of resultsByModelId.get(model.id) ?? []) {
      const experimentVersion = experimentVersionsById.get(result.experimentVersionId);
      if (experimentVersion) {
        experimentsParticipated.add(experimentVersion.experimentId);
      }
    }

    const modelRecord = modelStats.get(model.id) ?? {
      modelId: model.id,
      resultsCount: 0,
      ratedCount: 0,
      ratingSum: 0,
      wins: 0,
      experimentsParticipatedCount: 0,
      updatedAt: now,
    };
    modelRecord.experimentsParticipatedCount = experimentsParticipated.size;
    modelStats.set(model.id, modelRecord);
  }

  for (const winner of experimentWinners.values()) {
    for (const modelId of winner.modelIds) {
      const modelRecord = modelStats.get(modelId);
      if (modelRecord) {
        modelRecord.wins += 1;
      }
    }
  }

  const workspaceRecord: StatsWorkspaceRecord = {
    id: "workspace",
    experimentsCount: experiments.length,
    experimentVersionsCount: experimentVersions.length,
    resultsCount: results.length,
    ratedResultsCount,
    usedModelsCount: new Set(results.map((item) => item.modelId)).size,
    providersCount: providers.length,
    ratingSum,
    updatedAt: now,
  };

  await db.transaction("rw", [db.statsWorkspace, db.statsModels, db.statsProviders], async () => {
    await db.statsWorkspace.clear();
    await db.statsModels.clear();
    await db.statsProviders.clear();
    await db.statsWorkspace.add(workspaceRecord);
    if (modelStats.size > 0) {
      await db.statsModels.bulkAdd([...modelStats.values()]);
    }
    if (providerStats.size > 0) {
      await db.statsProviders.bulkAdd([...providerStats.values()]);
    }
  });
}

export async function syncRemoteCatalog() {
  const payload = await fetchRemoteCatalogPayload();
  await importCatalogPayload(payload);
}

export async function importCatalogFromJsonText(jsonText: string) {
  const payload = JSON.parse(jsonText) as CatalogImportPayload;
  if (
    !payload ||
    typeof payload.version !== "string" ||
    !Array.isArray(payload.providers) ||
    !Array.isArray(payload.models) ||
    !Array.isArray(payload.presets)
  ) {
    throw new Error("Invalid catalog JSON.");
  }

  await importCatalogPayload(payload);
}

export async function loadCatalogSummary(): Promise<CatalogSummary> {
  await ensureCatalogReady();

  const [state, providersCount, modelsCount, presetsCount, pendingMatches] = await Promise.all([
    db.catalogState.get("default"),
    db.catalogProviders.count(),
    db.catalogModels.count(),
    db.catalogPresets.count(),
    db.modelMatches.where("status").equals("pending").count(),
  ]);

  return {
    version: state?.version ?? null,
    sourceLabel: state?.sourceLabel ?? null,
    importedAt: state?.importedAt ?? null,
    providersCount,
    modelsCount,
    presetsCount,
    matchesPendingCount: pendingMatches,
  };
}

export async function loadCatalogPresets(): Promise<CatalogPresetItem[]> {
  await ensureCatalogReady();
  const [presets, state] = await Promise.all([db.catalogPresets.toArray(), db.catalogState.get("default")]);
  const presetDiffs = new Map((state?.presetDiffs ?? []).map((item) => [item.presetId, item.modelCountDelta]));

  return presets
    .sort((left, right) => left.title.localeCompare(right.title))
    .map((preset) => ({
      id: preset.id,
      title: preset.title,
      description: preset.description,
      modelCount: preset.modelIds.length,
      modelCountDelta: presetDiffs.get(preset.id) ?? 0,
    }));
}

export async function createModelFromCatalog(catalogModelId: string) {
  await ensureCatalogReady();

  const [catalogModel, catalogProvider] = await Promise.all([
    db.catalogModels.get(catalogModelId),
    (async () => {
      const model = await db.catalogModels.get(catalogModelId);
      return model ? db.catalogProviders.get(model.providerCatalogId) : Promise.resolve(undefined);
    })(),
  ]);

  if (!catalogModel || !catalogProvider) {
    throw new Error("Catalog model not found.");
  }

  const existing = await db.models.where("catalogModelId").equals(catalogModel.id).first();
  if (existing) {
    return existing.id;
  }

  const modelId = await createModelEntry({
    providerName: catalogProvider.name,
    providerColor: catalogProvider.color,
    modelName: catalogModel.name,
    modelVersion: catalogModel.version,
    modelComment: "",
    isActive: true,
    sourceType: "catalog",
    catalogModelId: catalogModel.id,
  });

  await db.modelMatches
    .where("[catalogModelId+localModelId]")
    .between([catalogModel.id, Dexie.minKey], [catalogModel.id, Dexie.maxKey])
    .modify({ status: "linked", updatedAt: new Date().toISOString() });

  return modelId;
}

export async function applyCatalogPreset(presetId: string) {
  await ensureCatalogReady();
  const preset = await db.catalogPresets.get(presetId);
  if (!preset) {
    throw new Error("Preset not found.");
  }

  const createdModelIds: string[] = [];
  for (const modelId of preset.modelIds) {
    createdModelIds.push(await createModelFromCatalog(modelId));
  }

  await recomputeModelMatches();
  return createdModelIds;
}

export async function loadCatalogBrowserItems(): Promise<CatalogModelBrowserItem[]> {
  await ensureCatalogReady();

  const [catalogModels, catalogProviders, localModels, localProviders, matches, presets] = await Promise.all([
    db.catalogModels.toArray(),
    db.catalogProviders.toArray(),
    db.models.toArray(),
    db.providers.toArray(),
    db.modelMatches.toArray(),
    db.catalogPresets.toArray(),
  ]);

  const catalogProvidersById = new Map(catalogProviders.map((item) => [item.id, item]));
  const localProvidersById = new Map(localProviders.map((item) => [item.id, item]));
  const localModelsByCatalogId = new Map(localModels.filter((item) => item.catalogModelId).map((item) => [item.catalogModelId!, item]));
  const pendingMatchesByCatalogId = new Map(matches.filter((item) => item.status === "pending").map((item) => [item.catalogModelId, item]));
  const presetIdsByModelId = new Map<string, string[]>();

  for (const preset of presets) {
    for (const modelId of preset.modelIds) {
      const presetIds = presetIdsByModelId.get(modelId) ?? [];
      presetIds.push(preset.id);
      presetIdsByModelId.set(modelId, presetIds);
    }
  }

  return catalogModels
    .map((catalogModel) => {
      const catalogProvider = catalogProvidersById.get(catalogModel.providerCatalogId);
      if (!catalogProvider) {
        return null;
      }

      const linkedLocal = localModelsByCatalogId.get(catalogModel.id) ?? null;
      const pendingMatch = pendingMatchesByCatalogId.get(catalogModel.id) ?? null;
      const linkedProvider = linkedLocal ? localProvidersById.get(linkedLocal.providerId) : null;

      return {
        id: catalogModel.id,
        providerName: catalogProvider.name,
        providerColor: catalogProvider.color,
        displayName: catalogModel.displayName,
        name: catalogModel.name,
        version: catalogModel.version,
        aliases: catalogModel.aliases,
        presetIds: presetIdsByModelId.get(catalogModel.id) ?? [],
        status: catalogModel.status,
        linkedLocalModelId: linkedLocal?.id ?? null,
        linkedLocalLabel:
          linkedLocal && linkedProvider ? getLocalModelLabel(linkedLocal, linkedProvider.name, catalogModel.displayName) : null,
        pendingMatchId: pendingMatch?.id ?? null,
        pendingMatchConfidence: pendingMatch?.confidence ?? null,
      } satisfies CatalogModelBrowserItem;
    })
    .filter((item): item is CatalogModelBrowserItem => item !== null)
    .sort((left, right) => left.providerName.localeCompare(right.providerName) || left.displayName.localeCompare(right.displayName));
}

export async function loadModelMatches(): Promise<ModelMatchItem[]> {
  await ensureCatalogReady();

  const [matches, catalogModels, catalogProviders, localModels, localProviders] = await Promise.all([
    db.modelMatches.toArray(),
    db.catalogModels.toArray(),
    db.catalogProviders.toArray(),
    db.models.toArray(),
    db.providers.toArray(),
  ]);

  const catalogModelsById = new Map(catalogModels.map((item) => [item.id, item]));
  const catalogProvidersById = new Map(catalogProviders.map((item) => [item.id, item]));
  const localModelsById = new Map(localModels.map((item) => [item.id, item]));
  const localProvidersById = new Map(localProviders.map((item) => [item.id, item]));

  return matches
    .filter((item) => item.status === "pending")
    .map((match) => {
      const catalogModel = catalogModelsById.get(match.catalogModelId);
      const localModel = localModelsById.get(match.localModelId);
      if (!catalogModel || !localModel) {
        return null;
      }

      const catalogProvider = catalogProvidersById.get(catalogModel.providerCatalogId);
      const localProvider = localProvidersById.get(localModel.providerId);
      if (!catalogProvider || !localProvider) {
        return null;
      }

      return {
        id: match.id,
        catalogModelId: catalogModel.id,
        catalogDisplayName: catalogModel.displayName,
        catalogProviderName: catalogProvider.name,
        localModelId: localModel.id,
        localLabel: getLocalModelLabel(localModel, localProvider.name),
        matchType: match.matchType,
        confidence: match.confidence,
        status: match.status,
      } satisfies ModelMatchItem;
    })
    .filter((item): item is ModelMatchItem => item !== null)
    .sort((left, right) => right.confidence - left.confidence || left.catalogDisplayName.localeCompare(right.catalogDisplayName));
}

export async function resolveModelMatch(matchId: string, action: "link" | "ignore") {
  const match = await db.modelMatches.get(matchId);
  if (!match) {
    throw new Error("Match not found.");
  }

  if (action === "ignore") {
    await db.modelMatches.update(matchId, {
      status: "ignored",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  await db.models.update(match.localModelId, {
    catalogModelId: match.catalogModelId,
    sourceType: "catalog",
  });
  await db.modelMatches
    .where("[catalogModelId+localModelId]")
    .equals([match.catalogModelId, match.localModelId])
    .modify({ status: "linked", updatedAt: new Date().toISOString() });
  await recomputeModelMatches();
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

export async function loadWrapperOptions(): Promise<WrapperSelectOption[]> {
  const [wrappers, wrapperVersions] = await Promise.all([
    db.wrappers.orderBy("updatedAt").reverse().toArray(),
    db.wrapperVersions.toArray(),
  ]);
  const wrappersById = new Map(wrappers.map((wrapper) => [wrapper.id, wrapper]));

  return [...wrapperVersions]
    .sort((left, right) => {
      const leftWrapper = wrappersById.get(left.wrapperId);
      const rightWrapper = wrappersById.get(right.wrapperId);

      return (
        Date.parse(rightWrapper?.updatedAt ?? right.createdAt) - Date.parse(leftWrapper?.updatedAt ?? left.createdAt) ||
        (right.versionNumber - left.versionNumber) ||
        (leftWrapper?.name ?? "").localeCompare(rightWrapper?.name ?? "")
      );
    })
    .map((version) => {
      const wrapper = wrappersById.get(version.wrapperId);
      if (!wrapper) {
        return null;
      }

      return {
        id: version.id,
        label: `${wrapper.name} v${version.versionNumber}`,
        template: version.template,
        wrapperName: wrapper.name,
        versionNumber: version.versionNumber,
      } satisfies WrapperSelectOption;
    })
    .filter((item): item is WrapperSelectOption => item !== null);
}

export async function loadModelOptions(): Promise<ModelSelectOption[]> {
  await ensureCatalogReady();
  const [models, providers, catalogModels, matches] = await Promise.all([
    db.models.toArray(),
    db.providers.toArray(),
    db.catalogModels.toArray(),
    db.modelMatches.toArray(),
  ]);
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));
  const catalogModelsById = new Map(catalogModels.map((item) => [item.id, item]));
  const pendingCounts = new Map<string, number>();

  for (const match of matches) {
    if (match.status === "pending") {
      pendingCounts.set(match.localModelId, (pendingCounts.get(match.localModelId) ?? 0) + 1);
    }
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
      const providerName = providersById.get(model.providerId)?.name ?? "Unknown";
      const commentPart = model.comment ? ` • ${model.comment}` : "";

      return {
        id: model.id,
        label: `${providerName} / ${model.name} ${model.version}${commentPart}`,
        providerId: model.providerId,
        providerColor: providersById.get(model.providerId)?.color ?? "#5b8def",
        providerName,
        modelName: model.name,
        modelVersion: model.version,
        modelComment: model.comment,
        isActive: model.isActive,
        lastUsedAt: model.lastUsedAt,
        sourceType: model.sourceType,
        catalogModelId: model.catalogModelId,
        catalogDisplayName: model.catalogModelId ? catalogModelsById.get(model.catalogModelId)?.displayName ?? null : null,
        pendingMatchCount: pendingCounts.get(model.id) ?? 0,
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
  sourceType?: "manual" | "catalog";
  catalogModelId?: string | null;
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
      id: crypto.randomUUID(),
      providerId: provider.id,
      name: modelName,
      version: modelVersion,
      comment: modelComment,
      isActive: input.isActive ?? true,
      sourceType: input.sourceType ?? "manual",
      catalogModelId: input.catalogModelId ?? null,
      createdAt: now,
      lastUsedAt: null,
    };
    await db.models.add(modelRecord);
    return modelRecord.id;
  });

  await recomputeModelMatches();

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
  await ensureCatalogReady();
  const [models, providers, results, catalogModels, matches] = await Promise.all([
    db.models.toArray(),
    db.providers.toArray(),
    db.results.toArray(),
    db.catalogModels.toArray(),
    db.modelMatches.toArray(),
  ]);
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));
  const catalogModelsById = new Map(catalogModels.map((item) => [item.id, item]));
  const pendingCounts = new Map<string, number>();
  const stats = new Map<string, { count: number; ratedCount: number; ratingSum: number }>();

  for (const match of matches) {
    if (match.status === "pending") {
      pendingCounts.set(match.localModelId, (pendingCounts.get(match.localModelId) ?? 0) + 1);
    }
  }

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
        sourceType: model.sourceType,
        catalogModelId: model.catalogModelId,
        catalogDisplayName: model.catalogModelId ? catalogModelsById.get(model.catalogModelId)?.displayName ?? null : null,
        pendingMatchCount: pendingCounts.get(model.id) ?? 0,
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

  await recomputeModelMatches();
  await rebuildStatsAggregates();
}

export async function updateModelActive(modelId: string, isActive: boolean) {
  await db.models.update(modelId, { isActive });
}

export async function deleteModelEntry(modelId: string) {
  const linkedResultsCount = await db.results.where("modelId").equals(modelId).count();
  if (linkedResultsCount > 0) {
    throw new Error("This model is used by saved results. Reassign or remove those results first.");
  }

  await db.transaction("rw", [db.models, db.modelMatches], async () => {
    await db.models.delete(modelId);
    await db.modelMatches.where("localModelId").equals(modelId).delete();
  });

  await recomputeModelMatches();
  await rebuildStatsAggregates();
}

export async function loadWrappersCatalog(): Promise<WrapperManagerItem[]> {
  const [wrappers, wrapperVersions, experimentVersions] = await Promise.all([
    db.wrappers.toArray(),
    db.wrapperVersions.toArray(),
    db.experimentVersions.toArray(),
  ]);
  const latestByWrapperId = getLatestWrapperVersions(wrapperVersions);
  const wrapperVersionsById = new Map(wrapperVersions.map((item) => [item.id, item]));
  const counts = new Map<string, number>();

  for (const version of experimentVersions) {
    if (version.wrapperVersionId) {
      const wrapperVersion = wrapperVersionsById.get(version.wrapperVersionId);
      if (wrapperVersion) {
        counts.set(wrapperVersion.wrapperId, (counts.get(wrapperVersion.wrapperId) ?? 0) + 1);
      }
    }
  }

  return [...wrappers]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .map((wrapper) => {
      const latest = latestByWrapperId.get(wrapper.id);
      if (!latest) {
        return null;
      }

      return {
        id: wrapper.id,
        name: wrapper.name,
        template: latest.template,
        latestVersionId: latest.id,
        latestVersionNumber: latest.versionNumber,
        isDefault: wrapper.isDefault,
        usageCount: counts.get(wrapper.id) ?? 0,
        updatedAt: wrapper.updatedAt,
        updatedLabel: formatUpdatedLabel(wrapper.updatedAt),
      } satisfies WrapperManagerItem;
    })
    .filter((item): item is WrapperManagerItem => item !== null);
}

export async function loadWrapperDetail(wrapperId: string): Promise<WrapperDetailData> {
  const [wrapper, versions, experimentVersions] = await Promise.all([
    db.wrappers.get(wrapperId),
    db.wrapperVersions.where("wrapperId").equals(wrapperId).toArray(),
    db.experimentVersions.toArray(),
  ]);

  if (!wrapper) {
    throw new Error("Wrapper not found.");
  }

  if (versions.length === 0) {
    throw new Error("Wrapper has no versions.");
  }

  const usageByVersionId = new Map<string, number>();
  for (const experimentVersion of experimentVersions) {
    if (experimentVersion.wrapperVersionId) {
      usageByVersionId.set(
        experimentVersion.wrapperVersionId,
        (usageByVersionId.get(experimentVersion.wrapperVersionId) ?? 0) + 1,
      );
    }
  }

  const latest = versions.reduce((current, item) =>
    item.versionNumber > current.versionNumber ? item : current,
  );

  const versionItems = [...versions]
    .sort((left, right) => right.versionNumber - left.versionNumber)
    .map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      template: version.template,
      changeNote: version.changeNote,
      createdAt: version.createdAt,
      createdLabel: formatCreatedLabel(version.createdAt),
      usageCount: usageByVersionId.get(version.id) ?? 0,
      isLatest: version.id === latest.id,
    }));

  return {
    id: wrapper.id,
    name: wrapper.name,
    isDefault: wrapper.isDefault,
    createdAt: wrapper.createdAt,
    updatedAt: wrapper.updatedAt,
    updatedLabel: formatUpdatedLabel(wrapper.updatedAt),
    latestVersionId: latest.id,
    latestVersionNumber: latest.versionNumber,
    usageCount: versionItems.reduce((sum, item) => sum + item.usageCount, 0),
    versions: versionItems,
  };
}

export async function createWrapperEntry(input: {
  name: string;
  template: string;
  isDefault: boolean;
  changeNote?: string;
}) {
  const now = new Date().toISOString();
  const name = input.name.trim();
  const template = input.template;
  const wrapperId = crypto.randomUUID();

  if (!name) {
    throw new Error("Wrapper name is required.");
  }

  if (!template.includes("{{prompt}}")) {
    throw new Error("Wrapper template must contain {{prompt}}.");
  }

  await db.transaction("rw", [db.wrappers, db.wrapperVersions], async () => {
    if (input.isDefault) {
      await db.wrappers.toCollection().modify({ isDefault: false, updatedAt: now });
    }

      await db.wrappers.add({
        id: wrapperId,
        name,
        isDefault: input.isDefault,
        createdAt: now,
      updatedAt: now,
    });
    await db.wrapperVersions.add({
      id: crypto.randomUUID(),
      wrapperId,
      versionNumber: 1,
      template,
      changeNote: input.changeNote?.trim() ?? "",
        createdAt: now,
      });
    });

  return wrapperId;
}

export async function updateWrapperMetadata(input: {
  wrapperId: string;
  name: string;
  isDefault: boolean;
}) {
  const now = new Date().toISOString();
  const name = input.name.trim();

  if (!name) {
    throw new Error("Wrapper name is required.");
  }

  await db.transaction("rw", [db.wrappers, db.wrapperVersions], async () => {
    if (input.isDefault) {
      await db.wrappers.toCollection().modify({ isDefault: false, updatedAt: now });
    }

    await db.wrappers.update(input.wrapperId, {
      name,
      isDefault: input.isDefault,
      updatedAt: now,
    });
  });
}

export async function createWrapperVersion(input: {
  wrapperId: string;
  template: string;
  changeNote?: string;
}) {
  const now = new Date().toISOString();

  if (!input.template.includes("{{prompt}}")) {
    throw new Error("Wrapper template must contain {{prompt}}.");
  }

  await db.transaction("rw", [db.wrappers, db.wrapperVersions], async () => {
    const versions = await db.wrapperVersions.where("wrapperId").equals(input.wrapperId).toArray();
    const nextVersionNumber = versions.reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1;

    await db.wrappers.update(input.wrapperId, {
      updatedAt: now,
    });
    await db.wrapperVersions.add({
      id: crypto.randomUUID(),
      wrapperId: input.wrapperId,
      versionNumber: nextVersionNumber,
      template: input.template,
      changeNote: input.changeNote?.trim() ?? "",
      createdAt: now,
    });
  });
}

export async function deleteWrapperVersion(wrapperVersionId: string) {
  const version = await db.wrapperVersions.get(wrapperVersionId);
  if (!version) {
    throw new Error("Wrapper version not found.");
  }

  const [versions, usageCount] = await Promise.all([
    db.wrapperVersions.where("wrapperId").equals(version.wrapperId).toArray(),
    db.experimentVersions.where("wrapperVersionId").equals(wrapperVersionId).count(),
  ]);

  if (usageCount > 0) {
    throw new Error("Wrapper version is still used by experiment versions.");
  }

  if (versions.length <= 1) {
    throw new Error("Cannot delete the last remaining wrapper version.");
  }

  await db.transaction("rw", [db.wrappers, db.wrapperVersions], async () => {
    await db.wrapperVersions.delete(wrapperVersionId);
    await db.wrappers.update(version.wrapperId, {
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function deleteWrapperEntry(wrapperId: string) {
  const versions = await db.wrapperVersions.where("wrapperId").equals(wrapperId).toArray();
  const versionIds = versions.map((item) => item.id);
  const usageCount = versionIds.length
    ? await db.experimentVersions.where("wrapperVersionId").anyOf(versionIds).count()
    : 0;

  if (usageCount > 0) {
    throw new Error("Wrapper is still used by experiment versions.");
  }

  await db.transaction("rw", [db.wrappers, db.wrapperVersions], async () => {
    await db.wrapperVersions.where("wrapperId").equals(wrapperId).delete();
    await db.wrappers.delete(wrapperId);
  });
}

function getExperimentsSortCollection(sort: ExperimentsPageInput["sort"]) {
  switch (sort) {
    case "oldest":
      return db.experiments.orderBy("createdAt");
    case "title":
      return db.experiments.orderBy("title");
    case "newest":
      return db.experiments.orderBy("createdAt").reverse();
    case "updated":
    default:
      return db.experiments.orderBy("updatedAt").reverse();
  }
}

export async function loadExperimentsPage(input: ExperimentsPageInput): Promise<ExperimentsPageResult> {
  const normalizedQuery = input.query.trim().toLowerCase();
  const baseCollection = getExperimentsSortCollection(input.sort);
  const filteredCollection = normalizedQuery
    ? baseCollection.filter((experiment) => experiment.title.toLowerCase().includes(normalizedQuery))
    : baseCollection;
  const [total, experiments, categories, models, providers] = await Promise.all([
    filteredCollection.count(),
    filteredCollection.offset(input.offset).limit(input.limit).toArray(),
    db.categories.toArray(),
    db.models.toArray(),
    db.providers.toArray(),
  ]);

  if (experiments.length === 0) {
    return {
      items: [],
      total,
    };
  }

  const experimentIds = experiments.map((item) => item.id);
  const experimentVersions = await db.experimentVersions.where("experimentId").anyOf(experimentIds).toArray();
  const experimentVersionIds = experimentVersions.map((item) => item.id);
  const results = experimentVersionIds.length
    ? await db.results.where("experimentVersionId").anyOf(experimentVersionIds).toArray()
    : [];

  const categoriesById = new Map(categories.map((item) => [item.id, item]));
  const modelsById = new Map(models.map((item) => [item.id, item]));
  const providersById = new Map(providers.map((item) => [item.id, item]));
  const experimentVersionsByExperiment = new Map<string, typeof experimentVersions>();

  for (const version of experimentVersions) {
    const list = experimentVersionsByExperiment.get(version.experimentId) ?? [];
    list.push(version);
    experimentVersionsByExperiment.set(version.experimentId, list);
  }

  const resultsByExperimentVersion = new Map<string, typeof results>();
  for (const result of results) {
    const list = resultsByExperimentVersion.get(result.experimentVersionId) ?? [];
    list.push(result);
    resultsByExperimentVersion.set(result.experimentVersionId, list);
  }

  const items = experiments.map((experiment) => {
    const category = experiment.categoryId ? categoriesById.get(experiment.categoryId) : undefined;
    const versions = experimentVersionsByExperiment.get(experiment.id) ?? [];
    const experimentResults = versions.flatMap((item) => resultsByExperimentVersion.get(item.id) ?? []);
    const ratedResults = experimentResults.filter((item) => item.rating !== null);
    const avgRating = ratedResults.length
      ? ratedResults.reduce((sum, item) => sum + (item.rating ?? 0), 0) / ratedResults.length
      : null;
    const topResult =
      [...experimentResults].sort((left, right) => {
        const leftRating = left.rating ?? -1;
        const rightRating = right.rating ?? -1;
        return rightRating - leftRating || Date.parse(right.createdAt) - Date.parse(left.createdAt);
      })[0] ?? null;
    const topResultModel = topResult ? modelsById.get(topResult.modelId) : null;
    const topResultProvider =
      topResultModel ? providersById.get(topResultModel.providerId) ?? null : null;

    return {
      id: experiment.id,
      title: experiment.title,
      description: experiment.description,
      categoryId: experiment.categoryId,
      categoryName: category?.name ?? "No category",
      categoryColor: category?.color ?? "#71717a",
      tags: experiment.tags,
      versionCount: versions.length,
      resultCount: experimentResults.length,
      avgRating,
      createdAt: experiment.createdAt,
      updatedAt: experiment.updatedAt,
      createdLabel: formatCreatedLabel(experiment.createdAt),
      updatedLabel: formatUpdatedLabel(experiment.updatedAt),
      topResultPreview:
        topResult && topResultModel && topResultProvider
          ? {
              resultId: topResult.id,
              rating: topResult.rating,
              providerName: topResultProvider.name,
              providerColor: topResultProvider.color,
              modelName: topResultModel.name,
              modelVersion: topResultModel.version,
            }
          : null,
    } satisfies ExperimentListItem;
  });

  return {
    items,
    total,
  };
}

export async function loadExperimentPreviewHtml(resultId: string): Promise<string | null> {
  const result = await db.results.get(resultId);
  return result?.htmlContent ?? null;
}

export async function loadResultHtmlContent(resultId: string): Promise<string | null> {
  const result = await db.results.get(resultId);
  return result?.htmlContent ?? null;
}

export async function loadExperimentWorkspace(experimentId: string): Promise<ExperimentWorkspace | null> {
  const experiment = await db.experiments.get(experimentId);

  if (!experiment) {
    return null;
  }

  const [category, experimentVersions, wrapperVersions, wrappers] = await Promise.all([
    experiment.categoryId ? db.categories.get(experiment.categoryId) : Promise.resolve(undefined),
    db.experimentVersions.where("experimentId").equals(experiment.id).sortBy("versionNumber"),
    db.wrapperVersions.toArray(),
    db.wrappers.toArray(),
  ]);

  const experimentVersionIds = experimentVersions.map((item) => item.id);
  const rawResults = experimentVersionIds.length
    ? await db.results.where("experimentVersionId").anyOf(experimentVersionIds).toArray()
    : [];

  const modelIds = [...new Set(rawResults.map((item) => item.modelId))];
  const models = modelIds.length ? await db.models.bulkGet(modelIds) : [];
  const providerIds = [...new Set(models.filter(Boolean).map((item) => item!.providerId))];
  const providers = providerIds.length ? await db.providers.bulkGet(providerIds) : [];

  const modelsById = new Map(models.filter(Boolean).map((item) => [item!.id, item!]));
  const providersById = new Map(providers.filter(Boolean).map((item) => [item!.id, item!]));
  const experimentVersionsById = new Map(experimentVersions.map((item) => [item.id, item]));
  const wrapperVersionsById = new Map(wrapperVersions.map((item) => [item.id, item]));
  const wrappersById = new Map(wrappers.map((item) => [item.id, item]));

  const results: WorkspaceResultItem[] = rawResults
    .map((result) => {
      const model = modelsById.get(result.modelId);
      const experimentVersion = experimentVersionsById.get(result.experimentVersionId);
      const provider = model ? providersById.get(model.providerId) : undefined;
      const wrapperVersion = result.wrapperVersionId ? wrapperVersionsById.get(result.wrapperVersionId) : undefined;
      const wrapper = wrapperVersion ? wrappersById.get(wrapperVersion.wrapperId) : undefined;

      if (!model || !experimentVersion || !provider) {
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
        experimentVersionId: experimentVersion.id,
        experimentVersionNumber: experimentVersion.versionNumber,
        promptVersionNumber: experimentVersion.versionNumber,
        attempt: result.attempt,
        rating: result.rating,
        notes: result.notes,
        composedPromptSnapshot: result.composedPromptSnapshot,
        promptTextSnapshot: result.promptTextSnapshot,
        wrapperVersionId: result.wrapperVersionId,
        wrapperName: result.wrapperNameSnapshot ?? wrapper?.name ?? "No wrapper",
        wrapperVersionNumber: wrapperVersion?.versionNumber ?? null,
        wrapperTemplateSnapshot: result.wrapperTemplateSnapshot,
        fileSizeBytes: result.fileSizeBytes,
        lineCount: result.lineCount,
        createdAt: result.createdAt,
        createdLabel: formatResultDate(result.createdAt),
      } satisfies WorkspaceResultItem;
    })
    .filter((item): item is WorkspaceResultItem => item !== null)
    .sort(sortResults);

  const resultCountsByExperimentVersionId = new Map<string, number>();
  for (const result of results) {
    resultCountsByExperimentVersionId.set(
      result.experimentVersionId,
      (resultCountsByExperimentVersionId.get(result.experimentVersionId) ?? 0) + 1,
    );
  }

  const versions = [...experimentVersions]
    .sort((left, right) => right.versionNumber - left.versionNumber)
    .map((item) => {
      const wrapperVersion = item.wrapperVersionId ? wrapperVersionsById.get(item.wrapperVersionId) : undefined;
      const wrapper = wrapperVersion ? wrappersById.get(wrapperVersion.wrapperId) : undefined;

      return {
        id: item.id,
        versionNumber: item.versionNumber,
        promptText: item.promptText,
        wrapperVersionId: item.wrapperVersionId,
        wrapperName: wrapper?.name ?? "No wrapper",
        wrapperVersionNumber: wrapperVersion?.versionNumber ?? null,
        wrapperTemplate: wrapperVersion?.template ?? "",
        changeNote: item.changeNote,
        createdAt: item.createdAt,
        resultCount: resultCountsByExperimentVersionId.get(item.id) ?? 0,
      };
    });

  return {
    id: experiment.id,
    title: experiment.title,
    description: experiment.description,
    categoryId: experiment.categoryId,
    categoryName: category?.name ?? "No category",
    categoryColor: category?.color ?? "#71717a",
    tags: experiment.tags,
    createdAt: experiment.createdAt,
    updatedAt: experiment.updatedAt,
    versions,
    promptVersions: versions,
    results,
  };
}

export async function updateResultNotes(resultId: string, notes: string) {
  await db.results.update(resultId, { notes });
}

export async function updateResultRating(resultId: string, rating: number | null) {
  await db.results.update(resultId, { rating });
  await rebuildStatsAggregates();
}

export async function updateResultEntry(input: {
  resultId: string;
  experimentId: string;
  modelId: string;
  htmlContent: string;
  notes: string;
}) {
  const now = new Date().toISOString();
  const htmlContent = input.htmlContent.trim();
  const notes = input.notes.trim();

  await db.transaction("rw", [db.results, db.models, db.experiments], async () => {
    const result = await db.results.get(input.resultId);
    if (!result) {
      throw new Error("Result no longer exists.");
    }

    const nextModel = await db.models.get(input.modelId);
    if (!nextModel) {
      throw new Error("Selected model no longer exists.");
    }

    const previousModelId = result.modelId;
    let nextAttempt = result.attempt;

    if (previousModelId !== input.modelId) {
      const previousAttempts = await db.results
        .where("[experimentVersionId+modelId+attempt]")
        .between([result.experimentVersionId, input.modelId, Dexie.minKey], [result.experimentVersionId, input.modelId, Dexie.maxKey])
        .toArray();
      nextAttempt = previousAttempts.filter((item) => item.id !== result.id).length + 1;
    }

    await db.results.update(input.resultId, {
      modelId: input.modelId,
      attempt: nextAttempt,
      htmlContent,
      notes,
      fileSizeBytes: new Blob([htmlContent]).size,
      lineCount: countLines(htmlContent),
    });

    const oldModelResults =
      previousModelId !== input.modelId ? await db.results.where("modelId").equals(previousModelId).toArray() : [];
    const newModelResults = await db.results.where("modelId").equals(input.modelId).toArray();

    if (previousModelId !== input.modelId) {
      const oldLastUsedAt =
        oldModelResults.length > 0
          ? oldModelResults.reduce((latest, item) =>
              Date.parse(item.createdAt) > Date.parse(latest.createdAt) ? item : latest,
            ).createdAt
          : null;
      await db.models.update(previousModelId, { lastUsedAt: oldLastUsedAt });
    }

    const newLastUsedAt =
      newModelResults.length > 0
        ? newModelResults.reduce((latest, item) =>
            Date.parse(item.createdAt) > Date.parse(latest.createdAt) ? item : latest,
          ).createdAt
        : null;
    await db.models.update(input.modelId, { lastUsedAt: newLastUsedAt });

    await db.experiments.update(input.experimentId, { updatedAt: now });
  });

  await rebuildStatsAggregates();
}

export async function deleteResultEntry(input: { resultId: string; experimentId: string }) {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.results, db.models, db.experiments], async () => {
    const result = await db.results.get(input.resultId);
    await db.results.delete(input.resultId);

    if (result) {
      const latestRemaining = await db.results.where("modelId").equals(result.modelId).toArray();
      const lastUsedAt =
        latestRemaining.length > 0
          ? latestRemaining.reduce((latest, item) =>
              Date.parse(item.createdAt) > Date.parse(latest.createdAt) ? item : latest,
            ).createdAt
          : null;

      await db.models.update(result.modelId, {
        lastUsedAt,
      });
    }

    await db.experiments.update(input.experimentId, { updatedAt: now });
  });

  await rebuildStatsAggregates();
}

export async function createExperimentWithInitialPrompt(input: {
  title: string;
  description: string;
  categoryId: string | null;
  wrapperVersionId: string | null;
  tags: string[];
  promptText: string;
  changeNote: string;
}) {
  const now = new Date().toISOString();
  const experimentId = crypto.randomUUID();
  const experimentVersionId = crypto.randomUUID();

  await db.transaction("rw", [db.experiments, db.experimentVersions], async () => {
    await db.experiments.add({
      id: experimentId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    });

    await db.experimentVersions.add({
      id: experimentVersionId,
      experimentId,
      versionNumber: 1,
      promptText: input.promptText,
      wrapperVersionId: input.wrapperVersionId,
      changeNote: input.changeNote,
      createdAt: now,
    });
  });

  return experimentId;
}

export async function createResultEntry(input: {
  experimentId: string;
  experimentVersionId: string;
  modelId: string;
  htmlContent: string;
  rating: number | null;
  notes: string;
}) {
  const now = new Date().toISOString();
  const htmlContent = input.htmlContent.trim();
  const notes = input.notes.trim();
  const resultId = crypto.randomUUID();

  await db.transaction("rw", [db.models, db.results, db.experiments, db.experimentVersions, db.wrapperVersions, db.wrappers], async () => {
    const model = await db.models.get(input.modelId);
    if (!model) {
      throw new Error("Selected model no longer exists.");
    }
    const experimentVersion = await db.experimentVersions.get(input.experimentVersionId);
    if (!experimentVersion) {
      throw new Error("Selected experiment version no longer exists.");
    }
    const wrapperVersion = experimentVersion.wrapperVersionId
      ? await db.wrapperVersions.get(experimentVersion.wrapperVersionId)
      : undefined;
    const wrapper = wrapperVersion ? await db.wrappers.get(wrapperVersion.wrapperId) : undefined;
    const composedPromptSnapshot = buildPromptForClipboard(experimentVersion.promptText, wrapperVersion?.template ?? null);

    const previousAttempts = await db.results
      .where("[experimentVersionId+modelId+attempt]")
      .between([input.experimentVersionId, model.id, Dexie.minKey], [input.experimentVersionId, model.id, Dexie.maxKey])
      .toArray();

    await db.results.add({
      id: resultId,
      experimentVersionId: input.experimentVersionId,
      modelId: model.id,
      attempt: previousAttempts.length + 1,
      composedPromptSnapshot,
      promptTextSnapshot: experimentVersion.promptText,
      wrapperVersionId: experimentVersion.wrapperVersionId,
      wrapperNameSnapshot: wrapper?.name ?? null,
      wrapperTemplateSnapshot: wrapperVersion?.template ?? null,
      htmlContent,
      rating: input.rating,
      notes,
      fileSizeBytes: new Blob([htmlContent]).size,
      lineCount: countLines(htmlContent),
      createdAt: now,
    });

    await db.models.update(model.id, { lastUsedAt: now });
    await db.experiments.update(input.experimentId, { updatedAt: now });
  });

  await rebuildStatsAggregates();

  return resultId;
}

export async function updateExperimentEntry(input: {
  experimentId: string;
  title: string;
  description: string;
  categoryId: string | null;
  tags: string[];
}) {
  const now = new Date().toISOString();

  await db.experiments.update(input.experimentId, {
    title: input.title.trim(),
    description: input.description.trim(),
    categoryId: input.categoryId,
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

export async function createExperimentVersionEntry(input: {
  experimentId: string;
  promptText: string;
  wrapperVersionId: string | null;
  changeNote: string;
}) {
  const now = new Date().toISOString();

  const versions = await db.experimentVersions.where("experimentId").equals(input.experimentId).toArray();
  const nextVersionNumber =
    versions.reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1;

  const experimentVersionId = crypto.randomUUID();

  await db.transaction("rw", [db.experimentVersions, db.experiments], async () => {
    await db.experimentVersions.add({
      id: experimentVersionId,
      experimentId: input.experimentId,
      versionNumber: nextVersionNumber,
      promptText: input.promptText,
      wrapperVersionId: input.wrapperVersionId,
      changeNote: input.changeNote,
      createdAt: now,
    });
    await db.experiments.update(input.experimentId, { updatedAt: now });
  });

  return experimentVersionId;
}

export const createPromptVersionEntry = createExperimentVersionEntry;

export async function updateExperimentVersionEntry(input: {
  experimentVersionId: string;
  experimentId: string;
  promptText: string;
  wrapperVersionId: string | null;
  changeNote: string;
}) {
  const now = new Date().toISOString();
  const promptText = input.promptText.trim();
  const changeNote = input.changeNote.trim();

  await db.transaction("rw", [db.experimentVersions, db.results, db.experiments], async () => {
    const version = await db.experimentVersions.get(input.experimentVersionId);
    if (!version) {
      throw new Error("Experiment version no longer exists.");
    }

    const resultCount = await db.results.where("experimentVersionId").equals(input.experimentVersionId).count();
    if (resultCount > 0) {
      throw new Error("Prompt text and wrapper can only be edited before results are attached.");
    }

    await db.experimentVersions.update(input.experimentVersionId, {
      promptText,
      wrapperVersionId: input.wrapperVersionId,
      changeNote,
    });

    await db.experiments.update(input.experimentId, { updatedAt: now });
  });
}

export async function updateExperimentVersionChangeNote(input: {
  experimentVersionId: string;
  experimentId: string;
  changeNote: string;
}) {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.experimentVersions, db.experiments], async () => {
    const version = await db.experimentVersions.get(input.experimentVersionId);
    if (!version) {
      throw new Error("Experiment version no longer exists.");
    }

    await db.experimentVersions.update(input.experimentVersionId, {
      changeNote: input.changeNote.trim(),
    });

    await db.experiments.update(input.experimentId, { updatedAt: now });
  });
}

export async function deleteExperimentVersionEntry(experimentVersionId: string) {
  const version = await db.experimentVersions.get(experimentVersionId);
  if (!version) {
    throw new Error("Experiment version no longer exists.");
  }

  const [versions, resultCount] = await Promise.all([
    db.experimentVersions.where("experimentId").equals(version.experimentId).toArray(),
    db.results.where("experimentVersionId").equals(experimentVersionId).count(),
  ]);

  if (resultCount > 0) {
    throw new Error("Experiment version is still used by saved results.");
  }

  if (versions.length <= 1) {
    throw new Error("Cannot delete the last remaining experiment version.");
  }

  await db.transaction("rw", [db.experimentVersions, db.experiments], async () => {
    await db.experimentVersions.delete(experimentVersionId);
    await db.experiments.update(version.experimentId, {
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function loadStatsDashboard(): Promise<StatsDashboardData> {
  const [workspaceStats, modelAggregateRows, providerAggregateRows, categories, experiments, experimentVersions, results, models, providers] = await Promise.all([
    db.statsWorkspace.get("workspace"),
    db.statsModels.toArray(),
    db.statsProviders.toArray(),
    db.categories.toArray(),
    db.experiments.toArray(),
    db.experimentVersions.toArray(),
    db.results.toArray(),
    db.models.toArray(),
    db.providers.toArray(),
  ]);

  if (!workspaceStats && results.length > 0) {
    await rebuildStatsAggregates();
    return loadStatsDashboard();
  }

  const categoriesById = new Map(categories.map((item) => [item.id, item]));
  const experimentVersionsById = new Map(experimentVersions.map((item) => [item.id, item]));
  const experimentsById = new Map(experiments.map((item) => [item.id, item]));
  const modelsById = new Map(models.map((item) => [item.id, item]));
  const providersById = new Map(providers.map((item) => [item.id, item]));
  const ratedResults = results.filter((item) => item.rating !== null);
  const averageRating =
    workspaceStats && workspaceStats.ratedResultsCount > 0
      ? workspaceStats.ratingSum / workspaceStats.ratedResultsCount
      : null;

  const summary: StatsSummaryCard[] = [
    {
      label: "Experiments",
      value: String(experiments.length),
      helper: `${experimentVersions.length} version${experimentVersions.length === 1 ? "" : "s"}`,
    },
    {
      label: "Results",
      value: String(workspaceStats?.resultsCount ?? results.length),
      helper: `${workspaceStats?.ratedResultsCount ?? ratedResults.length} rated`,
    },
    {
      label: "Models used",
      value: String(workspaceStats?.usedModelsCount ?? new Set(results.map((item) => item.modelId)).size),
      helper: `${providers.length} provider${providers.length === 1 ? "" : "s"}`,
    },
    {
      label: "Average rating",
      value: averageRating ? averageRating.toFixed(1) : "—",
      helper: averageRating ? "Across all rated results" : "No ratings yet",
    },
  ];

  const leaderboard = modelAggregateRows
    .map((stats) => {
      const model = modelsById.get(stats.modelId);
      const provider = model ? providersById.get(model.providerId) : undefined;

      if (!model || !provider || stats.ratedCount === 0) {
        return null;
      }

      return {
        modelId: stats.modelId,
        providerName: provider.name,
        providerColor: provider.color,
        modelName: model.name,
        modelVersion: model.version,
        avgRating: stats.ratingSum / stats.ratedCount,
        ratedCount: stats.ratedCount,
        winRate:
          stats.experimentsParticipatedCount > 0 ? (stats.wins / stats.experimentsParticipatedCount) * 100 : 0,
      } satisfies StatsLeaderboardItem;
    })
    .filter((item): item is StatsLeaderboardItem => item !== null)
    .sort((left, right) => right.avgRating - left.avgRating || right.ratedCount - left.ratedCount);

  const providerBreakdown = providerAggregateRows
    .map((stats) => {
      const provider = providersById.get(stats.providerId);
      if (!provider || stats.ratedCount === 0) {
        return null;
      }

      return {
        providerId: stats.providerId,
        providerName: provider.name,
        providerColor: provider.color,
        avgRating: stats.ratingSum / stats.ratedCount,
        resultsCount: stats.resultsCount,
      } satisfies StatsProviderBreakdownItem;
    })
    .filter((item): item is StatsProviderBreakdownItem => item !== null)
    .sort((left, right) => right.avgRating - left.avgRating);

  const categoryModelStats = new Map<string, Map<string, { sum: number; ratedCount: number }>>();

  for (const result of ratedResults) {
    const experimentVersion = experimentVersionsById.get(result.experimentVersionId);
    const experiment = experimentVersion ? experimentsById.get(experimentVersion.experimentId) : undefined;
    const categoryKey = experiment?.categoryId ?? "uncategorized";
    const modelMap = categoryModelStats.get(categoryKey) ?? new Map<string, { sum: number; ratedCount: number }>();
    const current = modelMap.get(result.modelId) ?? { sum: 0, ratedCount: 0 };
    current.sum += result.rating ?? 0;
    current.ratedCount += 1;
    modelMap.set(result.modelId, current);
    categoryModelStats.set(categoryKey, modelMap);
  }

  const topCategoryModels = leaderboard.slice(0, 5).map((item) => ({
    modelId: item.modelId,
    label: `${item.providerName} / ${item.modelName} ${item.modelVersion}`,
    providerColor: item.providerColor,
  }));

  const categoryMatrix = [...categoryModelStats.entries()]
    .map(([categoryId, stats]) => {
      const category = categoryId === "uncategorized" ? null : categoriesById.get(categoryId);

      return {
        categoryId,
        categoryName: category?.name ?? "No category",
        color: category?.color ?? "#71717a",
        values: topCategoryModels.map((model) => {
          const current = stats.get(model.modelId);
          return {
            modelId: model.modelId,
            avgRating: current && current.ratedCount > 0 ? current.sum / current.ratedCount : null,
            resultsCount: current?.ratedCount ?? 0,
          };
        }),
      } satisfies StatsCategoryMatrixRow;
    })
    .sort((left, right) => left.categoryName.localeCompare(right.categoryName));

  const historyMap = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const result of ratedResults) {
    const day = result.createdAt.slice(0, 10);
    const series = historyMap.get(result.modelId) ?? new Map<string, { sum: number; count: number }>();
    const current = series.get(day) ?? { sum: 0, count: 0 };
    current.sum += result.rating ?? 0;
    current.count += 1;
    series.set(day, current);
    historyMap.set(result.modelId, series);
  }

  const ratingHistory = leaderboard.slice(0, 4).map((item) => {
    const series = historyMap.get(item.modelId) ?? new Map<string, { sum: number; count: number }>();
    return {
      modelId: item.modelId,
      label: `${item.providerName} / ${item.modelName} ${item.modelVersion}`,
      color: item.providerColor,
      points: [...series.entries()]
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([date, point]) => ({
          date,
          avgRating: point.sum / point.count,
        })),
    } satisfies StatsHistorySeries;
  });

  return {
    summary,
    leaderboard,
    providerBreakdown,
    categoryModels: topCategoryModels,
    categoryMatrix,
    ratingHistory,
  };
}
