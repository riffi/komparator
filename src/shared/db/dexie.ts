import { ensureCatalogReady } from "@/shared/db/workspace";

let initPromise: Promise<void> | null = null;

export function ensureDatabaseReady() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = ensureCatalogReady();
  return initPromise;
}
