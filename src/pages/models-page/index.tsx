import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, Link2, Pencil, Plus, RefreshCcw, Search, Upload, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  applyCatalogPreset,
  CatalogModelBrowserItem,
  CatalogPresetItem,
  createModelFromCatalog,
  createModelEntry,
  createProviderEntry,
  importCatalogFromJsonText,
  loadCatalogBrowserItems,
  loadCatalogPresets,
  loadCatalogSummary,
  loadModelsCatalog,
  loadModelMatches,
  ModelMatchItem,
  loadProvidersCatalog,
  ModelManagerItem,
  ProviderManagerItem,
  resolveModelMatch,
  syncRemoteCatalog,
  updateModelActive,
  updateModelEntry,
  updateProviderEntry,
} from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";

export function ModelsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "catalog">("mine");
  const [providers, setProviders] = useState<ProviderManagerItem[]>([]);
  const [models, setModels] = useState<ModelManagerItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogModelBrowserItem[]>([]);
  const [presets, setPresets] = useState<CatalogPresetItem[]>([]);
  const [matchItems, setMatchItems] = useState<ModelMatchItem[]>([]);
  const [catalogSummary, setCatalogSummary] = useState<{
    version: string | null;
    sourceLabel: string | null;
    importedAt: string | null;
    providersCount: number;
    modelsCount: number;
    presetsCount: number;
    matchesPendingCount: number;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "catalog" | "review">("all");
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState<"" | "sync" | "preset" | "import" | "create" | "match">("");
  const [catalogError, setCatalogError] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [duplicatingModelId, setDuplicatingModelId] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderManagerItem | null>(null);
  const [editingModel, setEditingModel] = useState<ModelManagerItem | null>(null);
  const [sortBy, setSortBy] = useState<"model" | "provider" | "usage" | "rating" | "status">("provider");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [providerDraft, setProviderDraft] = useState({ name: "", color: "#5b8def", isActive: true });
  const [modelDraft, setModelDraft] = useState({
    providerMode: "existing",
    providerId: "",
    providerName: "",
    providerColor: "#5b8def",
    name: "",
    version: "",
    comment: "",
    isActive: true,
  });

  const refreshData = useCallback(async () => {
    setLoading(true);
    const [nextProviders, nextModels, nextCatalogSummary, nextPresets, nextCatalogItems, nextMatchItems] = await Promise.all([
      loadProvidersCatalog(),
      loadModelsCatalog(),
      loadCatalogSummary(),
      loadCatalogPresets(),
      loadCatalogBrowserItems(),
      loadModelMatches(),
    ]);
    setProviders(nextProviders);
    setModels(nextModels);
    setCatalogSummary(nextCatalogSummary);
    setPresets(nextPresets);
    setCatalogItems(nextCatalogItems);
    setMatchItems(nextMatchItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!providers.length) {
      return;
    }

    setModelDraft((current) => ({
      ...current,
      providerId:
        current.providerId && providers.some((provider) => provider.id === current.providerId)
          ? current.providerId
          : providers[0].id,
    }));
  }, [providers]);

  const filteredModels = useMemo(() => {
    const search = query.trim().toLowerCase();

    const filtered = models.filter((model) => {
      const matchesProvider = providerFilter === "all" ? true : model.providerId === providerFilter;
      const matchesSource =
        sourceFilter === "all"
          ? true
          : sourceFilter === "review"
            ? model.pendingMatchCount > 0
            : model.sourceType === sourceFilter;
      const matchesSearch = search
        ? [model.providerName, model.name, model.version, model.comment].join(" ").toLowerCase().includes(search)
        : true;

      return matchesProvider && matchesSource && matchesSearch;
    });

    const direction = sortDirection === "asc" ? 1 : -1;

    return filtered.sort((left, right) => {
      if (sortBy === "provider") {
        return (
          (left.providerName.localeCompare(right.providerName) ||
            left.name.localeCompare(right.name) ||
            left.version.localeCompare(right.version)) * direction
        );
      }

      if (sortBy === "model") {
        return (
          (left.name.localeCompare(right.name) ||
            left.version.localeCompare(right.version) ||
            left.providerName.localeCompare(right.providerName)) * direction
        );
      }

      if (sortBy === "usage") {
        return ((left.resultsCount - right.resultsCount) || left.name.localeCompare(right.name)) * direction;
      }

      if (sortBy === "rating") {
        return (((left.avgRating ?? -1) - (right.avgRating ?? -1)) || left.name.localeCompare(right.name)) * direction;
      }

      return ((Number(left.isActive) - Number(right.isActive)) || left.name.localeCompare(right.name)) * direction;
    });
  }, [models, providerFilter, query, sortBy, sortDirection, sourceFilter]);

  const popularCatalogItems = useMemo(
    () => catalogItems.filter((item) => item.presetIds.includes("popular")).slice(0, 20),
    [catalogItems],
  );

  const onImportCatalogClick = () => {
    importInputRef.current?.click();
  };

  const onImportCatalogFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setCatalogBusy("import");
    setCatalogError("");
    try {
      await importCatalogFromJsonText(await file.text());
      await refreshData();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Catalog import failed.");
    } finally {
      setCatalogBusy("");
    }
  };

  const onSyncCatalog = async () => {
    setCatalogBusy("sync");
    setCatalogError("");
    try {
      await syncRemoteCatalog();
      await refreshData();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Catalog sync failed.");
    } finally {
      setCatalogBusy("");
    }
  };

  const onApplyPreset = async (presetId: string) => {
    setCatalogBusy("preset");
    setCatalogError("");
    try {
      await applyCatalogPreset(presetId);
      await refreshData();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Preset apply failed.");
    } finally {
      setCatalogBusy("");
    }
  };

  const onAddCatalogModel = async (catalogModelId: string) => {
    setCatalogBusy("create");
    setCatalogError("");
    try {
      await createModelFromCatalog(catalogModelId);
      await refreshData();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Could not add catalog model.");
    } finally {
      setCatalogBusy("");
    }
  };

  const onResolveMatch = async (matchId: string, action: "link" | "ignore") => {
    setCatalogBusy("match");
    setCatalogError("");
    try {
      await resolveModelMatch(matchId, action);
      await refreshData();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Could not resolve match.");
    } finally {
      setCatalogBusy("");
    }
  };

  const openCreateProvider = () => {
    setEditingProvider(null);
    setProviderDraft({ name: "", color: "#5b8def", isActive: true });
    setShowProviderModal(true);
  };

  const openEditProvider = (provider: ProviderManagerItem) => {
    setEditingProvider(provider);
    setProviderDraft({ name: provider.name, color: provider.color, isActive: provider.isActive });
    setShowProviderModal(true);
  };

  const openCreateModel = () => {
    setEditingModel(null);
    setDuplicatingModelId(null);
    setModelDraft({
      providerMode: providers.length ? "existing" : "new",
      providerId: providers[0]?.id ?? "",
      providerName: "",
      providerColor: "#5b8def",
      name: "",
      version: "",
      comment: "",
      isActive: true,
    });
    setShowModelModal(true);
  };

  const openEditModel = (model: ModelManagerItem) => {
    setEditingModel(model);
    setDuplicatingModelId(null);
    setModelDraft({
      providerMode: "existing",
      providerId: model.providerId,
      providerName: "",
      providerColor: model.providerColor,
      name: model.name,
      version: model.version,
      comment: model.comment,
      isActive: model.isActive,
    });
    setShowModelModal(true);
  };

  const duplicateModel = (model: ModelManagerItem) => {
    setEditingModel(null);
    setDuplicatingModelId(model.id);
    setModelDraft({
      providerMode: "existing",
      providerId: model.providerId,
      providerName: "",
      providerColor: model.providerColor,
      name: model.name,
      version: `${model.version} copy`,
      comment: model.comment,
      isActive: model.isActive,
    });
    setShowModelModal(true);
  };

  const toggleSort = (column: "model" | "provider" | "usage" | "rating" | "status") => {
    if (sortBy === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection(column === "usage" || column === "rating" ? "desc" : "asc");
  };

  const onSaveProvider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!providerDraft.name.trim()) return;

    setSavingProvider(true);
    if (editingProvider) {
      await updateProviderEntry({
        providerId: editingProvider.id,
        name: providerDraft.name,
        color: providerDraft.color,
        isActive: providerDraft.isActive,
      });
    } else {
      await createProviderEntry({ name: providerDraft.name, color: providerDraft.color });
    }
    setSavingProvider(false);
    setShowProviderModal(false);
    await refreshData();
  };

  const onSaveModel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modelDraft.name.trim() || !modelDraft.version.trim()) return;

    setSavingModel(true);
    let providerId = modelDraft.providerId;

    if (modelDraft.providerMode === "new") {
      providerId = await createProviderEntry({ name: modelDraft.providerName, color: modelDraft.providerColor });
    }

    if (editingModel) {
      await updateModelEntry({
        modelId: editingModel.id,
        providerId,
        name: modelDraft.name,
        version: modelDraft.version,
        comment: modelDraft.comment,
        isActive: modelDraft.isActive,
      });
    } else {
      await createModelEntry({
        providerName:
          modelDraft.providerMode === "new"
            ? modelDraft.providerName
            : providers.find((provider) => provider.id === providerId)?.name ?? "",
        providerColor: modelDraft.providerMode === "new" ? modelDraft.providerColor : undefined,
        modelName: modelDraft.name,
        modelVersion: modelDraft.version,
        modelComment: modelDraft.comment,
        isActive: modelDraft.isActive,
      });
    }

    setSavingModel(false);
    setShowModelModal(false);
    setDuplicatingModelId(null);
    await refreshData();
  };

  return (
    <section className="space-y-5">
      <input ref={importInputRef} type="file" accept=".json,application/json" className="hidden" onChange={onImportCatalogFile} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">Reference data</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-text">Models</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Switch between your working model list and the remote catalog without burying your actual models under catalog content.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
          <button
            type="button"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              activeTab === "mine"
                ? "bg-primary text-white shadow-[0_10px_30px_rgba(91,141,239,0.35)]"
                : "bg-white/5 text-muted hover:text-text",
            )}
            onClick={() => setActiveTab("mine")}
          >
            My models
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              activeTab === "catalog"
                ? "bg-primary text-white shadow-[0_10px_30px_rgba(91,141,239,0.35)]"
                : "bg-white/5 text-muted hover:text-text",
            )}
            onClick={() => setActiveTab("catalog")}
          >
            Catalog
          </button>
        </div>
      </div>

      {activeTab === "catalog" ? (
        <div className="rounded-xl border border-border/80 bg-surface/70 p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.14em] text-dim">Catalog</div>
              <h2 className="mt-2 text-lg font-semibold text-text">Remote model source and starter presets</h2>
              <p className="mt-1 text-sm text-muted">
                Update the external catalog, inspect Arena-based presets, and add catalog models into your local workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => void onSyncCatalog()} disabled={catalogBusy !== ""}>
                <RefreshCcw className="h-4 w-4" />
                {catalogBusy === "sync" ? "Updating..." : "Update catalog"}
              </Button>
              <Button variant="ghost" onClick={onImportCatalogClick} disabled={catalogBusy !== ""}>
                <Upload className="h-4 w-4" />
                {catalogBusy === "import" ? "Importing..." : "Import JSON"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <CatalogStat label="Version" value={catalogSummary?.version ?? "—"} helper={catalogSummary?.sourceLabel ?? "No catalog"} />
            <CatalogStat label="Catalog models" value={String(catalogSummary?.modelsCount ?? 0)} helper={`${catalogSummary?.providersCount ?? 0} providers`} />
            <CatalogStat label="Presets" value={String(catalogSummary?.presetsCount ?? 0)} helper="Starter bundles" />
            <CatalogStat label="Needs review" value={String(catalogSummary?.matchesPendingCount ?? 0)} helper="Possible duplicates" />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="rounded-lg border border-border/80 bg-code/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Models list</div>
                  <div className="mt-1 text-sm text-muted">Models currently included in the `popular` catalog list.</div>
                </div>
                <div className="rounded-full border border-border/80 bg-surface/40 px-3 py-1 font-mono text-[11px] text-dim">
                  {popularCatalogItems.length} models
                </div>
              </div>
              <div className="max-h-[min(56vh,560px)] space-y-2 overflow-y-auto pr-1">
                {popularCatalogItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface/40 px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-text">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.providerColor }} />
                        <span className="truncate">{item.displayName}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {item.providerName}
                        {item.linkedLocalLabel ? " • already added" : item.pendingMatchId ? " • possible duplicate" : ""}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={item.linkedLocalModelId ? "ghost" : "default"}
                      onClick={() => void onAddCatalogModel(item.id)}
                      disabled={catalogBusy !== "" || Boolean(item.linkedLocalModelId)}
                    >
                      {item.linkedLocalModelId ? "Added" : "Add"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-code/70 p-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Presets</div>
              <div className="mt-1 text-sm text-muted">Load curated starter bundles into your local model list.</div>
              <div className="mt-3 space-y-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="rounded-lg border border-border/80 bg-surface/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text">{preset.title}</div>
                        <div className="mt-1 text-xs text-muted">{preset.description}</div>
                        <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-dim">
                          <span>{preset.modelCount} models</span>
                          {preset.modelCountDelta !== 0 ? (
                            <span className={cn("rounded-full px-2 py-0.5", preset.modelCountDelta > 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300")}>
                              {preset.modelCountDelta > 0 ? `+${preset.modelCountDelta}` : preset.modelCountDelta}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => void onApplyPreset(preset.id)} disabled={catalogBusy !== ""}>
                        <Download className="h-4 w-4" />
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {catalogError ? <div className="mt-4 text-sm text-red-300">{catalogError}</div> : null}
        </div>
      ) : null}

      {activeTab === "mine" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface/70 px-5 py-4 shadow-panel">
            <div>
              <h2 className="font-mono text-2xl font-semibold text-text">My models</h2>
              <p className="mt-1 text-sm text-muted">Provider and model catalog actually used by your experiment results.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex h-10 items-center gap-2 rounded-md border border-border/80 bg-code px-3 text-sm text-muted">
                <Search className="h-4 w-4" />
                <input
                  className="w-[240px] bg-transparent text-text outline-none placeholder:text-dim"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search models or providers..."
                />
              </label>
              <Button variant="ghost" onClick={openCreateProvider}>
                <Plus className="h-4 w-4" />
                Add provider
              </Button>
              <Button onClick={openCreateModel}>
                <Plus className="h-4 w-4" />
                Add model
              </Button>
            </div>
          </div>

          {matchItems.length ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-panel">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <Link2 className="h-4 w-4" />
                Possible duplicates
              </div>
              <div className="mt-3 space-y-2">
                {matchItems.slice(0, 4).map((match) => (
                  <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface/40 px-3 py-2">
                    <div className="min-w-0 text-sm text-muted">
                      <span className="text-text">{match.catalogProviderName} / {match.catalogDisplayName}</span>
                      {" -> "}
                      <span className="text-text">{match.localLabel}</span>
                      <span className="ml-2 font-mono text-[11px] text-dim">{Math.round(match.confidence * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" onClick={() => void onResolveMatch(match.id, "ignore")} disabled={catalogBusy !== ""}>
                        Keep separate
                      </Button>
                      <Button type="button" onClick={() => void onResolveMatch(match.id, "link")} disabled={catalogBusy !== ""}>
                        Link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border/80 bg-surface/70 shadow-panel">
            <div className="border-b border-border/80 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "manual", "catalog", "review"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      sourceFilter === value ? "border-primary bg-primary-soft/50 text-primary" : "border-border/80 text-muted",
                    )}
                    onClick={() => setSourceFilter(value)}
                  >
                    {value === "all" ? "All sources" : value === "manual" ? "My models" : value === "catalog" ? "Catalog-linked" : "Needs review"}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={cn("rounded-full border px-3 py-1.5 text-sm transition", providerFilter === "all" ? "border-primary bg-primary-soft/50 text-primary" : "border-border/80 text-muted")}
                  onClick={() => setProviderFilter("all")}
                >
                  All providers
                </button>
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition", providerFilter === provider.id ? "border-primary bg-primary-soft/50 text-primary" : "border-border/80 text-muted hover:text-text")}
                    onClick={() => setProviderFilter((current) => (current === provider.id ? "all" : provider.id))}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: provider.color }} />
                    <span>{provider.name}</span>
                    <span className="font-mono text-[11px] text-dim">{provider.modelCount}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {providers.map((provider) => (
                  <div key={provider.id} className="rounded-lg border border-border/80 bg-code px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: provider.color }} />
                          <div className="truncate text-sm font-semibold text-text">{provider.name}</div>
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {provider.modelCount} model{provider.modelCount === 1 ? "" : "s"} • {provider.isActive ? "Active" : "Inactive"}
                        </div>
                      </div>
                      <button type="button" className="text-muted transition hover:text-text" onClick={() => openEditProvider(provider)} aria-label={`Edit ${provider.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px_120px_120px_128px] gap-3 border-b border-border/80 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
              <SortHeader label="Model" active={sortBy === "model"} direction={sortDirection} onClick={() => toggleSort("model")} />
              <SortHeader label="Provider" active={sortBy === "provider"} direction={sortDirection} onClick={() => toggleSort("provider")} />
              <SortHeader label="Usage" active={sortBy === "usage"} direction={sortDirection} onClick={() => toggleSort("usage")} />
              <SortHeader label="Avg rating" active={sortBy === "rating"} direction={sortDirection} onClick={() => toggleSort("rating")} />
              <div>Source</div>
              <SortHeader label="Status" active={sortBy === "status"} direction={sortDirection} onClick={() => toggleSort("status")} />
              <div />
            </div>
            <div className="divide-y divide-border/70">
              {loading ? <div className="px-4 py-6 text-sm text-muted">Loading models...</div> : filteredModels.length ? filteredModels.map((model) => (
                <div key={model.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px_120px_120px_128px] items-center gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">{model.name} {model.version}</div>
                    <div className="truncate text-xs text-muted">
                      {model.comment || "No comment"}
                      {model.pendingMatchCount > 0 ? ` • ${model.pendingMatchCount} possible match` : ""}
                    </div>
                  </div>
                  <div className="min-w-0"><div className="flex items-center gap-2 text-sm text-text"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: model.providerColor }} /><span className="truncate">{model.providerName}</span></div></div>
                  <div className="text-sm text-muted">{model.resultsCount}</div>
                  <div className="font-mono text-sm text-text">{model.avgRating ? model.avgRating.toFixed(1) : "—"}</div>
                  <div className="text-xs text-muted">
                    <div>{model.sourceType === "catalog" ? "Catalog" : "Manual"}</div>
                    <div className="truncate">{model.catalogDisplayName ?? "—"}</div>
                  </div>
                  <button type="button" className={cn("justify-self-start rounded-full px-2.5 py-1 text-xs font-medium transition", model.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-muted")} onClick={() => void updateModelActive(model.id, !model.isActive).then(refreshData)}>
                    {model.isActive ? "Active" : "Inactive"}
                  </button>
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" className="text-muted transition hover:text-text" onClick={() => duplicateModel(model)} aria-label={`Duplicate ${model.name}`}>
                      <Copy className="h-4 w-4" />
                    </button>
                    <button type="button" className="text-muted transition hover:text-text" onClick={() => openEditModel(model)} aria-label={`Edit ${model.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) : <div className="px-4 py-6 text-sm text-muted">No models match the current filters.</div>}
            </div>
          </div>
        </>
      ) : null}

      {showProviderModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form className="w-full max-w-lg rounded-xl border border-border/80 bg-raised p-5 shadow-panel" onSubmit={onSaveProvider}>
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-mono text-xl font-semibold text-text">{editingProvider ? "Edit provider" : "Add provider"}</h2><p className="mt-1 text-sm text-muted">Provider metadata used across the model catalog.</p></div>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text" onClick={() => setShowProviderModal(false)} aria-label="Close dialog"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Provider name" value={providerDraft.name} onChange={(value) => setProviderDraft((current) => ({ ...current, name: value }))} placeholder="OpenAI" />
              <ColorField label="Color" value={providerDraft.color} onChange={(value) => setProviderDraft((current) => ({ ...current, color: value }))} />
              {editingProvider ? <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={providerDraft.isActive} onChange={(event) => setProviderDraft((current) => ({ ...current, isActive: event.target.checked }))} />Active provider</label> : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowProviderModal(false)}>Cancel</Button>
              <Button type="submit" disabled={savingProvider}>{editingProvider ? "Save provider" : "Create provider"}</Button>
            </div>
          </form>
        </div>
      ) : null}

      {showModelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form className="w-full max-w-2xl rounded-xl border border-border/80 bg-raised p-5 shadow-panel" onSubmit={onSaveModel}>
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-mono text-xl font-semibold text-text">{editingModel ? "Edit model" : duplicatingModelId ? "Duplicate model" : "Add model"}</h2><p className="mt-1 text-sm text-muted">Create a reusable model configuration for experiment results.</p></div>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text" onClick={() => { setShowModelModal(false); setDuplicatingModelId(null); }} aria-label="Close dialog"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {!editingModel ? <div className="space-y-2 md:col-span-2"><div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Provider source</div><div className="flex rounded-md border border-border/80 bg-code p-1"><button type="button" className={cn("rounded px-3 py-2 text-sm text-muted transition", modelDraft.providerMode === "existing" && "bg-surface text-text")} onClick={() => setModelDraft((current) => ({ ...current, providerMode: "existing" }))}>Existing provider</button><button type="button" className={cn("rounded px-3 py-2 text-sm text-muted transition", modelDraft.providerMode === "new" && "bg-surface text-text")} onClick={() => setModelDraft((current) => ({ ...current, providerMode: "new" }))}>New provider</button></div></div> : null}
              {editingModel || modelDraft.providerMode === "existing" ? <SelectField label="Provider" value={modelDraft.providerId} onChange={(value) => setModelDraft((current) => ({ ...current, providerId: value }))} options={providers.map((provider) => ({ id: provider.id, label: provider.name }))} /> : <>
                <Field label="Provider name" value={modelDraft.providerName} onChange={(value) => setModelDraft((current) => ({ ...current, providerName: value }))} placeholder="OpenAI" />
                <ColorField label="Provider color" value={modelDraft.providerColor} onChange={(value) => setModelDraft((current) => ({ ...current, providerColor: value }))} />
              </>}
              <Field label="Model name" value={modelDraft.name} onChange={(value) => setModelDraft((current) => ({ ...current, name: value }))} placeholder="GPT-5" />
              <Field label="Version" value={modelDraft.version} onChange={(value) => setModelDraft((current) => ({ ...current, version: value }))} placeholder="latest" />
              <Field label="Comment" value={modelDraft.comment} onChange={(value) => setModelDraft((current) => ({ ...current, comment: value }))} placeholder="thinking high" className="md:col-span-2" />
              <label className="flex items-center gap-2 text-sm text-muted md:col-span-2"><input type="checkbox" checked={modelDraft.isActive} onChange={(event) => setModelDraft((current) => ({ ...current, isActive: event.target.checked }))} />Active model</label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setShowModelModal(false); setDuplicatingModelId(null); }}>Cancel</Button>
              <Button type="submit" disabled={savingModel}>{editingModel ? "Save model" : duplicatingModelId ? "Create copy" : "Create model"}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function CatalogStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-lg border border-border/80 bg-code/70 px-4 py-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</div>
      <div className="mt-2 text-xl font-semibold text-text">{value}</div>
      <div className="mt-1 text-xs text-muted">{helper}</div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button type="button" className={cn("inline-flex items-center gap-1 text-left transition hover:text-text", active ? "text-text" : "text-dim")} onClick={onClick}>
      <span>{label}</span>
      {active ? direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : null}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</div>
      <input className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</div>
      <div className="flex items-center gap-3">
        <input type="color" className="h-10 w-14 rounded border border-border/80 bg-code" value={value} onChange={(event) => onChange(event.target.value)} />
        <input className="h-10 flex-1 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary" value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ id: string; label: string }> }) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</div>
      <Select wrapperClassName="w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </Select>
    </div>
  );
}
