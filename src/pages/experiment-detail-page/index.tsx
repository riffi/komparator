import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Code2,
  Copy,
  Ellipsis,
  Expand,
  FileText,
  ListFilter,
  Monitor,
  Pencil,
  Plus,
  Save,
  Smartphone,
  Star,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ExperimentWorkspace, WorkspaceResultItem } from "@/entities/experiment/model/types";
import { cn } from "@/shared/lib/cn";
import { buildPromptForClipboard } from "@/shared/lib/prompt";
import { ratingToneClass } from "@/shared/lib/rating-color";
import {
  applyCatalogPreset,
  createModelFromCatalog,
  createPromptVersionEntry,
  createResultEntry,
  createModelEntry,
  createProviderEntry,
  CatalogModelBrowserItem,
  deleteExperimentVersionEntry,
  loadCategoryOptions,
  loadCatalogBrowserItems,
  deleteResultEntry,
  loadExperimentWorkspace,
  loadModelOptions,
  loadProvidersCatalog,
  loadResultHtmlContent,
  loadWrapperOptions,
  ModelSelectOption,
  ProviderManagerItem,
  SelectOption,
  WrapperSelectOption,
  updateExperimentEntry,
  updateExperimentVersionChangeNote,
  updateExperimentVersionEntry,
  updateModelEntry,
  updateResultEntry,
  updateResultNotes,
  updateResultRating,
} from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { HtmlCodeBlock } from "@/shared/ui/html-code-block";
import { appRoutes } from "@/shared/config/routes";
import { Select } from "@/shared/ui/select";
import { WrapperVersionPickerDialog } from "@/shared/ui/wrapper-version-picker-dialog";

const deviceWidths = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
} as const;

const ALL_VERSIONS_FILTER = "__all_versions__";

export function ExperimentDetailPage() {
  const navigate = useNavigate();
  const { experimentId = "" } = useParams();
  const [workspace, setWorkspace] = useState<ExperimentWorkspace | null>(null);
  const [resultHtmlById, setResultHtmlById] = useState<Record<string, string>>({});
  const [loadingResultHtmlIds, setLoadingResultHtmlIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"results" | "prompt">("results");
  const [viewMode, setViewMode] = useState<"single" | "sbs">("single");
  const [resultsSort, setResultsSort] = useState<"rating" | "date" | "model">("rating");
  const [selectedPromptVersionId, setSelectedPromptVersionId] = useState<string>("");
  const [resultsVersionFilterId, setResultsVersionFilterId] = useState<string>("");
  const [selectedResultId, setSelectedResultId] = useState<string>("");
  const [slotAId, setSlotAId] = useState<string>("");
  const [slotBId, setSlotBId] = useState<string>("");
  const [lastSlot, setLastSlot] = useState<"a" | "b">("b");
  const [device, setDevice] = useState<keyof typeof deviceWidths>("desktop");
  const [compareSplit, setCompareSplit] = useState(50);
  const [showCode, setShowCode] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [resultActionsId, setResultActionsId] = useState("");
  const [editingResult, setEditingResult] = useState<WorkspaceResultItem | null>(null);
  const [showDeleteResult, setShowDeleteResult] = useState<WorkspaceResultItem | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [savingEditResult, setSavingEditResult] = useState(false);
  const [deletingResult, setDeletingResult] = useState(false);
  const [showAddResult, setShowAddResult] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [modelManagerTarget, setModelManagerTarget] = useState<"add" | "edit">("add");
  const [showResultNotesField, setShowResultNotesField] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [copyingPrompt, setCopyingPrompt] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [wrapperOptions, setWrapperOptions] = useState<WrapperSelectOption[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelSelectOption[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogModelBrowserItem[]>([]);
  const [providersCatalog, setProvidersCatalog] = useState<ProviderManagerItem[]>([]);
  const [titleEditMode, setTitleEditMode] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [categoryEditMode, setCategoryEditMode] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<{ id: string; versionNumber: number } | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [savingVersion, setSavingVersion] = useState(false);
  const [showWrapperPicker, setShowWrapperPicker] = useState(false);
  const [versionDraft, setVersionDraft] = useState({
    wrapperId: "",
    promptText: "",
    changeNote: "",
  });
  const [versionDraftMode, setVersionDraftMode] = useState(false);
  const [resultForm, setResultForm] = useState({
    modelId: "",
    htmlContent: "",
    notes: "",
  });
  const [editResultDraft, setEditResultDraft] = useState({
    experimentVersionId: "",
    modelId: "",
    htmlContent: "",
    notes: "",
  });
  const [modelSearch, setModelSearch] = useState("");
  const [modelProviderFilter, setModelProviderFilter] = useState("all");
  const [modelSort, setModelSort] = useState<"recent" | "name">("recent");
  const [modelLibraryTab, setModelLibraryTab] = useState<"catalog" | "mine">("mine");
  const [catalogPopularOnly, setCatalogPopularOnly] = useState(false);
  const [modelDraft, setModelDraft] = useState({
    providerMode: "existing",
    providerId: "",
    providerColor: "#5b8def",
    providerName: "",
    modelName: "",
    modelVersion: "",
    modelComment: "",
    isActive: true,
  });
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [duplicatingModelId, setDuplicatingModelId] = useState<string | null>(null);

  const refreshWorkspace = useCallback(async () => {
    if (!experimentId) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [nextWorkspace, nextCategories, nextWrappers, nextModels, nextProviders, nextCatalogItems] = await Promise.all([
      loadExperimentWorkspace(experimentId),
      loadCategoryOptions(),
      loadWrapperOptions(),
      loadModelOptions(),
      loadProvidersCatalog(),
      loadCatalogBrowserItems(),
    ]);
    setWorkspace(nextWorkspace);
    setCategoryOptions(nextCategories);
    setWrapperOptions(nextWrappers);
    setModelOptions(nextModels);
    setProvidersCatalog(nextProviders);
    setCatalogItems(nextCatalogItems);
    setLoading(false);
  }, [experimentId]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    setResultHtmlById({});
    setLoadingResultHtmlIds([]);
  }, [experimentId]);

  const sortVisibleResults = useCallback(
    (left: WorkspaceResultItem, right: WorkspaceResultItem) => {
      switch (resultsSort) {
        case "date":
          return Date.parse(right.createdAt) - Date.parse(left.createdAt);
        case "model":
          return (
            left.providerName.localeCompare(right.providerName) ||
            left.modelName.localeCompare(right.modelName) ||
            left.modelVersion.localeCompare(right.modelVersion)
          );
        case "rating":
        default:
          return (right.rating ?? -1) - (left.rating ?? -1) || Date.parse(right.createdAt) - Date.parse(left.createdAt);
      }
    },
    [resultsSort],
  );

  const visibleResults = useMemo(() => {
    if (!workspace || !resultsVersionFilterId) {
      return [];
    }

    if (resultsVersionFilterId === ALL_VERSIONS_FILTER) {
      return [...workspace.results].sort(sortVisibleResults);
    }

    const activeVersion = workspace.promptVersions.find((item) => item.id === resultsVersionFilterId);
    if (!activeVersion) {
      return [];
    }

    const scoped = workspace.results.filter((item) => item.promptVersionNumber === activeVersion.versionNumber);

    return [...scoped].sort(sortVisibleResults);
  }, [resultsVersionFilterId, sortVisibleResults, workspace]);

  const visibleResultGroups = useMemo(() => {
    if (!workspace) {
      return [];
    }

    if (resultsVersionFilterId !== ALL_VERSIONS_FILTER) {
      const activeVersion = workspace.promptVersions.find((item) => item.id === resultsVersionFilterId);
      return activeVersion
        ? [
            {
              versionId: activeVersion.id,
              versionNumber: activeVersion.versionNumber,
              items: visibleResults,
            },
          ]
        : [];
    }

    return workspace.promptVersions
      .map((version) => ({
        versionId: version.id,
        versionNumber: version.versionNumber,
        items: workspace.results
          .filter((item) => item.promptVersionNumber === version.versionNumber)
          .sort(sortVisibleResults),
      }))
      .filter((group) => group.items.length > 0);
  }, [resultsVersionFilterId, sortVisibleResults, visibleResults, workspace]);

  useEffect(() => {
    if (!workspace?.promptVersions.length) {
      return;
    }

    setSelectedPromptVersionId((current) =>
      current && workspace.promptVersions.some((item) => item.id === current)
        ? current
        : workspace.promptVersions[0].id,
    );
  }, [workspace]);

  useEffect(() => {
    if (!workspace?.promptVersions.length) {
      return;
    }

    setResultsVersionFilterId((current) =>
      current === ALL_VERSIONS_FILTER || (current && workspace.promptVersions.some((item) => item.id === current))
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
    workspace?.promptVersions.find((item) => item.id === selectedPromptVersionId) ?? workspace?.promptVersions[0];
  const selectedResultsVersion =
    resultsVersionFilterId && resultsVersionFilterId !== ALL_VERSIONS_FILTER
      ? workspace?.promptVersions.find((item) => item.id === resultsVersionFilterId) ?? null
      : null;
  const latestPromptVersion = workspace?.promptVersions[0] ?? null;
  const effectiveAddResultVersion = selectedResultsVersion ?? latestPromptVersion;
  const selectedDraftWrapper = wrapperOptions.find((option) => option.id === versionDraft.wrapperId);
  const selectedVersionWrapperLabel = selectedDraftWrapper?.label ?? "No wrapper";
  const hasResults = visibleResults.length > 0;
  const allVersionsSelected = resultsVersionFilterId === ALL_VERSIONS_FILTER;
  const selectedVersionHasResults = (activePrompt?.resultCount ?? 0) > 0;
  const canEditSelectedVersionFields = Boolean(activePrompt) && !versionDraftMode && !selectedVersionHasResults;
  const canEditSelectedVersionNote = Boolean(activePrompt) && !versionDraftMode;
  const selectedResultsComposedPrompt = effectiveAddResultVersion
    ? buildPromptForClipboard(effectiveAddResultVersion.promptText, effectiveAddResultVersion.wrapperTemplate)
    : "";

  useEffect(() => {
    setNotesDraft(selectedResult?.notes ?? "");
  }, [selectedResult?.id, selectedResult?.notes]);

  const ensureResultHtml = useCallback(async (resultId?: string) => {
    if (!resultId) {
      return null;
    }

    const cachedHtml = resultHtmlById[resultId];
    if (cachedHtml !== undefined) {
      return cachedHtml;
    }

    setLoadingResultHtmlIds((current) => (current.includes(resultId) ? current : [...current, resultId]));

    try {
      const htmlContent = await loadResultHtmlContent(resultId);

      setResultHtmlById((current) => {
        if (htmlContent === null || current[resultId] !== undefined) {
          return current;
        }

        return {
          ...current,
          [resultId]: htmlContent,
        };
      });

      return htmlContent;
    } finally {
      setLoadingResultHtmlIds((current) => current.filter((item) => item !== resultId));
    }
  }, [resultHtmlById]);

  useEffect(() => {
    void ensureResultHtml(selectedResult?.id);
  }, [ensureResultHtml, selectedResult?.id]);

  useEffect(() => {
    if (viewMode !== "sbs") {
      return;
    }

    void Promise.all([ensureResultHtml(slotA?.id), ensureResultHtml(slotB?.id)]);
  }, [ensureResultHtml, slotA?.id, slotB?.id, viewMode]);

  useEffect(() => {
    setShowPreviewMenu(false);
  }, [selectedResultId, viewMode]);

  useEffect(() => {
    setResultActionsId("");
  }, [resultsVersionFilterId, selectedResultId, viewMode]);

  useEffect(() => {
    if (!showFullscreen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showFullscreen]);

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
    if (!providersCatalog.length) {
      return;
    }

    setModelDraft((current) => ({
      ...current,
      providerId:
        current.providerId && providersCatalog.some((provider) => provider.id === current.providerId)
          ? current.providerId
          : providersCatalog[0].id,
    }));
  }, [providersCatalog]);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    setTitleDraft(workspace.title);
    setTitleEditMode(false);
    setCategoryEditMode(false);
  }, [workspace]);

  useEffect(() => {
    if (!activePrompt || versionDraftMode) {
      return;
    }

    setVersionDraft({
      wrapperId: activePrompt.wrapperVersionId ?? "",
      promptText: activePrompt.promptText ?? "",
      changeNote: activePrompt.changeNote ?? "",
    });
  }, [activePrompt, versionDraftMode]);

  const selectedVersionDirty = Boolean(
    !versionDraftMode &&
      activePrompt &&
      (versionDraft.promptText !== activePrompt.promptText ||
        versionDraft.wrapperId !== (activePrompt.wrapperVersionId ?? "") ||
        versionDraft.changeNote !== activePrompt.changeNote),
  );

  const filteredModelOptions = useMemo(() => {
    const search = modelSearch.trim().toLowerCase();

    return modelOptions
      .filter((option) => {
        const matchesProvider =
          modelProviderFilter === "all" ? true : option.providerName === modelProviderFilter;
        const matchesSearch = search
          ? [option.providerName, option.modelName, option.modelVersion, option.modelComment]
              .join(" ")
              .toLowerCase()
              .includes(search)
          : true;

        return matchesProvider && matchesSearch;
      })
      .sort((left, right) => {
        if (modelSort === "recent") {
          return (
            Date.parse(right.lastUsedAt ?? "1970-01-01T00:00:00.000Z") -
              Date.parse(left.lastUsedAt ?? "1970-01-01T00:00:00.000Z") ||
            left.providerName.localeCompare(right.providerName) ||
            left.modelName.localeCompare(right.modelName) ||
            left.modelVersion.localeCompare(right.modelVersion)
          );
        }

        return (
          left.providerName.localeCompare(right.providerName) ||
          left.modelName.localeCompare(right.modelName) ||
          left.modelVersion.localeCompare(right.modelVersion)
        );
      });
  }, [modelOptions, modelProviderFilter, modelSearch, modelSort]);

  const providerOptions = useMemo(
    () => [...new Set(modelOptions.map((option) => option.providerName))].sort((left, right) => left.localeCompare(right)),
    [modelOptions],
  );

  const catalogProviderOptions = useMemo(
    () => [...new Set(catalogItems.map((item) => item.providerName))].sort((left, right) => left.localeCompare(right)),
    [catalogItems],
  );

  const filteredCatalogItems = useMemo(() => {
    const search = modelSearch.trim().toLowerCase();
    const scoped = catalogItems.filter((item) => {
      const matchesPreset = catalogPopularOnly ? item.presetIds.includes("popular") : true;
      const matchesProvider = modelProviderFilter === "all" ? true : item.providerName === modelProviderFilter;
      const matchesSearch = search
        ? [item.providerName, item.displayName, item.name, item.version, ...item.aliases].join(" ").toLowerCase().includes(search)
        : true;
      return matchesPreset && matchesProvider && matchesSearch;
    });

    return scoped.sort((left, right) =>
      left.providerName.localeCompare(right.providerName) || left.displayName.localeCompare(right.displayName),
    );
  }, [catalogItems, catalogPopularOnly, modelProviderFilter, modelSearch]);

  const selectedModel = modelOptions.find((option) => option.id === resultForm.modelId);
  const selectedEditVersion = workspace?.promptVersions.find((option) => option.id === editResultDraft.experimentVersionId) ?? null;
  const selectedEditModel = modelOptions.find((option) => option.id === editResultDraft.modelId);
  const currentManagedModelId = modelManagerTarget === "edit" ? editResultDraft.modelId : resultForm.modelId;
  const selectedManagerModel =
    filteredModelOptions.find((option) => option.id === currentManagedModelId) ??
    modelOptions.find((option) => option.id === currentManagedModelId);
  const selectedResultIndex = selectedResult ? visibleResults.findIndex((item) => item.id === selectedResult.id) : -1;
  const selectedResultHtml = selectedResult ? resultHtmlById[selectedResult.id] : undefined;
  const slotAHtml = slotA ? resultHtmlById[slotA.id] : undefined;
  const slotBHtml = slotB ? resultHtmlById[slotB.id] : undefined;
  const selectedResultHtmlLoading = selectedResult ? loadingResultHtmlIds.includes(selectedResult.id) : false;
  const slotAHtmlLoading = slotA ? loadingResultHtmlIds.includes(slotA.id) : false;
  const slotBHtmlLoading = slotB ? loadingResultHtmlIds.includes(slotB.id) : false;
  const promptLineCount = Math.max(1, versionDraft.promptText.split(/\r\n|\r|\n/).length);
  const promptLineNumbers = Array.from({ length: promptLineCount }, (_, index) => index + 1);

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
    if (!selectedResultsComposedPrompt) {
      return;
    }

    setCopyingPrompt(true);
    await navigator.clipboard.writeText(selectedResultsComposedPrompt);
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

  const onSelectAdjacentResult = (direction: "prev" | "next") => {
    if (!visibleResults.length || selectedResultIndex === -1) {
      return;
    }

    const delta = direction === "prev" ? -1 : 1;
    const nextIndex = (selectedResultIndex + delta + visibleResults.length) % visibleResults.length;
    const nextResultId = visibleResults[nextIndex]?.id;

    if (!nextResultId) {
      return;
    }

    setSelectedResultId(nextResultId);
    setShowPreviewMenu(false);
  };

  const onOpenEditResult = async (result: WorkspaceResultItem) => {
    const htmlContent = (await ensureResultHtml(result.id)) ?? "";
    setEditingResult(result);
    setEditResultDraft({
      experimentVersionId: result.experimentVersionId,
      modelId: result.modelId,
      htmlContent,
      notes: result.notes,
    });
    setResultActionsId("");
  };

  const onSaveEditResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace || !editingResult || !editResultDraft.experimentVersionId || !editResultDraft.modelId) {
      return;
    }

    setSavingEditResult(true);
    await updateResultEntry({
      resultId: editingResult.id,
      experimentId: workspace.id,
      experimentVersionId: editResultDraft.experimentVersionId,
      modelId: editResultDraft.modelId,
      htmlContent: editResultDraft.htmlContent,
      notes: editResultDraft.notes,
    });
    setResultHtmlById((current) => ({
      ...current,
      [editingResult.id]: editResultDraft.htmlContent,
    }));
    await refreshWorkspace();
    if (resultsVersionFilterId !== ALL_VERSIONS_FILTER) {
      setResultsVersionFilterId(editResultDraft.experimentVersionId);
    }
    setSelectedResultId(editingResult.id);
    setEditingResult(null);
    setSavingEditResult(false);
  };

  const onConfirmDeleteResult = async () => {
    if (!showDeleteResult) {
      return;
    }

    const deletingId = showDeleteResult.id;
    setDeletingResult(true);
    await deleteResultEntry({
      resultId: deletingId,
      experimentId: workspace.id,
    });
    setResultHtmlById((current) => {
      const next = { ...current };
      delete next[deletingId];
      return next;
    });
    await refreshWorkspace();
    if (selectedResultId === deletingId) {
      setSelectedResultId("");
    }
    setShowDeleteResult(null);
    setDeletingResult(false);
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

    if (!workspace || !effectiveAddResultVersion || !resultForm.htmlContent.trim() || !resultForm.modelId) {
      return;
    }

    setSavingResult(true);
    const nextResultId = await createResultEntry({
      experimentId: workspace.id,
      experimentVersionId: effectiveAddResultVersion.id,
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
    setResultHtmlById((current) => ({
      ...current,
      [nextResultId]: resultForm.htmlContent.trim(),
    }));
    await refreshWorkspace();
    setSelectedResultId(nextResultId);
    setSlotAId(nextResultId);
    setSlotBId(nextResultId);
    setViewMode("single");
    setShowCode(false);
    setShowNotes(false);
  };

  const resetManagedModelDraft = (nextProviders: ProviderManagerItem[] = providersCatalog) => {
    setModelDraft({
      providerMode: nextProviders.length ? "existing" : "new",
      providerId: nextProviders[0]?.id ?? "",
      providerColor: "#5b8def",
      providerName: "",
      modelName: "",
      modelVersion: "",
      modelComment: "",
      isActive: true,
    });
    setEditingModelId(null);
    setDuplicatingModelId(null);
  };

  const openEditManagedModel = (option: ModelSelectOption) => {
    setEditingModelId(option.id);
    setDuplicatingModelId(null);
    setModelDraft({
      providerMode: "existing",
      providerId: option.providerId,
      providerColor: option.providerColor,
      providerName: option.providerName,
      modelName: option.modelName,
      modelVersion: option.modelVersion,
      modelComment: option.modelComment,
      isActive: option.isActive,
    });
  };

  const openDuplicateManagedModel = (option: ModelSelectOption) => {
    setEditingModelId(null);
    setDuplicatingModelId(option.id);
    setModelDraft({
      providerMode: "existing",
      providerId: option.providerId,
      providerColor: option.providerColor,
      providerName: option.providerName,
      modelName: option.modelName,
      modelVersion: `${option.modelVersion} copy`,
      modelComment: option.modelComment,
      isActive: option.isActive,
    });
  };

  const onCreateModel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const providerName =
      modelDraft.providerMode === "new"
        ? modelDraft.providerName.trim()
        : providersCatalog.find((provider) => provider.id === modelDraft.providerId)?.name?.trim() ?? "";

    if (!providerName || !modelDraft.modelName.trim() || !modelDraft.modelVersion.trim()) {
      return;
    }

    setSavingModel(true);
    let providerId = modelDraft.providerId;

    if (modelDraft.providerMode === "new") {
      providerId = await createProviderEntry({
        name: providerName,
        color: modelDraft.providerColor,
      });
    }

    let modelId: string | null = null;

    if (editingModelId) {
      await updateModelEntry({
        modelId: editingModelId,
        providerId,
        name: modelDraft.modelName,
        version: modelDraft.modelVersion,
        comment: modelDraft.modelComment,
        isActive: modelDraft.isActive,
      });
      modelId = editingModelId;
    } else {
      modelId = await createModelEntry({
        providerName,
        providerColor: modelDraft.providerMode === "new" ? modelDraft.providerColor : undefined,
        modelName: modelDraft.modelName,
        modelVersion: modelDraft.modelVersion,
        modelComment: modelDraft.modelComment,
        isActive: modelDraft.isActive,
      });
    }

    const [nextModels, nextProviders, nextCatalogItems] = await Promise.all([
      loadModelOptions(),
      loadProvidersCatalog(),
      loadCatalogBrowserItems(),
    ]);
    setModelOptions(nextModels);
    setProvidersCatalog(nextProviders);
    setCatalogItems(nextCatalogItems);
    if (modelId) {
      setResultForm((current) => ({ ...current, modelId }));
    }
    resetManagedModelDraft(nextProviders);
    setSavingModel(false);
  };

  const onSaveTitle = async () => {
    if (!workspace) {
      return;
    }

    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle === workspace.title) {
      setTitleDraft(workspace.title);
      setTitleEditMode(false);
      return;
    }

    setSavingTitle(true);
    await updateExperimentEntry({
      experimentId: workspace.id,
      title: nextTitle,
      description: workspace.description,
      categoryId: workspace.categoryId,
      tags: workspace.tags,
    });
    await refreshWorkspace();
    setSavingTitle(false);
    setTitleEditMode(false);
  };

  const onSelectCategory = async (categoryId: string) => {
    if (!workspace || categoryId === (workspace.categoryId ?? "")) {
      setCategoryEditMode(false);
      return;
    }

    setSavingCategory(true);
    await updateExperimentEntry({
      experimentId: workspace.id,
      title: workspace.title,
      description: workspace.description,
      categoryId: categoryId || null,
      tags: workspace.tags,
    });
    await refreshWorkspace();
    setSavingCategory(false);
    setCategoryEditMode(false);
  };

  const onUseCatalogModel = async (catalogModelId: string) => {
    setSavingModel(true);
    const modelId = await createModelFromCatalog(catalogModelId);
    const [nextModels, nextProviders, nextCatalogItems] = await Promise.all([
      loadModelOptions(),
      loadProvidersCatalog(),
      loadCatalogBrowserItems(),
    ]);
    setModelOptions(nextModels);
    setProvidersCatalog(nextProviders);
    setCatalogItems(nextCatalogItems);
    if (modelManagerTarget === "edit") {
      setEditResultDraft((current) => ({ ...current, modelId }));
    } else {
      setResultForm((current) => ({ ...current, modelId }));
    }
    setShowModelManager(false);
    setSavingModel(false);
  };

  const onLoadPopularPreset = async () => {
    setSavingModel(true);
    const loaded = await applyCatalogPreset("popular");
    const [nextModels, nextProviders, nextCatalogItems] = await Promise.all([
      loadModelOptions(),
      loadProvidersCatalog(),
      loadCatalogBrowserItems(),
    ]);
    setModelOptions(nextModels);
    setProvidersCatalog(nextProviders);
    setCatalogItems(nextCatalogItems);
    if (loaded[0]) {
      if (modelManagerTarget === "edit") {
        setEditResultDraft((current) => ({ ...current, modelId: loaded[0] }));
      } else {
        setResultForm((current) => ({ ...current, modelId: loaded[0] }));
      }
    }
    setModelLibraryTab("mine");
    setCatalogPopularOnly(false);
    setSavingModel(false);
  };

  const openModelManager = (target: "add" | "edit") => {
    setModelManagerTarget(target);
    setModelLibraryTab("mine");
    setCatalogPopularOnly(false);
    setModelSearch("");
    setModelProviderFilter("all");
    setModelSort("recent");
    setShowModelManager(true);
  };

  const startPromptVersionDraft = () => {
    setVersionDraft({
      wrapperId: activePrompt?.wrapperVersionId ?? "",
      promptText: activePrompt?.promptText ?? "",
      changeNote: "",
    });
    setVersionDraftMode(true);
  };

  const discardPromptVersionDraft = () => {
    setVersionDraft({
      wrapperId: activePrompt?.wrapperVersionId ?? "",
      promptText: activePrompt?.promptText ?? "",
      changeNote: "",
    });
    setVersionDraftMode(false);
  };

  const onCreatePromptVersion = async () => {
    setCreatingVersion(true);
    const nextPromptText = versionDraft.promptText.trim();
    const nextChangeNote =
      versionDraft.changeNote.trim() || `Forked from v${activePrompt?.versionNumber ?? "?"}`;

    const promptVersionId = await createPromptVersionEntry({
      experimentId: workspace.id,
      promptText: nextPromptText,
      wrapperVersionId: versionDraft.wrapperId || null,
      changeNote: nextChangeNote,
    });
    await refreshWorkspace();
    setSelectedPromptVersionId(promptVersionId);
    setResultsVersionFilterId(promptVersionId);
    setVersionDraftMode(false);
    setCreatingVersion(false);
  };

  const onSaveSelectedVersion = async () => {
    if (!workspace || !activePrompt) {
      return;
    }

    setSavingVersion(true);
    try {
      if (activePrompt.resultCount === 0) {
        await updateExperimentVersionEntry({
          experimentVersionId: activePrompt.id,
          experimentId: workspace.id,
          promptText: versionDraft.promptText,
          wrapperVersionId: versionDraft.wrapperId || null,
          changeNote: versionDraft.changeNote,
        });
      } else {
        await updateExperimentVersionChangeNote({
          experimentVersionId: activePrompt.id,
          experimentId: workspace.id,
          changeNote: versionDraft.changeNote,
        });
      }

      await refreshWorkspace();
      setSelectedPromptVersionId(activePrompt.id);
    } finally {
      setSavingVersion(false);
    }
  };

  const onDeleteExperimentVersion = async (experimentVersionId: string) => {
    setDeletingVersionId(experimentVersionId);
    await deleteExperimentVersionEntry(experimentVersionId);
    await refreshWorkspace();
    setDeleteVersionTarget(null);
    setDeletingVersionId(null);
    setVersionDraftMode(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="px-1">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"
            onClick={() => navigate(`/${appRoutes.experiments}`)}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to experiments
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {titleEditMode ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  className="h-10 min-w-0 flex-1 rounded-md border border-primary/50 bg-code px-3 font-mono text-xl font-semibold tracking-[-0.04em] text-text outline-none"
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void onSaveTitle();
                    }
                    if (event.key === "Escape") {
                      setTitleDraft(workspace.title);
                      setTitleEditMode(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-code text-muted transition hover:text-text"
                  onClick={() => void onSaveTitle()}
                  disabled={savingTitle}
                  aria-label="Save title"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-code text-muted transition hover:text-text"
                  onClick={() => {
                    setTitleDraft(workspace.title);
                    setTitleEditMode(false);
                  }}
                  disabled={savingTitle}
                  aria-label="Cancel title edit"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate font-mono text-xl font-semibold tracking-[-0.04em] text-text">
                    {workspace.title}
                  </h1>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-text"
                    onClick={() => setTitleEditMode(true)}
                    aria-label="Edit experiment title"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {categoryEditMode ? (
                  <Select
                    wrapperClassName="min-w-[220px]"
                    value={workspace.categoryId ?? ""}
                    onChange={(event) => void onSelectCategory(event.target.value)}
                    className="h-9 rounded-full bg-white/5 pl-3 pr-10 text-xs"
                    disabled={savingCategory}
                  >
                    <option value="">No category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted transition hover:bg-white/10 hover:text-text"
                    onClick={() => setCategoryEditMode(true)}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: workspace.categoryColor }} />
                    {workspace.categoryName}
                  </button>
                )}
              </>
            )}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted">{workspace.description}</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)] min-h-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface/70 shadow-panel lg:h-[calc(100vh-96px)]">
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
            <Select
              className="h-9"
              wrapperClassName="min-w-[124px]"
              value={resultsVersionFilterId}
              onChange={(event) => setResultsVersionFilterId(event.target.value)}
            >
              <option value={ALL_VERSIONS_FILTER}>All versions</option>
              {workspace.promptVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.versionNumber}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={() => setShowAddResult(true)} disabled={!effectiveAddResultVersion}>
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
                  {allVersionsSelected ? "All experiment versions" : `Experiment version v${selectedResultsVersion?.versionNumber ?? "-"}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-dim" />
                <Select
                  className="h-9"
                  wrapperClassName="min-w-[132px]"
                  value={resultsSort}
                  onChange={(event) => setResultsSort(event.target.value as typeof resultsSort)}
                >
                  <option value="rating">By rating</option>
                  <option value="date">By date</option>
                  <option value="model">By model</option>
                </Select>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2">
              {hasResults ? (
                visibleResultGroups.map((group) => (
                  <div key={group.versionId} className="space-y-1">
                    {allVersionsSelected ? (
                      <div className="px-2 pt-1">
                        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                          Version v{group.versionNumber}
                        </div>
                      </div>
                    ) : null}
                    {group.items.map((result) => {
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
                        <div className="flex min-w-0 items-start gap-2">
                          <div
                            className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-text"
                            title={`${result.providerName} / ${result.modelName} ${result.modelVersion}`}
                          >
                            {result.providerName} / {result.modelName} {result.modelVersion}
                          </div>
                          {viewMode === "sbs" && isA ? (
                            <span className="shrink-0 rounded bg-primary-soft/60 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                              A
                            </span>
                          ) : null}
                          {viewMode === "sbs" && isB ? (
                            <span className="shrink-0 rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] text-orange-300">
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
                      <div className="relative ml-1">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-code hover:text-text"
                          onClick={(event) => {
                            event.stopPropagation();
                            setResultActionsId((current) => (current === result.id ? "" : result.id));
                          }}
                          aria-label="Result actions"
                        >
                          <Ellipsis className="h-4 w-4" />
                        </button>
                        {resultActionsId === result.id ? (
                          <div className="absolute right-0 top-9 z-10 w-36 rounded-lg border border-border/80 bg-raised p-1.5 shadow-panel">
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted transition hover:bg-code hover:text-text"
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenEditResult(result);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-300 transition hover:bg-code"
                              onClick={(event) => {
                                event.stopPropagation();
                                setShowDeleteResult(result);
                                setResultActionsId("");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                    })}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/80 bg-surface/30 px-4 py-6 text-sm text-muted">
                  {allVersionsSelected
                    ? "No results yet across any experiment version. Pick a concrete version in the toolbar to add a result."
                    : `No results yet for experiment version v${selectedResultsVersion?.versionNumber ?? "-"}.`}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col">
            {hasResults ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
                  <div className="min-w-0">
                    {viewMode === "single" ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: selectedResult?.providerColor }}
                          />
                          <div
                            className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-text"
                            title={`${selectedResult?.providerName ?? ""} / ${selectedResult?.modelName ?? ""} ${selectedResult?.modelVersion ?? ""}`}
                          >
                            {selectedResult?.providerName ?? ""} / {selectedResult?.modelName ?? ""}{" "}
                            {selectedResult?.modelVersion ?? ""}
                          </div>
                        </div>
                        <RatingStars
                          value={selectedResult?.rating ?? null}
                          disabled={savingRating || !selectedResult}
                          onChange={(value) => void onChangeRating(value ? String(value) : "")}
                        />
                        <div className="mt-1 text-xs text-muted">
                          {selectedResult?.modelComment || "No comment"} • {selectedResult?.fileSizeBytes ?? 0} bytes •{" "}
                          {selectedResult?.lineCount ?? 0} lines
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="truncate text-sm font-semibold text-text">Comparison workspace</div>
                        <div className="mt-1 text-xs text-muted">
                          Click results on the left to assign slots A and B.
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative flex flex-wrap items-center gap-2">
                    <div className="flex rounded-md border border-border/80 bg-code p-1">
                      <DeviceButton active={device === "mobile"} onClick={() => setDevice("mobile")} icon={Smartphone} label="Mobile" />
                      <DeviceButton active={device === "tablet"} onClick={() => setDevice("tablet")} icon={Tablet} label="Tablet" />
                      <DeviceButton active={device === "desktop"} onClick={() => setDevice("desktop")} icon={Monitor} label="Desktop" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowFullscreen(true)}>
                      <Expand className="h-4 w-4" />
                      Fullscreen
                    </Button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-code text-muted transition hover:text-text"
                      onClick={() => setShowPreviewMenu((value) => !value)}
                      aria-label="More actions"
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                    {showPreviewMenu ? (
                      <div className="absolute right-0 top-11 z-10 w-44 rounded-lg border border-border/80 bg-raised p-1.5 shadow-panel">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted transition hover:bg-code hover:text-text"
                          onClick={() => {
                            setShowCode((value) => !value);
                            setShowPreviewMenu(false);
                          }}
                        >
                          <Code2 className="h-4 w-4" />
                          {showCode ? "Hide code" : "Show code"}
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted transition hover:bg-code hover:text-text"
                          onClick={() => {
                            setShowNotes((value) => !value);
                            setShowPreviewMenu(false);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          {showNotes ? "Hide notes" : "Show notes"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto bg-code p-4">
                  {showFullscreen ? (
                    <div className="flex h-full min-h-[520px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-surface/40">
                      <div className="text-center">
                        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Fullscreen active</div>
                        <div className="mt-2 text-sm text-muted">Live preview is rendered only in the fullscreen overlay.</div>
                      </div>
                    </div>
                  ) : viewMode === "single" ? (
                    <SinglePreviewCanvas
                      result={selectedResult}
                      htmlContent={selectedResultHtml}
                      loading={selectedResultHtmlLoading}
                      device={device}
                      showCode={showCode}
                    />
                  ) : (
                    <CompareCanvas
                      slotA={slotA}
                      slotB={slotB}
                      slotAHtml={slotAHtml}
                      slotBHtml={slotBHtml}
                      slotAHtmlLoading={slotAHtmlLoading}
                      slotBHtmlLoading={slotBHtmlLoading}
                      device={device}
                      showCode={showCode}
                      split={compareSplit}
                      onSplitChange={setCompareSplit}
                    />
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
                    {allVersionsSelected
                      ? "No results across experiment versions yet"
                      : `No results for experiment version v${selectedResultsVersion?.versionNumber ?? "-"} yet`}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {allVersionsSelected
                      ? `Add result will use the latest experiment version v${effectiveAddResultVersion?.versionNumber ?? "-"} while the list stays grouped by all versions.`
                      : "Copy the prompt for the current version, run it in an external LLM chat, then add the generated HTML result here."}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <Button variant="ghost" onClick={() => void copyPrompt()} disabled={!selectedResultsComposedPrompt}>
                      <Copy className="h-4 w-4" />
                      {copyingPrompt ? "Copied" : "Copy prompt"}
                    </Button>
                    <Button onClick={() => setShowAddResult(true)} disabled={!effectiveAddResultVersion}>
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
        <div className="grid gap-5 p-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Versions</div>
              <Button variant="ghost" size="sm" onClick={startPromptVersionDraft} disabled={creatingVersion}>
                <Plus className="h-4 w-4" />
                New version
              </Button>
            </div>
            <div className="space-y-2">
              {workspace.promptVersions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    "rounded-lg border px-3 py-3 transition",
                    selectedPromptVersionId === version.id
                      ? "border-primary/60 bg-primary-soft/20"
                      : "border-border/80 bg-code/40 hover:border-primary/40 hover:bg-code/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setSelectedPromptVersionId(version.id);
                        setVersionDraftMode(false);
                      }}
                    >
                      <div className="font-mono text-sm text-text">v{version.versionNumber}</div>
                      <div className="mt-1 text-xs text-muted">
                        {version.resultCount} result{version.resultCount === 1 ? "" : "s"}
                      </div>
                      <div className="mt-2 text-sm text-muted">
                        {version.changeNote || "No change note"}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="mt-0.5 text-muted transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => setDeleteVersionTarget({ id: version.id, versionNumber: version.versionNumber })}
                      disabled={version.resultCount > 0 || workspace.promptVersions.length <= 1}
                      aria-label={`Delete experiment version v${version.versionNumber}`}
                      title={
                        version.resultCount > 0
                          ? "Used by saved results"
                          : workspace.promptVersions.length <= 1
                            ? "Cannot delete the last remaining version"
                            : "Delete unused version"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="min-h-0 space-y-4">
            <div className="flex min-h-0 max-h-[calc(100vh-240px)] flex-col overflow-hidden rounded-lg border border-border/80 bg-code p-4">
              <div className="shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">
                      {versionDraftMode ? "New version draft" : "Selected version"}
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {versionDraftMode
                        ? "Draft changes stay local until you explicitly create a new experiment version."
                        : canEditSelectedVersionFields
                          ? `Version v${activePrompt?.versionNumber ?? "-"} has no linked results yet, so prompt, wrapper, and change note can still be edited in place.`
                          : `Version v${activePrompt?.versionNumber ?? "-"} already has linked results, so only change note stays editable.`}
                    </div>
                  </div>
                  {!versionDraftMode ? (
                    <div className="text-xs text-muted">{canEditSelectedVersionFields ? "Editable" : "Note only"}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="sticky top-0 z-10 -mx-4 border-b border-border/80 bg-code/95 px-4 pb-4 backdrop-blur supports-[backdrop-filter]:bg-code/80">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {versionDraftMode || canEditSelectedVersionFields ? (
                      <div>
                        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Wrapper version</div>
                        <button
                          type="button"
                          className="flex min-h-10 w-full items-center justify-between rounded-md border border-border/80 bg-code px-3 py-2 text-left text-sm text-text transition hover:border-primary/50"
                          onClick={() => setShowWrapperPicker(true)}
                        >
                          <span className="min-w-0 truncate">{selectedVersionWrapperLabel}</span>
                          <span className="shrink-0 text-xs text-dim">
                            {versionDraft.wrapperId ? "Change" : "Choose"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Wrapper</div>
                        <div className="rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-muted">
                          {activePrompt?.wrapperVersionId
                            ? `${activePrompt.wrapperName} v${activePrompt.wrapperVersionNumber ?? "?"}`
                            : "No wrapper"}
                        </div>
                      </div>
                    )}

                    {versionDraftMode || canEditSelectedVersionNote ? (
                      <div className="space-y-2">
                        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Change note</div>
                        <InputLike
                          value={versionDraft.changeNote}
                          onChange={(value) =>
                            setVersionDraft((current) => ({ ...current, changeNote: value }))
                          }
                          placeholder="What changed from the previous version"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Change note</div>
                        <div className="rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-muted">
                          {activePrompt?.changeNote || "No change note"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden pt-4 pr-1">
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-dim">Prompt text</div>
                    <div className="grid h-full min-h-[320px] grid-cols-[52px_minmax(0,1fr)] overflow-hidden rounded-lg border border-border/80 bg-[#050608]">
                      <div className="overflow-auto border-r border-border/80 bg-black/20 px-3 py-3 text-right font-mono text-xs leading-6 text-dim">
                        {promptLineNumbers.map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                      {versionDraftMode || canEditSelectedVersionFields ? (
                        <textarea
                          className="h-full min-h-0 w-full resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-sm leading-6 text-text outline-none"
                          value={versionDraft.promptText}
                          onChange={(event) =>
                            setVersionDraft((current) => ({ ...current, promptText: event.target.value }))
                          }
                        />
                      ) : (
                        <pre className="h-full min-h-0 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-sm leading-6 text-text">
                          {activePrompt?.promptText ?? ""}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {versionDraftMode ? (
                <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border/80 pt-4">
                  <Button variant="ghost" onClick={discardPromptVersionDraft}>
                    Discard draft
                  </Button>
                  <Button onClick={() => void onCreatePromptVersion()} disabled={creatingVersion || !versionDraft.promptText.trim()}>
                    <Plus className="h-4 w-4" />
                    Create version
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex shrink-0 justify-end border-t border-border/80 pt-4">
                  <Button
                    onClick={() => void onSaveSelectedVersion()}
                    disabled={
                      savingVersion ||
                      !selectedVersionDirty ||
                      (canEditSelectedVersionFields && !versionDraft.promptText.trim())
                    }
                  >
                    <Save className="h-4 w-4" />
                    {selectedVersionHasResults ? "Save note" : "Save version"}
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      </div>

      <ConfirmDialog
        open={deleteVersionTarget !== null}
        title={deleteVersionTarget ? `Delete version v${deleteVersionTarget.versionNumber}?` : "Delete version?"}
        description="Only versions with no saved results can be deleted. The last remaining experiment version cannot be removed."
        confirmLabel="Delete version"
        onCancel={() => {
          if (!deletingVersionId) {
            setDeleteVersionTarget(null);
          }
        }}
        onConfirm={() => {
          if (deleteVersionTarget) {
            void onDeleteExperimentVersion(deleteVersionTarget.id);
          }
        }}
        busy={deleteVersionTarget !== null && deletingVersionId === deleteVersionTarget.id}
      />

      <WrapperVersionPickerDialog
        open={showWrapperPicker}
        value={versionDraft.wrapperId}
        options={wrapperOptions}
        title="Choose wrapper version"
        description={
          versionDraftMode
            ? "Pick the exact immutable wrapper version for this new experiment version draft."
            : "Pick the exact immutable wrapper version for the selected experiment version."
        }
        onClose={() => setShowWrapperPicker(false)}
        onSelect={(value) => setVersionDraft((current) => ({ ...current, wrapperId: value }))}
      />

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
                  Attach HTML output to experiment version v{effectiveAddResultVersion?.versionNumber ?? "-"}.
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
                        v{effectiveAddResultVersion?.versionNumber ?? "-"}
                      </span>
                      <span>
                        {effectiveAddResultVersion?.wrapperVersionId
                          ? `${effectiveAddResultVersion.wrapperName} v${effectiveAddResultVersion.wrapperVersionNumber ?? "?"}`
                          : "No wrapper"}
                      </span>
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
                <details className="mt-3 rounded-lg border border-border/80 bg-[#050608] p-3">
                  <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-[0.12em] text-dim">
                    Prompt preview
                  </summary>
                  <pre className="mt-3 max-h-[160px] overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-muted">
                    {selectedResultsComposedPrompt || "Select an experiment version first."}
                  </pre>
                </details>
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => openModelManager("add")}
                  >
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
              <Button type="submit" disabled={savingResult || !resultForm.modelId || !selectedResultsVersion}>
                Save result
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {editingResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form className="w-full max-w-4xl rounded-xl border border-border/80 bg-raised p-5 shadow-panel" onSubmit={onSaveEditResult}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xl font-semibold text-text">Edit result</h2>
                <p className="mt-1 text-sm text-muted">
                  Update the saved HTML output for {editingResult.providerName} / {editingResult.modelName} {editingResult.modelVersion}.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text"
                onClick={() => setEditingResult(null)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Experiment version</div>
                <div className="rounded-lg border border-border/80 bg-code px-3 py-3">
                  <Select
                    className="h-10"
                    wrapperClassName="w-full"
                    value={editResultDraft.experimentVersionId}
                    onChange={(event) =>
                      setEditResultDraft((current) => ({ ...current, experimentVersionId: event.target.value }))
                    }
                  >
                    {workspace.promptVersions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {`v${version.versionNumber} • ${version.resultCount} result${version.resultCount === 1 ? "" : "s"}`}
                      </option>
                    ))}
                  </Select>
                  <div className="mt-2 text-xs text-muted">
                    {selectedEditVersion
                      ? selectedEditVersion.wrapperVersionId
                        ? `Wrapper: ${selectedEditVersion.wrapperName} v${selectedEditVersion.wrapperVersionNumber ?? "?"}`
                        : "Wrapper: No wrapper"
                      : "Choose the version this saved result belongs to."}
                  </div>
                </div>
                <div className="text-xs text-muted">
                  If you move the result to another version, its prompt and wrapper snapshots will be updated to that version and attempt will be recalculated in the new version+model pair.
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Model</div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-code px-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">
                      {selectedEditModel?.label ?? "No model selected"}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      Reassign this result to another local model if needed.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => openModelManager("edit")}
                  >
                    Change model
                  </Button>
                </div>
                <div className="text-xs text-muted">
                  If you reassign the result to another model, the attempt number and aggregate stats will be recalculated automatically.
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">HTML output</div>
                <textarea
                  className="min-h-[320px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 font-mono text-sm text-text outline-none focus:border-primary"
                  value={editResultDraft.htmlContent}
                  onChange={(event) =>
                    setEditResultDraft((current) => ({ ...current, htmlContent: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Notes</div>
                <textarea
                  className="min-h-[100px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  value={editResultDraft.notes}
                  onChange={(event) =>
                    setEditResultDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingResult(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEditResult || !editResultDraft.experimentVersionId || !editResultDraft.modelId}>
                <Save className="h-4 w-4" />
                Save result
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showDeleteResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border/80 bg-raised p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xl font-semibold text-text">Delete result</h2>
                <p className="mt-1 text-sm text-muted">
                  This will permanently remove the selected result from the current experiment version.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text"
                onClick={() => setShowDeleteResult(null)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 rounded-lg border border-border/80 bg-code px-4 py-3 text-sm text-text">
              {showDeleteResult.providerName} / {showDeleteResult.modelName} {showDeleteResult.modelVersion}
              <div className="mt-1 text-xs text-muted">Attempt {showDeleteResult.attempt}</div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowDeleteResult(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void onConfirmDeleteResult()} disabled={deletingResult}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showModelManager ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[1280px] rounded-xl border border-border/80 bg-raised p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-mono text-xl font-semibold text-text">Choose model</h3>
                <p className="mt-1 text-sm text-muted">
                  Pick one of your local models first, or open the catalog to import another model.
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

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {(["mine", "catalog"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        modelLibraryTab === tab ? "border-primary bg-primary-soft/50 text-primary" : "border-border/80 text-muted",
                      )}
                      onClick={() => setModelLibraryTab(tab)}
                    >
                      {tab === "catalog" ? "Catalog" : "My models"}
                    </button>
                  ))}
                  {modelLibraryTab === "catalog" ? (
                    <Button type="button" variant="ghost" onClick={() => void onLoadPopularPreset()} disabled={savingModel}>
                      <Plus className="h-4 w-4" />
                      Import popular
                    </Button>
                  ) : null}
                  {modelLibraryTab === "catalog" ? (
                    <button
                      type="button"
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        catalogPopularOnly ? "border-primary bg-primary-soft/50 text-primary" : "border-border/80 text-muted",
                      )}
                      onClick={() => setCatalogPopularOnly((current) => !current)}
                    >
                      Popular only
                    </button>
                  ) : null}
                </div>

                <div className={cn("grid gap-3", modelLibraryTab === "mine" ? "md:grid-cols-[minmax(0,1fr)_180px_160px]" : "md:grid-cols-[minmax(0,1fr)_220px]")}>
                  <InputLike value={modelSearch} onChange={setModelSearch} placeholder="Search models..." />
                  <Select
                    wrapperClassName="w-full"
                    value={modelProviderFilter}
                    onChange={(event) => setModelProviderFilter(event.target.value)}
                  >
                    <option value="all">All providers</option>
                    {(modelLibraryTab === "mine" ? providerOptions : catalogProviderOptions).map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </Select>
                  {modelLibraryTab === "mine" ? (
                    <Select
                      wrapperClassName="w-full"
                      value={modelSort}
                      onChange={(event) => setModelSort(event.target.value as typeof modelSort)}
                    >
                      <option value="recent">Recent</option>
                      <option value="name">Name</option>
                    </Select>
                  ) : null}
                </div>

                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {modelLibraryTab === "mine" ? (
                    filteredModelOptions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/80 bg-surface/30 px-4 py-8 text-center text-sm text-muted">
                        <div>No local models match the current filters.</div>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                          <Button type="button" variant="ghost" onClick={() => setModelLibraryTab("catalog")}>
                            Open catalog
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => void onLoadPopularPreset()} disabled={savingModel}>
                            <Plus className="h-4 w-4" />
                            Import popular
                          </Button>
                        </div>
                      </div>
                    ) : (
                      filteredModelOptions.map((option) => {
                        const selected = currentManagedModelId === option.id;

                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border px-4 py-3 transition",
                              selected
                                ? "border-primary bg-primary-soft/20"
                                : "border-border/80 bg-surface/40 hover:bg-surface/70",
                            )}
                          >
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-start gap-3 text-left"
                              onClick={() => {
                                if (modelManagerTarget === "edit") {
                                  setEditResultDraft((current) => ({ ...current, modelId: option.id }));
                                } else {
                                  setResultForm((current) => ({ ...current, modelId: option.id }));
                                }
                                setShowModelManager(false);
                              }}
                            >
                              <div className="mt-0.5 text-primary">
                                <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-text">{option.label}</div>
                                <div className="mt-1 text-xs text-muted">
                                  {option.providerName}
                                  {option.pendingMatchCount > 0 ? ` • ${option.pendingMatchCount} possible match` : ""}
                                </div>
                              </div>
                            </button>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center text-muted transition hover:text-text"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDuplicateManagedModel(option);
                                }}
                                aria-label={`Duplicate ${option.label}`}
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center text-muted transition hover:text-text"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditManagedModel(option);
                                }}
                                aria-label={`Edit ${option.label}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )
                  ) : filteredCatalogItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 bg-surface/30 px-4 py-8 text-center text-sm text-muted">
                      No catalog models match the current filters.
                    </div>
                  ) : (
                    filteredCatalogItems.map((item) => {
                      const selected = item.linkedLocalModelId && currentManagedModelId === item.linkedLocalModelId;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-start gap-3 rounded-lg border px-4 py-3 transition",
                            selected
                              ? "border-primary bg-primary-soft/20"
                              : "border-border/80 bg-surface/40 hover:bg-surface/70",
                          )}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                            onClick={() => void onUseCatalogModel(item.id)}
                          >
                            <div className="mt-0.5 text-primary">
                              <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-text">{item.displayName}</div>
                              <div className="mt-1 text-xs text-muted">
                                {item.providerName}
                                {item.linkedLocalLabel ? " • already added" : item.pendingMatchId ? " • possible duplicate" : ""}
                              </div>
                            </div>
                          </button>
                          <Button type="button" variant="ghost" onClick={() => void onUseCatalogModel(item.id)} disabled={savingModel}>
                            {item.linkedLocalModelId ? "Use" : "Add"}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <form className="space-y-4 rounded-lg border border-border/80 bg-surface/50 p-4" onSubmit={onCreateModel}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">
                    {editingModelId ? "Edit model" : duplicatingModelId ? "Duplicate model" : "Add new model"}
                  </div>
                  {(editingModelId || duplicatingModelId || modelDraft.modelName || modelDraft.modelVersion || modelDraft.providerName) ? (
                    <button
                      type="button"
                      className="text-xs text-muted transition hover:text-text"
                      onClick={() => resetManagedModelDraft()}
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Provider source</span>
                  <div className="flex rounded-md border border-border/80 bg-code p-1">
                    <button
                      type="button"
                      className={cn("rounded px-3 py-2 text-sm text-muted transition", modelDraft.providerMode === "existing" && "bg-surface text-text")}
                      onClick={() => setModelDraft((current) => ({ ...current, providerMode: "existing" }))}
                    >
                      Existing provider
                    </button>
                    <button
                      type="button"
                      className={cn("rounded px-3 py-2 text-sm text-muted transition", modelDraft.providerMode === "new" && "bg-surface text-text")}
                      onClick={() => setModelDraft((current) => ({ ...current, providerMode: "new" }))}
                    >
                      New provider
                    </button>
                  </div>
                </div>
                {modelDraft.providerMode === "existing" ? (
                  <label className="space-y-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Provider</span>
                    <Select
                      wrapperClassName="w-full"
                      value={modelDraft.providerId}
                      onChange={(event) => setModelDraft((current) => ({ ...current, providerId: event.target.value }))}
                    >
                      {providersCatalog.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                ) : (
                  <>
                    <label className="space-y-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Provider</span>
                      <InputLike
                        value={modelDraft.providerName}
                        onChange={(value) => setModelDraft((current) => ({ ...current, providerName: value }))}
                        placeholder="OpenAI"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Provider color</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          className="h-10 w-14 rounded border border-border/80 bg-code"
                          value={modelDraft.providerColor}
                          onChange={(event) => setModelDraft((current) => ({ ...current, providerColor: event.target.value }))}
                        />
                        <input
                          className="h-10 flex-1 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
                          value={modelDraft.providerColor}
                          onChange={(event) => setModelDraft((current) => ({ ...current, providerColor: event.target.value }))}
                        />
                      </div>
                    </label>
                  </>
                )}
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
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={modelDraft.isActive}
                    onChange={(event) => setModelDraft((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  Active model
                </label>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingModel}>
                    {editingModelId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingModelId ? "Save model" : duplicatingModelId ? "Create copy" : "Add model"}
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
                  modelLibraryTab === "mine"
                    ? "Select a model from your local list or create a new one."
                    : "Select a catalog model to import it into your local list and use it for this result."
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

      {showFullscreen && hasResults ? (
        <div className="fixed inset-0 z-[60] bg-black/80 p-4">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-raised shadow-panel">
            <div className="border-b border-border/80 px-4 py-3">
              {viewMode === "single" ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      {visibleResults.length > 1 ? (
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/80 bg-code text-muted transition hover:text-text"
                          onClick={() => onSelectAdjacentResult("prev")}
                          aria-label="Previous result"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="truncate text-sm font-semibold text-text">
                        {selectedResult?.providerName ?? ""} / {selectedResult?.modelName ?? ""}{" "}
                        {selectedResult?.modelVersion ?? ""}
                      </div>
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        Attempt {selectedResult?.attempt ?? "-"}
                      </span>
                      {visibleResults.length > 1 ? (
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/80 bg-code text-muted transition hover:text-text"
                          onClick={() => onSelectAdjacentResult("next")}
                          aria-label="Next result"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : null}
                      <RatingStars
                        value={selectedResult?.rating ?? null}
                        disabled={savingRating || !selectedResult}
                        onChange={(value) => void onChangeRating(value ? String(value) : "")}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <div className="flex rounded-md border border-border/80 bg-code p-1">
                        <DeviceButton active={device === "mobile"} onClick={() => setDevice("mobile")} icon={Smartphone} label="Mobile" />
                        <DeviceButton active={device === "tablet"} onClick={() => setDevice("tablet")} icon={Tablet} label="Tablet" />
                        <DeviceButton active={device === "desktop"} onClick={() => setDevice("desktop")} icon={Monitor} label="Desktop" />
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text"
                        onClick={() => setShowFullscreen(false)}
                        aria-label="Close fullscreen"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">Comparison workspace</div>
                    <div className="mt-1 text-xs text-muted">
                      Fullscreen preview of the current comparison view.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-md border border-border/80 bg-code p-1">
                      <DeviceButton active={device === "mobile"} onClick={() => setDevice("mobile")} icon={Smartphone} label="Mobile" />
                      <DeviceButton active={device === "tablet"} onClick={() => setDevice("tablet")} icon={Tablet} label="Tablet" />
                      <DeviceButton active={device === "desktop"} onClick={() => setDevice("desktop")} icon={Monitor} label="Desktop" />
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text"
                      onClick={() => setShowFullscreen(false)}
                      aria-label="Close fullscreen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-code p-4">
              {viewMode === "single" ? (
                <SinglePreviewCanvas
                  result={selectedResult}
                  htmlContent={selectedResultHtml}
                  loading={selectedResultHtmlLoading}
                  device={device}
                  showCode={showCode}
                  fullscreen
                />
              ) : (
                <CompareCanvas
                  slotA={slotA}
                  slotB={slotB}
                  slotAHtml={slotAHtml}
                  slotBHtml={slotBHtml}
                  slotAHtmlLoading={slotAHtmlLoading}
                  slotBHtmlLoading={slotBHtmlLoading}
                  device={device}
                  showCode={showCode}
                  fullscreen
                  split={compareSplit}
                  onSplitChange={setCompareSplit}
                />
              )}
            </div>
            {showNotes && viewMode === "single" ? (
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

function SinglePreviewCanvas({
  result,
  htmlContent,
  loading,
  device,
  showCode,
  fullscreen = false,
}: {
  result?: WorkspaceResultItem;
  htmlContent?: string;
  loading: boolean;
  device: keyof typeof deviceWidths;
  showCode: boolean;
  fullscreen?: boolean;
}) {
  if (showCode) {
    return (
      <HtmlCodeBlock code={htmlContent ?? (loading ? "Loading result HTML..." : "No result selected.")} />
    );
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-full overflow-hidden rounded-lg border border-border/80 bg-[#f3f4f6]",
        fullscreen ? "h-full min-h-[640px]" : "h-full min-h-[520px]",
      )}
      style={{ width: deviceWidths[device] }}
    >
      {result && htmlContent ? (
        <iframe title={result.id} srcDoc={htmlContent} className="h-full w-full border-0" sandbox="allow-scripts" />
      ) : result ? (
        <PreviewLoadingState loading={loading} />
      ) : null}
    </div>
  );
}

function CompareCanvas({
  slotA,
  slotB,
  slotAHtml,
  slotBHtml,
  slotAHtmlLoading,
  slotBHtmlLoading,
  device,
  showCode,
  fullscreen = false,
  split,
  onSplitChange,
}: {
  slotA?: WorkspaceResultItem;
  slotB?: WorkspaceResultItem;
  slotAHtml?: string;
  slotBHtml?: string;
  slotAHtmlLoading: boolean;
  slotBHtmlLoading: boolean;
  device: keyof typeof deviceWidths;
  showCode: boolean;
  fullscreen?: boolean;
  split: number;
  onSplitChange: (value: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }

      const next = ((event.clientX - bounds.left) / bounds.width) * 100;
      onSplitChange(Math.min(72, Math.max(28, next)));
    };

    const onMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, onSplitChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full min-h-full min-w-0 items-stretch gap-0",
        fullscreen ? "min-h-[640px]" : "min-h-[520px]",
      )}
    >
      <div className="min-h-0 min-w-0 self-stretch" style={{ width: `${split}%` }}>
        <ComparePanel label="A" result={slotA} htmlContent={slotAHtml} loading={slotAHtmlLoading} device={device} showCode={showCode} />
      </div>
      <button
        type="button"
        className={cn(
          "group relative mx-2 flex w-3 shrink-0 cursor-col-resize items-center justify-center",
          dragging && "opacity-100",
        )}
        onMouseDown={() => setDragging(true)}
        aria-label="Resize comparison panels"
      >
        <span className="h-full w-px rounded-full bg-border/80 transition group-hover:bg-primary" />
        <span className="absolute h-12 w-2 rounded-full bg-white/10 opacity-0 transition group-hover:opacity-100" />
      </button>
      <div className="min-h-0 min-w-0 flex-1 self-stretch">
        <ComparePanel label="B" result={slotB} htmlContent={slotBHtml} loading={slotBHtmlLoading} device={device} showCode={showCode} accent="orange" />
      </div>
    </div>
  );
}

function ComparePanel({ label, result, htmlContent, loading, device, showCode, accent = "blue" }: { label: "A" | "B"; result?: WorkspaceResultItem; htmlContent?: string; loading: boolean; device: keyof typeof deviceWidths; showCode: boolean; accent?: "blue" | "orange" }) {
  if (!result) {
    return <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-border/80 bg-[#050608] font-mono text-sm text-dim">Select a result</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-[#050608]">
      <div className="flex items-center gap-2 border-b border-border/80 px-3 py-2">
        <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", accent === "blue" ? "bg-primary-soft/60 text-primary" : "bg-orange-500/10 text-orange-300")}>{label}</span>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: result.providerColor }} />
        <div className="min-w-0 flex-1">
          <div
            className="break-words text-sm font-semibold leading-snug text-text"
            title={`${result.providerName} / ${result.modelName} ${result.modelVersion}`}
          >
            {result.providerName} / {result.modelName} {result.modelVersion}
          </div>
          <div className="truncate text-[11px] text-dim">Attempt {result.attempt} • {result.modelComment || "No comment"}</div>
        </div>
        <div className={cn("font-mono text-sm", result.rating ? ratingToneClass(result.rating) : "text-dim")}>{result.rating ?? "—"}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {showCode ? (
          <HtmlCodeBlock code={htmlContent ?? (loading ? "Loading result HTML..." : "Preview unavailable")} className="border-0 bg-transparent p-0" />
        ) : (
          <div className="mx-auto h-full min-h-[420px] max-w-full overflow-hidden rounded-lg border border-border/80 bg-[#f3f4f6]" style={{ width: deviceWidths[device] }}>
            {htmlContent ? (
              <iframe title={result.id} srcDoc={htmlContent} className="h-full w-full border-0" sandbox="allow-scripts" />
            ) : (
              <PreviewLoadingState loading={loading} compact />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewLoadingState({
  loading,
  compact = false,
}: {
  loading: boolean;
  compact?: boolean;
}) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#e5e7eb_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] animate-[pulse_1.8s_ease-in-out_infinite]" />
      <div className="relative text-center">
        <div className="mx-auto h-9 w-9 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin" />
        <div className={cn("mt-3 font-mono uppercase tracking-[0.14em] text-slate-500", compact ? "text-[10px]" : "text-[11px]")}>
          {loading ? "Loading preview" : "Preview unavailable"}
        </div>
        <div className={cn("mt-2 text-slate-400", compact ? "text-[11px]" : "text-xs")}>
          {loading ? "Preparing rendered HTML" : "Select another result"}
        </div>
      </div>
    </div>
  );
}

function RatingStars({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-border/80 bg-code/80 px-2 py-1">
        {Array.from({ length: 10 }, (_, index) => {
          const starValue = index + 1;
          const active = (value ?? 0) >= starValue;

          return (
            <button
              key={starValue}
              type="button"
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full transition",
                disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white/5",
              )}
              onClick={() => {
                if (!disabled) {
                  onChange(value === starValue ? null : starValue);
                }
              }}
              disabled={disabled}
              aria-label={`Set rating to ${starValue}`}
              title={`Rate ${starValue}/10`}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  active ? "fill-amber-300 text-amber-300" : "text-dim",
                )}
              />
            </button>
          );
        })}
      </div>
      <div className={cn("min-w-[58px] font-mono text-xs", value ? ratingToneClass(value) : "text-dim")}>
        {value ? `${value}/10` : "Unrated"}
      </div>
      {value ? (
        <button
          type="button"
          className="text-xs text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
