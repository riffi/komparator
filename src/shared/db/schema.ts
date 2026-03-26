import Dexie, { type Table } from "dexie";
import {
  CatalogModelRecord,
  CatalogPresetRecord,
  CatalogProviderRecord,
  CatalogStateRecord,
  CategoryRecord,
  ExperimentVersionRecord,
  ExperimentRecord,
  ModelRecord,
  ModelMatchRecord,
  PromptVersionRecord,
  ProviderRecord,
  ResultRecord,
  StatsModelRecord,
  StatsProviderRecord,
  StatsWorkspaceRecord,
  WrapperRecord,
  WrapperVersionRecord,
} from "@/entities/experiment/model/types";
import { buildPromptForClipboard } from "@/shared/lib/prompt";

export class KomparatorDb extends Dexie {
  categories!: Table<CategoryRecord, string>;
  wrappers!: Table<WrapperRecord, string>;
  wrapperVersions!: Table<WrapperVersionRecord, string>;
  experiments!: Table<ExperimentRecord, string>;
  promptVersions!: Table<PromptVersionRecord, string>;
  experimentVersions!: Table<ExperimentVersionRecord, string>;
  providers!: Table<ProviderRecord, string>;
  models!: Table<ModelRecord, string>;
  catalogState!: Table<CatalogStateRecord, string>;
  catalogProviders!: Table<CatalogProviderRecord, string>;
  catalogModels!: Table<CatalogModelRecord, string>;
  catalogPresets!: Table<CatalogPresetRecord, string>;
  modelMatches!: Table<ModelMatchRecord, string>;
  results!: Table<ResultRecord, string>;
  statsWorkspace!: Table<StatsWorkspaceRecord, string>;
  statsModels!: Table<StatsModelRecord, string>;
  statsProviders!: Table<StatsProviderRecord, string>;

  constructor() {
    super("komparator");

    this.version(1).stores({
      categories: "id, name, sortOrder",
      wrappers: "id, name, isDefault, updatedAt",
      experiments: "id, status, categoryId, wrapperId, createdAt, updatedAt",
      promptVersions: "id, experimentId, [experimentId+versionNumber]",
      providers: "id, name, isActive",
      models: "id, providerId, [providerId+name+version+comment], isActive",
      results: "id, promptVersionId, modelId, [promptVersionId+modelId+attempt], createdAt, rating",
    });

    this.version(2)
      .stores({
        categories: "id, name, sortOrder",
        wrappers: "id, name, isDefault, updatedAt",
        experiments: "id, categoryId, wrapperId, createdAt, updatedAt",
        promptVersions: "id, experimentId, [experimentId+versionNumber]",
        providers: "id, name, isActive",
        models: "id, providerId, [providerId+name+version+comment], isActive",
        results: "id, promptVersionId, modelId, [promptVersionId+modelId+attempt], createdAt, rating",
      })
      .upgrade(async (tx) => {
        await tx.table("experiments").toCollection().modify((experiment) => {
          delete experiment.status;
        });
      });

    this.version(3).stores({
      categories: "id, name, sortOrder",
      wrappers: "id, name, isDefault, updatedAt",
      experiments: "id, title, categoryId, wrapperId, createdAt, updatedAt",
      promptVersions: "id, experimentId, [experimentId+versionNumber]",
      providers: "id, name, isActive",
      models: "id, providerId, [providerId+name+version+comment], isActive",
      results: "id, promptVersionId, modelId, [promptVersionId+modelId+attempt], createdAt, rating",
    });

    this.version(4)
      .stores({
        categories: "id, name, sortOrder",
        wrappers: "id, name, isDefault, updatedAt",
        experiments: "id, title, categoryId, wrapperId, createdAt, updatedAt",
        promptVersions: "id, experimentId, [experimentId+versionNumber]",
        providers: "id, name, isActive",
        models: "id, providerId, [providerId+name+version+comment], isActive, lastUsedAt",
        results: "id, promptVersionId, modelId, [promptVersionId+modelId+attempt], createdAt, rating",
      })
      .upgrade(async (tx) => {
        const results = await tx.table("results").toArray();
        const lastUsedByModel = new Map<string, string>();

        for (const result of results) {
          const current = lastUsedByModel.get(result.modelId);
          if (!current || Date.parse(result.createdAt) > Date.parse(current)) {
            lastUsedByModel.set(result.modelId, result.createdAt);
          }
        }

        await tx.table("models").toCollection().modify((model) => {
          model.lastUsedAt = lastUsedByModel.get(model.id) ?? null;
        });
      });

    this.version(5)
      .stores({
        categories: "id, name, sortOrder",
        wrappers: "id, name, isDefault, updatedAt",
        experiments: "id, title, categoryId, wrapperId, createdAt, updatedAt",
        promptVersions: "id, experimentId, [experimentId+versionNumber]",
        providers: "id, name, isActive",
        models: "id, providerId, [providerId+name+version+comment], isActive, sourceType, catalogModelId, lastUsedAt",
        results: "id, promptVersionId, modelId, [promptVersionId+modelId+attempt], createdAt, rating",
        statsWorkspace: "id, updatedAt",
        statsModels: "modelId, updatedAt",
        statsProviders: "providerId, updatedAt",
      })
      .upgrade(async (tx) => {
        const [experiments, promptVersions, providers, models, results] = await Promise.all([
          tx.table("experiments").toArray(),
          tx.table("promptVersions").toArray(),
          tx.table("providers").toArray(),
          tx.table("models").toArray(),
          tx.table("results").toArray(),
        ]);

        const now = new Date().toISOString();
        const promptVersionsById = new Map(promptVersions.map((item) => [item.id, item]));
        const modelStats = new Map<string, StatsModelRecord>();
        const providerStats = new Map<string, StatsProviderRecord>();
        const experimentWinners = new Map<string, { topRating: number; modelIds: Set<string> }>();
        let ratedResultsCount = 0;
        let ratingSum = 0;

        for (const result of results) {
          const model = models.find((item) => item.id === result.modelId);
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

            const promptVersion = promptVersionsById.get(result.promptVersionId);
            if (promptVersion) {
              const winnerRecord = experimentWinners.get(promptVersion.experimentId);
              if (!winnerRecord || result.rating > winnerRecord.topRating) {
                experimentWinners.set(promptVersion.experimentId, {
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

          for (const result of results) {
            if (result.modelId !== model.id) {
              continue;
            }

            const promptVersion = promptVersionsById.get(result.promptVersionId);
            if (promptVersion) {
              experimentsParticipated.add(promptVersion.experimentId);
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

        await tx.table("statsWorkspace").clear();
        await tx.table("statsModels").clear();
        await tx.table("statsProviders").clear();
        await tx.table("statsWorkspace").add({
          id: "workspace",
          experimentsCount: experiments.length,
          promptVersionsCount: promptVersions.length,
          resultsCount: results.length,
          ratedResultsCount,
          usedModelsCount: new Set(results.map((item) => item.modelId)).size,
          providersCount: providers.length,
          ratingSum,
          updatedAt: now,
        });
        if (modelStats.size > 0) {
          await tx.table("statsModels").bulkAdd([...modelStats.values()]);
        }
        if (providerStats.size > 0) {
          await tx.table("statsProviders").bulkAdd([...providerStats.values()]);
        }
      });

    this.version(6)
      .stores({
        categories: "id, name, sortOrder",
        wrappers: "id, name, isDefault, updatedAt",
        experiments: "id, title, categoryId, wrapperId, createdAt, updatedAt",
        promptVersions: "id, experimentId, [experimentId+versionNumber]",
        providers: "id, name, isActive",
        models: "id, providerId, [providerId+name+version+comment], isActive, sourceType, catalogModelId, lastUsedAt",
        catalogState: "id, version, importedAt",
        catalogProviders: "id, canonicalSlug, name, isActive",
        catalogModels: "id, providerCatalogId, displayName, status",
        catalogPresets: "id, title",
        modelMatches: "id, catalogModelId, localModelId, status, [catalogModelId+localModelId]",
        results: "id, promptVersionId, modelId, [promptVersionId+modelId+attempt], createdAt, rating",
        statsWorkspace: "id, updatedAt",
        statsModels: "modelId, updatedAt",
        statsProviders: "providerId, updatedAt",
      })
      .upgrade(async (tx) => {
        await tx.table("models").toCollection().modify((model) => {
          model.sourceType = model.sourceType ?? "manual";
          model.catalogModelId = model.catalogModelId ?? null;
        });
      });

    this.version(7).stores({
      categories: "id, name, sortOrder",
      wrappers: "id, name, isDefault, updatedAt",
      experiments: "id, title, categoryId, wrapperId, createdAt, updatedAt",
      promptVersions: "id, experimentId, [experimentId+versionNumber]",
      providers: "id, name, isActive",
      models: "id, providerId, [providerId+name+version+comment], isActive, sourceType, catalogModelId, lastUsedAt",
      catalogState: "id, version, importedAt",
      catalogProviders: "id, canonicalSlug, name, isActive",
      catalogModels: "id, providerCatalogId, displayName, status",
      catalogPresets: "id, title",
      modelMatches: "id, catalogModelId, localModelId, status, [catalogModelId+localModelId]",
      results: "id, promptVersionId, modelId, [promptVersionId+modelId+attempt], createdAt, rating",
      statsWorkspace: "id, updatedAt",
      statsModels: "modelId, updatedAt",
      statsProviders: "providerId, updatedAt",
    });

    this.version(8)
      .stores({
        categories: "id, name, sortOrder",
        wrappers: "id, name, isDefault, updatedAt",
        wrapperVersions: "id, wrapperId, [wrapperId+versionNumber], createdAt",
        experiments: "id, title, categoryId, createdAt, updatedAt",
        promptVersions: null,
        experimentVersions: "id, experimentId, [experimentId+versionNumber], wrapperVersionId",
        providers: "id, name, isActive",
        models: "id, providerId, [providerId+name+version+comment], isActive, sourceType, catalogModelId, lastUsedAt",
        catalogState: "id, version, importedAt",
        catalogProviders: "id, canonicalSlug, name, isActive",
        catalogModels: "id, providerCatalogId, displayName, status",
        catalogPresets: "id, title",
        modelMatches: "id, catalogModelId, localModelId, status, [catalogModelId+localModelId]",
        results: "id, experimentVersionId, modelId, wrapperVersionId, [experimentVersionId+modelId+attempt], createdAt, rating",
        statsWorkspace: "id, updatedAt",
        statsModels: "modelId, updatedAt",
        statsProviders: "providerId, updatedAt",
      })
      .upgrade(async (tx) => {
        const [wrappers, experiments, promptVersions, results] = await Promise.all([
          tx.table("wrappers").toArray() as Promise<Array<WrapperRecord & { template?: string }>>,
          tx.table("experiments").toArray() as Promise<Array<ExperimentRecord & { wrapperId?: string | null }>>,
          tx.table("promptVersions").toArray() as Promise<Array<PromptVersionRecord>>,
          tx.table("results").toArray() as Promise<Array<ResultRecord & { promptVersionId?: string }>>,
        ]);

        const now = new Date().toISOString();
        const wrapperVersionRows: WrapperVersionRecord[] = wrappers.map((wrapper) => ({
          id: crypto.randomUUID(),
          wrapperId: wrapper.id,
          versionNumber: 1,
          template: wrapper.template ?? "{{prompt}}",
          changeNote: "",
          createdAt: wrapper.createdAt ?? now,
        }));
        const wrapperVersionIdByWrapperId = new Map(wrapperVersionRows.map((item) => [item.wrapperId, item.id]));

        const experimentVersionRows: ExperimentVersionRecord[] = promptVersions.map((version) => {
          const experiment = experiments.find((item) => item.id === version.experimentId);
          const wrapperVersionId = experiment?.wrapperId ? wrapperVersionIdByWrapperId.get(experiment.wrapperId) ?? null : null;
          return {
            id: version.id,
            experimentId: version.experimentId,
            versionNumber: version.versionNumber,
            promptText: version.promptText,
            wrapperVersionId,
            changeNote: version.changeNote,
            createdAt: version.createdAt,
          };
        });
        const experimentVersionsById = new Map(experimentVersionRows.map((item) => [item.id, item]));
        const wrapperVersionsById = new Map(wrapperVersionRows.map((item) => [item.id, item]));
        const wrappersById = new Map(wrappers.map((item) => [item.id, item]));

        await tx.table("wrapperVersions").bulkAdd(wrapperVersionRows);
        await tx.table("experimentVersions").bulkAdd(experimentVersionRows);

        await tx.table("results").toCollection().modify((result) => {
          const legacyPromptVersionId = result.promptVersionId ?? result.experimentVersionId;
          const experimentVersion = experimentVersionsById.get(legacyPromptVersionId);
          const wrapperVersion = experimentVersion?.wrapperVersionId
            ? wrapperVersionsById.get(experimentVersion.wrapperVersionId)
            : undefined;
          const wrapper = wrapperVersion ? wrappersById.get(wrapperVersion.wrapperId) : undefined;
          result.experimentVersionId = legacyPromptVersionId;
          result.composedPromptSnapshot = buildPromptForClipboard(
            experimentVersion?.promptText ?? "",
            wrapperVersion?.template ?? null,
          );
          result.promptTextSnapshot = experimentVersion?.promptText ?? "";
          result.wrapperVersionId = experimentVersion?.wrapperVersionId ?? null;
          result.wrapperNameSnapshot = wrapper?.name ?? null;
          result.wrapperTemplateSnapshot = wrapperVersion?.template ?? null;
          delete result.promptVersionId;
        });

        await tx.table("experiments").toCollection().modify((experiment) => {
          delete experiment.wrapperId;
        });

        await tx.table("statsWorkspace").toCollection().modify((stats) => {
          stats.experimentVersionsCount = stats.promptVersionsCount ?? stats.experimentVersionsCount ?? 0;
          delete stats.promptVersionsCount;
        });
      });
  }
}

export const db = new KomparatorDb();
