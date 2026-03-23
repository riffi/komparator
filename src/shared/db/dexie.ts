import { db } from "@/shared/db/schema";
import {
  seedCategoriesRecords,
  seedExperimentRecords,
  seedModelRecords,
  seedPromptVersionRecords,
  seedProviderRecords,
  seedResultRecords,
  seedWrapperRecords,
} from "@/shared/db/seeds";

let seedPromise: Promise<void> | null = null;

export function ensureSeedData() {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    const count = await db.experiments.count();

    if (count > 0) {
      return;
    }

    await db.transaction(
      "rw",
      [
        db.categories,
        db.wrappers,
        db.experiments,
        db.promptVersions,
        db.providers,
        db.models,
        db.results,
      ],
      async () => {
        await db.categories.bulkAdd(seedCategoriesRecords);
        await db.wrappers.bulkAdd(seedWrapperRecords);
        await db.experiments.bulkAdd(seedExperimentRecords);
        await db.promptVersions.bulkAdd(seedPromptVersionRecords);
        await db.providers.bulkAdd(seedProviderRecords);
        await db.models.bulkAdd(seedModelRecords);
        await db.results.bulkAdd(seedResultRecords);
      },
    );
  })();

  return seedPromise;
}