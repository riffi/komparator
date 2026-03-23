import Dexie, { type Table } from "dexie";
import {
  CategoryRecord,
  ExperimentRecord,
  ModelRecord,
  PromptVersionRecord,
  ProviderRecord,
  ResultRecord,
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
  }
}

export const db = new KomparatorDb();
