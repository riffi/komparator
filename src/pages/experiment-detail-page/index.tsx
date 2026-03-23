import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Expand,
  FileText,
  ListFilter,
  Monitor,
  Pencil,
  Plus,
  Save,
  Smartphone,
  Tablet,
  Undo2,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ExperimentWorkspace, WorkspaceResultItem } from "@/entities/experiment/model/types";
import { cn } from "@/shared/lib/cn";
import { buildPromptForClipboard } from "@/shared/lib/prompt";
import { ratingToneClass } from "@/shared/lib/rating-color";
import {
  createPromptVersionEntry,
  createResultEntry,
  createModelEntry,
  loadCategoryOptions,
  loadExperimentWorkspace,
  loadModelOptions,
  loadWrapperOptions,
  ModelSelectOption,
  SelectOption,
  updateExperimentEntry,
  updatePromptVersionEntry,
  updateResultNotes,
  updateResultRating,
} from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";

const deviceWidths = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
} as const;

export function ExperimentDetailPage() {
  const navigate = useNavigate();
  const { experimentId = "" } = useParams();
  const [workspace, setWorkspace] = useState<ExperimentWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"results" | "prompt">("results");
  const [viewMode, setViewMode] = useState<"single" | "sbs">("single");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [selectedResultId, setSelectedResultId] = useState<string>("");
  const [slotAId, setSlotAId] = useState<string>("");
  const [slotBId, setSlotBId] = useState<string>("");
  const [lastSlot, setLastSlot] = useState<"a" | "b">("b");
  const [device, setDevice] = useState<keyof typeof deviceWidths>("desktop");
  const [showCode, setShowCode] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [showAddResult, setShowAddResult] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [showResultNotesField, setShowResultNotesField] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [copyingPrompt, setCopyingPrompt] = useState(false);
  const [savingPromptSettings, setSavingPromptSettings] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [wrapperOptions, setWrapperOptions] = useState<SelectOption[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelSelectOption[]>([]);
  const [settingsDraft, setSettingsDraft] = useState({
    title: "",
    description: "",
    categoryId: "",
    wrapperId: "",
    promptText: "",
    changeNote: "",
  });
  const [resultForm, setResultForm] = useState({
    modelId: "",
    htmlContent: "",
    notes: "",
  });
  const [modelSearch, setModelSearch] = useState("");
  const [modelProviderFilter, setModelProviderFilter] = useState("all");
  const [modelDraft, setModelDraft] = useState({
    providerName: "",
    modelName: "",
    modelVersion: "",
    modelComment: "",
  });

  const refreshWorkspace = useCallback(async () => {
    if (!experimentId) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [nextWorkspace, nextCategories, nextWrappers, nextModels] = await Promise.all([
      loadExperimentWorkspace(experimentId),
      loadCategoryOptions(),
      loadWrapperOptions(),
      loadModelOptions(),
    ]);
    setWorkspace(nextWorkspace);
    setCategoryOptions(nextCategories);
    setWrapperOptions(nextWrappers);
    setModelOptions(nextModels);
    setLoading(false);
  }, [experimentId]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  const visibleResults = useMemo(() => {
    if (!workspace || !selectedVersionId) {
      return [];
    }

    const activeVersion = workspace.promptVersions.find((item) => item.id === selectedVersionId);
    if (!activeVersion) {
      return [];
    }

    return workspace.results.filter((item) => item.promptVersionNumber === activeVersion.versionNumber);
  }, [selectedVersionId, workspace]);

  useEffect(() => {
    if (!workspace?.promptVersions.length) {
      return;
    }

    setSelectedVersionId((current) =>
      current && workspace.promptVersions.some((item) => item.id === current)
        ? current
        : workspace.promptVersions[0].id,
    );
  }, [workspace]);

  useEffect(() => {
    if (!visibleResults.length) {
      setSelectedResultId("");
      setSlotAId("");
      setSlotBId("");
      return;
    }

    setSelectedResultId((current) =>
      visibleResults.some((item) => item.id === current) ? current : visibleResults[0].id,
    );
    setSlotAId((current) =>
      visibleResults.some((item) => item.id === current) ? current : visibleResults[0].id,
    );
    setSlotBId((current) => {
      if (visibleResults.some((item) => item.id === current)) {
        return current;
      }

      return visibleResults[1]?.id ?? visibleResults[0].id;
    });
  }, [visibleResults]);

  const selectedResult = visibleResults.find((item) => item.id === selectedResultId) ?? visibleResults[0];
  const slotA = visibleResults.find((item) => item.id === slotAId) ?? visibleResults[0];
  const slotB = visibleResults.find((item) => item.id === slotBId) ?? visibleResults[1] ?? visibleResults[0];
  const activePrompt =
    workspace?.promptVersions.find((item) => item.id === selectedVersionId) ?? workspace?.promptVersions[0];
  const hasResults = visibleResults.length > 0;
  const composedPrompt = activePrompt
    ? buildPromptForClipboard(activePrompt.promptText, workspace?.wrapperTemplate)
    : "";

  useEffect(() => {
    setNotesDraft(selectedResult?.notes ?? "");
  }, [selectedResult?.id, selectedResult?.notes]);

  useEffect(() => {
    setResultForm((current) => ({
      ...current,
      modelId:
        current.modelId && modelOptions.some((option) => option.id === current.modelId)
          ? current.modelId
          : modelOptions[0]?.id ?? "",
    }));
  }, [modelOptions]);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    const activeVersion =
      workspace.promptVersions.find((item) => item.id === selectedVersionId) ?? workspace.promptVersions[0];

    setSettingsDraft({
      title: workspace.title,
      description: workspace.description,
      categoryId: workspace.categoryId ?? "",
      wrapperId: workspace.wrapperId ?? "",
      promptText: activeVersion?.promptText ?? "",
      changeNote: activeVersion?.changeNote ?? "",
    });
  }, [workspace, selectedVersionId, categoryOptions, wrapperOptions]);

  const filteredModelOptions = useMemo(() => {
    const search = modelSearch.trim().toLowerCase();

    return modelOptions.filter((option) => {
      const matchesProvider =
        modelProviderFilter === "all" ? true : option.providerName === modelProviderFilter;
      const matchesSearch = search
        ? [option.providerName, option.modelName, option.modelVersion, option.modelComment]
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true;

      return matchesProvider && matchesSearch;
    });
  }, [modelOptions, modelProviderFilter, modelSearch]);

  const providerOptions = useMemo(
    () => [...new Set(modelOptions.map((option) => option.providerName))].sort((left, right) => left.localeCompare(right)),
    [modelOptions],
  );

  const selectedModel = modelOptions.find((option) => option.id === resultForm.modelId);
  const selectedManagerModel =
    filteredModelOptions.find((option) => option.id === resultForm.modelId) ?? selectedModel;

  if (loading) {
    return (
      <section className="rounded-lg border border-border/80 bg-surface/70 p-6 shadow-panel">
        <h1 className="font-mono text-2xl font-semibold text-text">Loading experiment...</h1>
      </section>
    );
  }

  if (!workspace) {
    return (
      <section className="rounded-lg border border-border/80 bg-surface/70 p-6 shadow-panel">
        <h1 className="font-mono text-2xl font-semibold text-text">Experiment not found</h1>
        <p className="mt-3 text-sm text-muted">No experiment matches the requested route.</p>
        <Button className="mt-4" variant="ghost" onClick={() => navigate("/experiments")}>
          <Undo2 className="h-4 w-4" />
          Back to experiments
        </Button>
      </section>
    );
  }

  const copyPrompt = async () => {
    if (!composedPrompt) {
      return;
    }

    setCopyingPrompt(true);
    await navigator.clipboard.writeText(composedPrompt);
    window.setTimeout(() => setCopyingPrompt(false), 1600);
  };

  const onSelectResult = (resultId: string) => {
    if (viewMode === "single") {
      setSelectedResultId(resultId);
      return;
    }

    if (lastSlot === "b") {
      setSlotAId(resultId);
      setLastSlot("a");
      return;
    }

    setSlotBId(resultId);
    setLastSlot("b");
  };

  const onSaveNotes = async () => {
    if (!selectedResult) {
      return;
    }

    setSavingNotes(true);
    await updateResultNotes(selectedResult.id, notesDraft);
    await refreshWorkspace();
    setSavingNotes(false);
  };

  const onChangeRating = async (value: string) => {
    if (!selectedResult) {
      return;
    }

    setSavingRating(true);
    await updateResultRating(selectedResult.id, value ? Number(value) : null);
    await refreshWorkspace();
    setSavingRating(false);
  };

  const onCreateResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const canCreate = activePrompt && resultForm.htmlContent.trim() && resultForm.modelId;

    if (!canCreate) {
      return;
    }

    setSavingResult(true);
    await createResultEntry({
      experimentId: workspace.id,
      promptVersionId: activePrompt.id,
      modelId: resultForm.modelId,
      htmlContent: resultForm.htmlContent,
      rating: null,
      notes: resultForm.notes,
    });
    setSavingResult(false);
    setShowAddResult(false);
    setShowResultNotesField(false);
    setResultForm({
      modelId: modelOptions[0]?.id ?? "",
      htmlContent: "",
      notes: "",
    });
    await refreshWorkspace();
  };

  const onCreateModel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modelDraft.providerName.trim() || !modelDraft.modelName.trim() || !modelDraft.modelVersion.trim()) {
      return;
    }

    setSavingModel(true);
    const modelId = await createModelEntry(modelDraft);
    const nextModels = await loadModelOptions();
    setModelOptions(nextModels);
    setResultForm((current) => ({ ...current, modelId }));
    setModelDraft({
      providerName: "",
      modelName: "",
      modelVersion: "",
      modelComment: "",
    });
    setSavingModel(false);
  };

  const onSavePromptSettings = async () => {
    if (!activePrompt) {
      return;
    }

    setSavingPromptSettings(true);
    await updateExperimentEntry({
      experimentId: workspace.id,
      title: settingsDraft.title,
      description: settingsDraft.description,
      categoryId: settingsDraft.categoryId || null,
      wrapperId: settingsDraft.wrapperId || null,
      tags: workspace.tags,
    });
    await updatePromptVersionEntry({
      promptVersionId: activePrompt.id,
      promptText: settingsDraft.promptText,
      changeNote: settingsDraft.changeNote,
      experimentId: workspace.id,
    });
    await refreshWorkspace();
    setSavingPromptSettings(false);
  };

  const onCreatePromptVersion = async () => {
    setCreatingVersion(true);
    const nextPromptText = settingsDraft.promptText.trim();
    const nextChangeNote =
      settingsDraft.changeNote.trim() || `Forked from v${activePrompt?.versionNumber ?? "?"}`;

    const promptVersionId = await createPromptVersionEntry({
      experimentId: workspace.id,
      promptText: nextPromptText,
      changeNote: nextChangeNote,
    });
    await refreshWorkspace();
    setSelectedVersionId(promptVersionId);
    setCreatingVersion(false);
  };

  return (
    <div className="flex h-[calc(100vh-88px)] min-h-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface/70 shadow-panel lg:h-[calc(100vh-96px)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-mono text-xl font-semibold tracking-[-0.04em] text-text">
              {workspace.title}
            </h1>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: workspace.categoryColor }} />
              {workspace.categoryName}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted">{workspace.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void copyPrompt()}>
            <Copy className="h-4 w-4" />
            Copy prompt
          </Button>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border/80 px-4 py-2">
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:text-text",
            activeTab === "results" && "bg-primary-soft/60 text-text",
          )}
          onClick={() => setActiveTab("results")}
        >
          Results
          <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px]">
            {visibleResults.length}
          </span>
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:text-text",
            activeTab === "prompt" && "bg-primary-soft/60 text-text",
          )}
          onClick={() => setActiveTab("prompt")}
        >
          Prompt & settings
        </button>

        {activeTab === "results" ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-border/80 bg-code p-1">
              <button
                type="button"
                className={cn(
                  "rounded px-2.5 py-1 text-xs text-muted transition",
                  viewMode === "single" && "bg-surface text-text",
                )}
                onClick={() => setViewMode("single")}
              >
                Single
              </button>
              <button
                type="button"
                className={cn(
                  "rounded px-2.5 py-1 text-xs text-muted transition",
                  viewMode === "sbs" && "bg-surface text-text",
                )}
                onClick={() => setViewMode("sbs")}
              >
                Side by side
              </button>
            </div>
            <select
              className="h-9 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
              value={selectedVersionId}
              onChange={(event) => setSelectedVersionId(event.target.value)}
            >
              {workspace.promptVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.versionNumber}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={() => setShowAddResult(true)}>
              <Plus className="h-4 w-4" />
              Add result
            </Button>
          </div>
        ) : null}
      </div>

      {activeTab === "results" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-border/80 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">Results</div>
                <div className="mt-1 text-sm text-muted">
                  Prompt version v{activePrompt?.versionNumber ?? "-"}
                </div>
              </div>
              <button
                type="button"
                className="rounded-md border border-border/80 bg-code p-2 text-muted transition hover:text-text"
              >
                <ListFilter className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {hasResults ? (
                visibleResults.map((result) => {
                  const isSelected = selectedResult?.id === result.id;
                  const isA = slotA?.id === result.id;
                  const isB = slotB?.id === result.id;

                  return (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => onSelectResult(result.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-3 text-left transition hover:bg-raised",
                        viewMode === "single" && isSelected && "border-border bg-raised",
                        viewMode === "sbs" && (isA || isB) && "border-border bg-raised",
                      )}
                    >
                      <span
                        className="mt-1 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: result.providerColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold text-text">
                            {result.providerName} / {result.modelName} {result.modelVersion}
                          </div>
                          {viewMode === "sbs" && isA ? (
                            <span className="rounded bg-primary-soft/60 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                              A
                            </span>
                          ) : null}
                          {viewMode === "sbs" && isB ? (
                            <span className="rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] text-orange-300">
                              B
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted">{result.modelComment}</div>
                        <div className="mt-1 font-mono text-[11px] text-dim">
                          Attempt {result.attempt} • {result.createdLabel}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "font-mono text-sm font-semibold",
                          result.rating ? ratingToneClass(result.rating) : "text-dim",
                        )}
                      >
                        {result.rating ?? "—"}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border/80 bg-surface/30 px-4 py-6 text-sm text-muted">
                  No results yet for v{activePrompt?.versionNumber ?? "-"}.
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col">
            {hasResults ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: (viewMode === "single" ? selectedResult : slotA)?.providerColor }}
                      />
                      <div className="truncate text-sm font-semibold text-text">
                        {viewMode === "single"
                          ? `${selectedResult?.providerName ?? ""} / ${selectedResult?.modelName ?? ""} ${selectedResult?.modelVersion ?? ""}`
                          : "Comparison workspace"}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {viewMode === "single"
                        ? `${selectedResult?.fileSizeBytes ?? 0} bytes • ${selectedResult?.lineCount ?? 0} lines`
                        : "Click results on the left to assign slots A and B."}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {viewMode === "single" && selectedResult ? (
                      <select
                        className="h-9 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
                        value={selectedResult.rating ?? ""}
                        onChange={(event) => void onChangeRating(event.target.value)}
                        disabled={savingRating}
                      >
                        <option value="">Unrated</option>
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                          <option key={value} value={value}>
                            Rating {value}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <Button
                      variant={showCode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowCode((value) => !value)}
                    >
                      <Code2 className="h-4 w-4" />
                      Code
                    </Button>
                    <Button
                      variant={showNotes ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowNotes((value) => !value)}
                    >
                      <FileText className="h-4 w-4" />
                      Notes
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Expand className="h-4 w-4" />
                      Fullscreen
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 border-b border-border/80 px-3 py-2">
                  <DeviceButton active={device === "mobile"} onClick={() => setDevice("mobile")} icon={Smartphone} label="375" />
                  <DeviceButton active={device === "tablet"} onClick={() => setDevice("tablet")} icon={Tablet} label="768" />
                  <DeviceButton active={device === "desktop"} onClick={() => setDevice("desktop")} icon={Monitor} label="Full" />
                </div>

                <div className="min-h-0 flex-1 overflow-auto bg-code p-4">
                  {viewMode === "single" ? (
                    showCode ? (
                      <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-[#050608] p-4 font-mono text-xs leading-6 text-muted">
                        {selectedResult?.htmlContent ?? "No result selected."}
                      </pre>
                    ) : (
                      <div className="mx-auto h-full min-h-[520px] max-w-full overflow-hidden rounded-lg border border-border/80 bg-white" style={{ width: deviceWidths[device] }}>
                        {selectedResult ? (
                          <iframe title={selectedResult.id} srcDoc={selectedResult.htmlContent} className="h-full w-full border-0" sandbox="allow-scripts" />
                        ) : null}
                      </div>
                    )
                  ) : (
                    <div className="grid h-full min-h-[520px] gap-4 xl:grid-cols-2">
                      <ComparePanel label="A" result={slotA} device={device} showCode={showCode} />
                      <ComparePanel label="B" result={slotB} device={device} showCode={showCode} accent="orange" />
                    </div>
                  )}
                </div>

                {showNotes ? (
                  <div className="border-t border-border/80 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">Notes</div>
                      <Button size="sm" onClick={() => void onSaveNotes()} disabled={savingNotes || notesDraft === (selectedResult?.notes ?? "") || !selectedResult}>
                        <Save className="h-4 w-4" />
                        Save notes
                      </Button>
                    </div>
                    <textarea
                      className="min-h-[110px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none focus:border-primary"
                      value={notesDraft}
                      onChange={(event) => setNotesDraft(event.target.value)}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-code p-6">
                <div className="w-full max-w-xl rounded-xl border border-dashed border-border/80 bg-surface/60 p-8 text-center shadow-panel">
                  <div className="font-mono text-xs uppercase tracking-[0.14em] text-dim">Empty results</div>
                  <h2 className="mt-3 font-mono text-2xl font-semibold text-text">
                    No results for v{activePrompt?.versionNumber ?? "-"} yet
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Copy the prompt for the current version, run it in an external LLM chat, then add the generated HTML result here.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <Button variant="ghost" onClick={() => void copyPrompt()}>
                      <Copy className="h-4 w-4" />
                      {copyingPrompt ? "Copied" : "Copy prompt"}
                    </Button>
                    <Button onClick={() => setShowAddResult(true)}>
                      <Plus className="h-4 w-4" />
                      Add result
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {workspace.promptVersions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-xs transition",
                    selectedVersionId === version.id
                      ? "border-primary bg-primary-soft/50 text-primary"
                      : "border-border/80 text-muted hover:text-text",
                  )}
                >
                  v{version.versionNumber}
                </button>
              ))}
              <button
                type="button"
                className="rounded-full border border-dashed border-border/80 px-3 py-1.5 font-mono text-xs text-dim transition hover:text-text disabled:opacity-50"
                onClick={() => void onCreatePromptVersion()}
                disabled={creatingVersion}
              >
                + New version
              </button>
            </div>

            <div className="rounded-lg border border-border/80 bg-code p-4">
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-dim">Prompt text</div>
              <textarea
                className="min-h-[260px] w-full resize-y bg-transparent font-mono text-sm leading-6 text-text outline-none"
                value={settingsDraft.promptText}
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, promptText: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                Change note
              </div>
              <InputLike
                value={settingsDraft.changeNote}
                onChange={(value) =>
                  setSettingsDraft((current) => ({ ...current, changeNote: value }))
                }
                placeholder="What changed from the previous version"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void onSavePromptSettings()} disabled={savingPromptSettings}>
                <Save className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-raised p-4">
              <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">Experiment settings</div>
              <div className="mt-4 space-y-4">
                <Field
                  label="Title"
                  value={settingsDraft.title}
                  onChange={(value) =>
                    setSettingsDraft((current) => ({ ...current, title: value }))
                  }
                />
                <Field
                  label="Description"
                  value={settingsDraft.description}
                  onChange={(value) =>
                    setSettingsDraft((current) => ({ ...current, description: value }))
                  }
                  multiline
                />
                <SelectField
                  label="Wrapper"
                  value={settingsDraft.wrapperId}
                  options={wrapperOptions}
                  emptyLabel="No wrapper"
                  onChange={(value) =>
                    setSettingsDraft((current) => ({ ...current, wrapperId: value }))
                  }
                />
                <SelectField
                  label="Category"
                  value={settingsDraft.categoryId}
                  options={categoryOptions}
                  emptyLabel="No category"
                  onChange={(value) =>
                    setSettingsDraft((current) => ({ ...current, categoryId: value }))
                  }
                />
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Wrapper preview</div>
                  <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-code p-3 font-mono text-xs leading-5 text-muted">
                    {settingsDraft.wrapperId
                      ? settingsDraft.wrapperId === workspace.wrapperId
                        ? buildPromptForClipboard(settingsDraft.promptText ?? "", workspace.wrapperTemplate || "")
                        : "Wrapper preview updates after save."
                      : buildPromptForClipboard(settingsDraft.promptText ?? "", null)}
                  </pre>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {showAddResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            className="w-full max-w-3xl rounded-xl border border-border/80 bg-raised p-5 shadow-panel"
            onSubmit={onCreateResult}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xl font-semibold text-text">Add result</h2>
                <p className="mt-1 text-sm text-muted">
                  Attach HTML output to prompt version v{activePrompt?.versionNumber ?? "-"}.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-text"
                onClick={() => setShowAddResult(false)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <section className="rounded-lg border border-border/80 bg-code p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                      Step 1
                    </div>
                    <div className="mt-1 text-sm font-semibold text-text">Copy prompt</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="rounded-full bg-primary-soft/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                        v{activePrompt?.versionNumber ?? "-"}
                      </span>
                      <span>{workspace.wrapperName}</span>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => void copyPrompt()}>
                    <Copy className="h-4 w-4" />
                    {copyingPrompt ? "Copied" : "Copy prompt"}
                  </Button>
                </div>
                <p className="mt-3 text-sm text-muted">
                  Send this prompt to the LLM chat, then come back with the generated HTML.
                </p>
                <pre className="mt-3 max-h-[160px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-[#050608] p-3 font-mono text-xs leading-5 text-muted">
                  {composedPrompt || "Select a prompt version first."}
                </pre>
              </section>

              <section className="rounded-lg border border-border/80 bg-code p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                      Step 2
                    </div>
                    <div className="mt-1 text-sm font-semibold text-text">Choose model</div>
                    <div className="mt-1 text-xs text-muted">
                      {selectedModel?.label ?? "No model selected yet."}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setShowModelManager(true)}>
                    <Pencil className="h-4 w-4" />
                    Choose model
                  </Button>
                </div>
              </section>

              <section className="rounded-lg border border-border/80 bg-code p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Step 3
                </div>
                <div className="mt-1 text-sm font-semibold text-text">Paste HTML output</div>
                <label className="mt-3 block space-y-2">
                  <textarea
                    className="min-h-[260px] w-full rounded-md border border-border/80 bg-[#050608] px-3 py-2 font-mono text-sm text-text outline-none transition focus:border-primary"
                    value={resultForm.htmlContent}
                    onChange={(event) =>
                      setResultForm((current) => ({ ...current, htmlContent: event.target.value }))
                    }
                    placeholder="Paste the generated HTML output here"
                    required
                  />
                </label>
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-sm text-muted transition hover:text-text"
                    onClick={() => setShowResultNotesField((value) => !value)}
                  >
                    {showResultNotesField ? "Hide notes" : "Add notes"}
                  </button>
                  {showResultNotesField ? (
                    <div className="mt-3">
                      <InputLike
                        value={resultForm.notes}
                        onChange={(value) => setResultForm((current) => ({ ...current, notes: value }))}
                        placeholder="Optional notes"
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowAddResult(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingResult || !resultForm.modelId}>
                Save result
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showModelManager ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-xl border border-border/80 bg-raised p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-mono text-xl font-semibold text-text">Choose model</h3>
                <p className="mt-1 text-sm text-muted">
                  Search the catalog, filter by provider and choose a model for this result.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-text"
                onClick={() => setShowModelManager(false)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <InputLike value={modelSearch} onChange={setModelSearch} placeholder="Search models..." />
                  <select
                    className="h-10 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
                    value={modelProviderFilter}
                    onChange={(event) => setModelProviderFilter(event.target.value)}
                  >
                    <option value="all">All providers</option>
                    {providerOptions.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {filteredModelOptions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 bg-surface/30 px-4 py-8 text-center text-sm text-muted">
                      No models match the current filters.
                    </div>
                  ) : (
                    filteredModelOptions.map((option) => {
                      const selected = resultForm.modelId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition",
                            selected
                              ? "border-primary bg-primary-soft/20"
                              : "border-border/80 bg-surface/40 hover:bg-surface/70",
                          )}
                          onClick={() => {
                            setResultForm((current) => ({ ...current, modelId: option.id }));
                            setShowModelManager(false);
                          }}
                        >
                          <div className="mt-0.5 text-primary">
                            <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-text">{option.label}</div>
                            <div className="mt-1 text-xs text-muted">{option.providerName}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <form className="space-y-4 rounded-lg border border-border/80 bg-surface/50 p-4" onSubmit={onCreateModel}>
                <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">Add new model</div>
                <label className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Provider</span>
                  <InputLike
                    value={modelDraft.providerName}
                    onChange={(value) => setModelDraft((current) => ({ ...current, providerName: value }))}
                    placeholder="OpenAI"
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Model</span>
                  <InputLike
                    value={modelDraft.modelName}
                    onChange={(value) => setModelDraft((current) => ({ ...current, modelName: value }))}
                    placeholder="GPT"
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Version</span>
                  <InputLike
                    value={modelDraft.modelVersion}
                    onChange={(value) => setModelDraft((current) => ({ ...current, modelVersion: value }))}
                    placeholder="4o"
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Comment</span>
                  <InputLike
                    value={modelDraft.modelComment}
                    onChange={(value) => setModelDraft((current) => ({ ...current, modelComment: value }))}
                    placeholder="thinking high"
                  />
                </label>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingModel}>
                    <Plus className="h-4 w-4" />
                    Add model
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
              <div className="min-w-0 text-sm text-muted">
                {selectedManagerModel ? (
                  <span className="truncate">
                    Selected: <span className="text-text">{selectedManagerModel.label}</span>
                  </span>
                ) : (
                  "Select a model from the catalog or create a new one."
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowModelManager(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowModelManager(false)}
                  disabled={!selectedManagerModel}
                >
                  Use selected model
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InputLike({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

function DeviceButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Smartphone; label: string }) {
  return (
    <button
      type="button"
      className={cn("inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted transition hover:text-text", active && "bg-surface text-text")}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ComparePanel({ label, result, device, showCode, accent = "blue" }: { label: "A" | "B"; result?: WorkspaceResultItem; device: keyof typeof deviceWidths; showCode: boolean; accent?: "blue" | "orange" }) {
  if (!result) {
    return <div className="flex min-h-0 items-center justify-center rounded-lg border border-dashed border-border/80 bg-[#050608] font-mono text-sm text-dim">Select a result</div>;
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-[#050608]">
      <div className="flex items-center gap-2 border-b border-border/80 px-3 py-2">
        <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", accent === "blue" ? "bg-primary-soft/60 text-primary" : "bg-orange-500/10 text-orange-300")}>{label}</span>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: result.providerColor }} />
        <div className="truncate text-sm font-semibold text-text">{result.providerName} / {result.modelName} {result.modelVersion}</div>
        <div className={cn("ml-auto font-mono text-sm", result.rating ? ratingToneClass(result.rating) : "text-dim")}>{result.rating ?? "—"}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {showCode ? (
          <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-6 text-muted">{result.htmlContent}</pre>
        ) : (
          <div className="mx-auto h-full min-h-[420px] max-w-full overflow-hidden rounded-lg border border-border/80 bg-white" style={{ width: deviceWidths[device] }}>
            <iframe title={result.id} srcDoc={result.htmlContent} className="h-full w-full border-0" sandbox="allow-scripts" />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</div>
      {multiline ? (
        <textarea
          className="min-h-[100px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none focus:border-primary"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <input
          className="h-10 w-full rounded-lg border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  emptyLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  emptyLabel?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</div>
      <select
        className="h-10 w-full rounded-lg border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
