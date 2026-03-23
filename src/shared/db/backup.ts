import {
  CategoryRecord,
  ExperimentRecord,
  ModelRecord,
  PromptVersionRecord,
  ProviderRecord,
  ResultRecord,
  WrapperRecord,
} from "@/entities/experiment/model/types";
import { db } from "@/shared/db/schema";
import { unzipSingleTextFile, zipSingleTextFile } from "@/shared/lib/zip";

const EXPORT_FILENAME_PREFIX = "komparator-export";

type BackupPayload = {
  meta: {
    app: "komparator";
    version: string;
    exportedAt: string;
  };
  data: {
    categories: CategoryRecord[];
    wrappers: WrapperRecord[];
    experiments: ExperimentRecord[];
    promptVersions: PromptVersionRecord[];
    providers: ProviderRecord[];
    models: ModelRecord[];
    results: ResultRecord[];
  };
};

function assertBackupPayload(value: unknown): asserts value is BackupPayload {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid backup file.");
  }

  const payload = value as Record<string, unknown>;
  const meta = payload.meta as Record<string, unknown> | undefined;
  const data = payload.data as Record<string, unknown> | undefined;

  if (!meta || meta.app !== "komparator" || typeof meta.exportedAt !== "string") {
    throw new Error("Invalid backup metadata.");
  }

  const requiredKeys = ["categories", "wrappers", "experiments", "promptVersions", "providers", "models", "results"];
  if (!data || !requiredKeys.every((key) => Array.isArray(data[key]))) {
    throw new Error("Invalid backup payload.");
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportDatabaseToZip() {
  const [categories, wrappers, experiments, promptVersions, providers, models, results] = await Promise.all([
    db.categories.toArray(),
    db.wrappers.toArray(),
    db.experiments.toArray(),
    db.promptVersions.toArray(),
    db.providers.toArray(),
    db.models.toArray(),
    db.results.toArray(),
  ]);

  const payload: BackupPayload = {
    meta: {
      app: "komparator",
      version: "0.1.0",
      exportedAt: new Date().toISOString(),
    },
    data: {
      categories,
      wrappers,
      experiments,
      promptVersions,
      providers,
      models,
      results,
    },
  };

  const exportedAt = payload.meta.exportedAt.slice(0, 10);
  const filename = `${EXPORT_FILENAME_PREFIX}-${exportedAt}.zip`;
  const zipBlob = await zipSingleTextFile(`${EXPORT_FILENAME_PREFIX}.json`, JSON.stringify(payload, null, 2));
  downloadBlob(zipBlob, filename);
}

export async function importDatabaseFromZip(file: File) {
  const extracted = await unzipSingleTextFile(file);
  const parsed = JSON.parse(extracted.content) as unknown;
  assertBackupPayload(parsed);
  const backup = parsed as BackupPayload;

  await db.transaction(
    "rw",
    [db.categories, db.wrappers, db.experiments, db.promptVersions, db.providers, db.models, db.results],
    async () => {
      await db.results.clear();
      await db.models.clear();
      await db.providers.clear();
      await db.promptVersions.clear();
      await db.experiments.clear();
      await db.wrappers.clear();
      await db.categories.clear();

      await db.categories.bulkAdd(backup.data.categories);
      await db.wrappers.bulkAdd(backup.data.wrappers);
      await db.experiments.bulkAdd(backup.data.experiments);
      await db.promptVersions.bulkAdd(backup.data.promptVersions);
      await db.providers.bulkAdd(backup.data.providers);
      await db.models.bulkAdd(backup.data.models);
      await db.results.bulkAdd(backup.data.results);
    },
  );
}
