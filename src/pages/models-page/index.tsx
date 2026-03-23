import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Search, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  createModelEntry,
  createProviderEntry,
  loadModelsCatalog,
  loadProvidersCatalog,
  ModelManagerItem,
  ProviderManagerItem,
  updateModelActive,
  updateModelEntry,
  updateProviderEntry,
} from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";

export function ModelsPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderManagerItem[]>([]);
  const [models, setModels] = useState<ModelManagerItem[]>([]);
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
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
    const [nextProviders, nextModels] = await Promise.all([loadProvidersCatalog(), loadModelsCatalog()]);
    setProviders(nextProviders);
    setModels(nextModels);
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
      const matchesSearch = search
        ? [model.providerName, model.name, model.version, model.comment].join(" ").toLowerCase().includes(search)
        : true;

      return matchesProvider && matchesSearch;
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
  }, [models, providerFilter, query, sortBy, sortDirection]);

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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface/70 px-5 py-4 shadow-panel">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-text">Models</h1>
          <p className="mt-1 text-sm text-muted">Provider and model catalog used by experiment results.</p>
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

      <div className="rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel">
        <div className="mb-3 flex flex-wrap items-center gap-2">
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

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
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

      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface/70 shadow-panel">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px_120px_128px] gap-3 border-b border-border/80 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
          <SortHeader label="Model" active={sortBy === "model"} direction={sortDirection} onClick={() => toggleSort("model")} />
          <SortHeader label="Provider" active={sortBy === "provider"} direction={sortDirection} onClick={() => toggleSort("provider")} />
          <SortHeader label="Usage" active={sortBy === "usage"} direction={sortDirection} onClick={() => toggleSort("usage")} />
          <SortHeader label="Avg rating" active={sortBy === "rating"} direction={sortDirection} onClick={() => toggleSort("rating")} />
          <SortHeader label="Status" active={sortBy === "status"} direction={sortDirection} onClick={() => toggleSort("status")} />
          <div />
        </div>
        <div className="divide-y divide-border/70">
          {loading ? <div className="px-4 py-6 text-sm text-muted">Loading models...</div> : filteredModels.length ? filteredModels.map((model) => (
            <div key={model.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px_120px_128px] items-center gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-text">{model.name} {model.version}</div>
                <div className="truncate text-xs text-muted">{model.comment || "No comment"}</div>
              </div>
              <div className="min-w-0"><div className="flex items-center gap-2 text-sm text-text"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: model.providerColor }} /><span className="truncate">{model.providerName}</span></div></div>
              <div className="text-sm text-muted">{model.resultsCount}</div>
              <div className="font-mono text-sm text-text">{model.avgRating ? model.avgRating.toFixed(1) : "—"}</div>
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
