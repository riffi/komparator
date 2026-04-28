export type CatalogImportPayload = {
  version: string;
  sourceLabel: string;
  providers: Array<{
    id: string;
    canonicalSlug: string;
    name: string;
    color: string;
    isActive?: boolean;
  }>;
  models: Array<{
    id: string;
    providerId: string;
    name: string;
    version: string;
    displayName: string;
    aliases?: string[];
    status?: "active" | "deprecated";
  }>;
};
