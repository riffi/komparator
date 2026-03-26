import { ArrowLeft, Check, Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buildPromptForClipboard } from "@/shared/lib/prompt";
import {
  createWrapperEntry,
  createWrapperVersion,
  deleteWrapperVersion,
  deleteWrapperEntry,
  loadWrapperDetail,
  updateWrapperMetadata,
  WrapperDetailData,
} from "@/shared/db/workspace";
import { appRoutes, getWrapperDetailRoute } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

const SAMPLE_PROMPT =
  "Build a polished landing page for an AI design tool with a clear hero, benefits, pricing and FAQ.";

export function WrapperDetailPage() {
  const navigate = useNavigate();
  const { wrapperId } = useParams<{ wrapperId: string }>();
  const isCreateMode = !wrapperId;
  const [loading, setLoading] = useState(!isCreateMode);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [publishingVersion, setPublishingVersion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleteWrapperOpen, setDeleteWrapperOpen] = useState(false);
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<{ id: string; versionNumber: number } | null>(null);
  const [detail, setDetail] = useState<WrapperDetailData | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [samplePrompt, setSamplePrompt] = useState(SAMPLE_PROMPT);
  const [titleEditMode, setTitleEditMode] = useState(isCreateMode);
  const [metadataDraft, setMetadataDraft] = useState({
    name: "",
    isDefault: false,
  });
  const [draftMode, setDraftMode] = useState(isCreateMode);
  const [versionDraft, setVersionDraft] = useState({
    template: "{{prompt}}",
    changeNote: "",
  });

  const refreshData = useCallback(async () => {
    if (!wrapperId) {
      return;
    }

    setLoading(true);
    try {
      const nextDetail = await loadWrapperDetail(wrapperId);
      setDetail(nextDetail);
      setMetadataDraft({
        name: nextDetail.name,
        isDefault: nextDetail.isDefault,
      });
      setTitleEditMode(false);
      setSelectedVersionId((current) =>
        current && nextDetail.versions.some((item) => item.id === current) ? current : nextDetail.latestVersionId,
      );
      setDraftMode(false);
      setVersionDraft({
        template: nextDetail.versions[0]?.template ?? "{{prompt}}",
        changeNote: "",
      });
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load wrapper.");
    } finally {
      setLoading(false);
    }
  }, [wrapperId]);

  useEffect(() => {
    if (isCreateMode) {
      setLoading(false);
      setDetail(null);
      setMetadataDraft({ name: "", isDefault: false });
      setTitleEditMode(true);
      setSelectedVersionId(null);
      setDraftMode(true);
      setVersionDraft({ template: "{{prompt}}", changeNote: "" });
      setError("");
      return;
    }

    void refreshData();
  }, [isCreateMode, refreshData]);

  const selectedVersion = detail?.versions.find((item) => item.id === selectedVersionId) ?? detail?.versions[0] ?? null;
  const hasPlaceholder = versionDraft.template.includes("{{prompt}}");
  const hasMetadataChanges =
    !isCreateMode &&
    detail !== null &&
    (metadataDraft.name.trim() !== detail.name || metadataDraft.isDefault !== detail.isDefault);
  const previewTemplate = draftMode ? versionDraft.template : selectedVersion?.template ?? "{{prompt}}";
  const preview = useMemo(() => buildPromptForClipboard(samplePrompt, previewTemplate), [previewTemplate, samplePrompt]);

  const startDraftFromCurrent = () => {
    const source = selectedVersion ?? detail?.versions[0] ?? null;
    setDraftMode(true);
    setVersionDraft({
      template: source?.template ?? "{{prompt}}",
      changeNote: "",
    });
    setError("");
  };

  const onSaveMetadata = async () => {
    if (!detail) {
      return;
    }

    setSavingMetadata(true);
    setError("");
    try {
      await updateWrapperMetadata({
        wrapperId: detail.id,
        name: metadataDraft.name,
        isDefault: metadataDraft.isDefault,
      });
      await refreshData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save wrapper details.");
    } finally {
      setSavingMetadata(false);
    }
  };

  const onPublishVersion = async () => {
    setPublishingVersion(true);
    setError("");

    try {
      if (isCreateMode) {
        const nextWrapperId = await createWrapperEntry({
          name: metadataDraft.name,
          template: versionDraft.template,
          changeNote: versionDraft.changeNote,
          isDefault: metadataDraft.isDefault,
        });
        navigate(`/${getWrapperDetailRoute(nextWrapperId)}`, { replace: true });
      } else if (detail) {
        if (hasMetadataChanges) {
          await updateWrapperMetadata({
            wrapperId: detail.id,
            name: metadataDraft.name,
            isDefault: metadataDraft.isDefault,
          });
        }

        await createWrapperVersion({
          wrapperId: detail.id,
          template: versionDraft.template,
          changeNote: versionDraft.changeNote,
        });
        await refreshData();
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create wrapper version.");
    } finally {
      setPublishingVersion(false);
    }
  };

  const onDelete = async () => {
    if (!detail) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteWrapperEntry(detail.id);
      navigate(`/${appRoutes.wrappers}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to delete wrapper.");
      setDeleting(false);
    }
  };

  const onDeleteVersion = async (versionId: string, versionNumber: number) => {
    if (!detail) {
      return;
    }

    setDeletingVersionId(versionId);
    setError("");
    try {
      await deleteWrapperVersion(versionId);
      setDeleteVersionTarget(null);
      await refreshData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to delete wrapper version.");
    } finally {
      setDeletingVersionId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/80 bg-surface/70 px-5 py-4 shadow-panel">
        <div className="space-y-3">
          <Link to={`/${appRoutes.wrappers}`} className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft className="h-4 w-4" />
            Back to wrappers
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {titleEditMode ? (
              <div className="flex min-w-0 items-center gap-2">
                <input
                  className="h-10 min-w-[260px] rounded-md border border-primary/50 bg-code px-3 font-mono text-2xl font-semibold text-text outline-none"
                  value={metadataDraft.name}
                  onChange={(event) => setMetadataDraft((current) => ({ ...current, name: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isCreateMode) {
                      event.preventDefault();
                      void onSaveMetadata();
                    }
                    if (event.key === "Escape" && detail) {
                      setMetadataDraft({ name: detail.name, isDefault: detail.isDefault });
                      setTitleEditMode(false);
                    }
                  }}
                  placeholder="New wrapper"
                  autoFocus
                />
                {!isCreateMode ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-code text-muted transition hover:text-text"
                      onClick={() => void onSaveMetadata()}
                      disabled={savingMetadata}
                      aria-label="Save wrapper name"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-code text-muted transition hover:text-text"
                      onClick={() => {
                        if (detail) {
                          setMetadataDraft({ name: detail.name, isDefault: detail.isDefault });
                        }
                        setTitleEditMode(false);
                      }}
                      disabled={savingMetadata}
                      aria-label="Cancel wrapper name edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="font-mono text-2xl font-semibold text-text">
                  {metadataDraft.name || "Wrapper"}
                </h1>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-text"
                  onClick={() => setTitleEditMode(true)}
                  aria-label="Edit wrapper name"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <label className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-code/70 px-3 py-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={metadataDraft.isDefault}
                onChange={(event) => setMetadataDraft((current) => ({ ...current, isDefault: event.target.checked }))}
              />
              <Star className="h-4 w-4 text-primary" />
              Use as default
            </label>
            {isCreateMode ? (
              <div className="w-full text-sm text-muted">
                Create the first wrapper version explicitly. Nothing is versioned until you publish.
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isCreateMode ? (
            <>
              <Button variant="ghost" onClick={startDraftFromCurrent}>
                <Plus className="h-4 w-4" />
                New version
              </Button>
              <Button variant="ghost" onClick={() => void onSaveMetadata()} disabled={!hasMetadataChanges || savingMetadata}>
                <Save className="h-4 w-4" />
                Save details
              </Button>
              <Button variant="ghost" onClick={() => setDeleteWrapperOpen(true)} disabled={deleting}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-border/80 bg-surface/70 px-5 py-6 text-sm text-muted shadow-panel">
          Loading wrapper...
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1.1fr)_minmax(0,0.95fr)]">
          <section className="space-y-4 rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel">
            {!isCreateMode ? (
              <>
                <div className="border-t border-border/80 pt-4">
                  <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Versions</div>
                  <div className="space-y-2">
                    {detail?.versions.map((version) => (
                      <div
                        key={version.id}
                        className={`rounded-lg border px-3 py-3 transition ${
                          selectedVersion?.id === version.id
                            ? "border-primary/60 bg-primary-soft/20"
                            : "border-border/80 bg-code/40 hover:border-primary/40 hover:bg-code/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => {
                              setSelectedVersionId(version.id);
                              setDraftMode(false);
                              setError("");
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-sm text-text">v{version.versionNumber}</div>
                              {version.isLatest ? (
                                <span className="rounded-full bg-primary-soft/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                                  Latest
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-muted">
                              {version.createdLabel} • {version.usageCount} use{version.usageCount === 1 ? "" : "s"}
                            </div>
                            <div className="mt-2 text-sm text-muted">
                              {version.changeNote || "No change note"}
                            </div>
                          </button>
                          <button
                            type="button"
                            className="mt-0.5 text-muted transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                            onClick={() => setDeleteVersionTarget({ id: version.id, versionNumber: version.versionNumber })}
                            disabled={
                              deletingVersionId === version.id ||
                              version.usageCount > 0 ||
                              (detail?.versions.length ?? 0) <= 1
                            }
                            aria-label={`Delete wrapper version v${version.versionNumber}`}
                            title={
                              version.usageCount > 0
                                ? "Used by experiment versions"
                                : (detail?.versions.length ?? 0) <= 1
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
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border/80 bg-code/50 px-3 py-3 text-sm text-muted">
                This screen will create wrapper `v1`. After publish, version history will appear here.
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-lg font-semibold text-text">
                  {draftMode ? (isCreateMode ? "First version draft" : "New version draft") : `Version v${selectedVersion?.versionNumber ?? "?"}`}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {draftMode
                    ? "Draft changes stay local until you explicitly publish a new immutable version."
                    : "Selected version is read-only. Start a new version to make changes."}
                </p>
              </div>
              {!draftMode && !isCreateMode ? (
                <Button variant="ghost" onClick={startDraftFromCurrent}>
                  <Plus className="h-4 w-4" />
                  New version
                </Button>
              ) : null}
            </div>

            {draftMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Template</div>
                  <textarea
                    className="min-h-[360px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 font-mono text-sm text-text outline-none focus:border-primary"
                    value={versionDraft.template}
                    onChange={(event) => setVersionDraft((current) => ({ ...current, template: event.target.value }))}
                  />
                  <div className={`text-xs ${hasPlaceholder ? "text-muted" : "text-red-300"}`}>
                    {hasPlaceholder ? "Placeholder found." : "Template must include {{prompt}}."}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Change note</div>
                  <input
                    className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
                    value={versionDraft.changeNote}
                    onChange={(event) => setVersionDraft((current) => ({ ...current, changeNote: event.target.value }))}
                    placeholder="What changed in this version"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/80 bg-code/50 px-4 py-3">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Change note</div>
                  <div className="mt-2 text-sm text-muted">{selectedVersion?.changeNote || "No change note"}</div>
                </div>
                <div className="rounded-lg border border-border/80 bg-code p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Template</div>
                    <div className="text-xs text-muted">{selectedVersion?.createdLabel ?? ""}</div>
                  </div>
                  <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-[#050608] p-3 font-mono text-xs leading-5 text-muted">
                    {selectedVersion?.template ?? ""}
                  </pre>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  Composed prompt preview
                </div>
                <div className="mt-1 text-xs text-muted">
                  {draftMode ? "From current draft" : `From saved version v${selectedVersion?.versionNumber ?? "?"}`}
                </div>
              </div>
              <div className="font-mono text-[11px] text-dim">{preview.length} chars</div>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                Sample prompt
              </div>
              <input
                className="h-10 w-full rounded-lg border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
                value={samplePrompt}
                onChange={(event) => setSamplePrompt(event.target.value)}
              />
            </div>
            <pre className="max-h-[540px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-[#050608] p-4 font-mono text-xs leading-5 text-slate-300">
              {preview}
            </pre>
          </section>
        </div>
      )}

      {draftMode ? (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-raised/95 px-5 py-4 shadow-panel">
          <div className="text-sm text-muted">
            {isCreateMode
              ? "Publishing will create the wrapper and its first immutable version."
              : "Publishing will create a new immutable wrapper version from this draft."}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isCreateMode ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraftMode(false);
                  setVersionDraft({
                    template: selectedVersion?.template ?? "{{prompt}}",
                    changeNote: "",
                  });
                  setError("");
                }}
              >
                Discard draft
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => void onPublishVersion()}
              disabled={publishingVersion || !metadataDraft.name.trim() || !hasPlaceholder}
            >
              {isCreateMode ? "Create wrapper" : "Create version"}
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={deleteWrapperOpen}
        title={detail ? `Delete "${detail.name}"?` : "Delete wrapper?"}
        description="This removes the wrapper and all of its versions. The action is blocked if any experiment version still uses one of those wrapper versions."
        confirmLabel="Delete wrapper"
        onCancel={() => {
          if (!deleting) {
            setDeleteWrapperOpen(false);
          }
        }}
        onConfirm={() => void onDelete()}
        busy={deleting}
      />
      <ConfirmDialog
        open={deleteVersionTarget !== null}
        title={deleteVersionTarget ? `Delete version v${deleteVersionTarget.versionNumber}?` : "Delete version?"}
        description="Only unused versions can be deleted. This action keeps the wrapper itself and the remaining version history."
        confirmLabel="Delete version"
        onCancel={() => {
          if (!deletingVersionId) {
            setDeleteVersionTarget(null);
          }
        }}
        onConfirm={() => {
          if (deleteVersionTarget) {
            void onDeleteVersion(deleteVersionTarget.id, deleteVersionTarget.versionNumber);
          }
        }}
        busy={deleteVersionTarget !== null && deletingVersionId === deleteVersionTarget.id}
      />
    </section>
  );
}
