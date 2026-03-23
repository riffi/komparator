import Dexie, { type Table } from "dexie";
import {
  CategoryRecord,
  ExperimentRecord,
  ModelRecord,
  PromptVersionRecord,
  ProviderRecord,
  ResultRecord,
  StatsModelRecord,
  StatsProviderRecord,
  StatsWorkspaceRecord,
  WrapperRecord,
} from "@/entities/experiment/model/types";

export class KomparatorDb extends Dexie {
  categories!: Table<CategoryRecord, string>;
  wrappers!: Table<WrapperRecord, string>;
  experiments!: Table<ExperimentRecord, string>;
  promptVersions!: Table<PromptVersionRecord, string>;
  providers!: Table<ProviderRecord, string>;
  models!: Table<ModelRecord, string>;
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
        models: "id, providerId, [providerId+name+version+comment], isActive, lastUsedAt",
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
  }
}

export const db = new KomparatorDb();
