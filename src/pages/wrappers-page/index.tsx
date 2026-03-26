import { Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteWrapperEntry,
  loadWrappersCatalog,
  updateWrapperMetadata,
  WrapperManagerItem,
} from "@/shared/db/workspace";
import { appRoutes, getWrapperDetailRoute } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

export function WrappersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wrappers, setWrappers] = useState<WrapperManagerItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<WrapperManagerItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    const nextWrappers = await loadWrappersCatalog();
    setWrappers(nextWrappers);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const onMakeDefault = async (wrapper: WrapperManagerItem) => {
    await updateWrapperMetadata({
      wrapperId: wrapper.id,
      name: wrapper.name,
      isDefault: true,
    });
    await refreshData();
  };

  const onDelete = async (wrapper: WrapperManagerItem) => {
    setDeleteError("");
    setDeleteTarget(wrapper);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await deleteWrapperEntry(deleteTarget.id);
      setDeleteTarget(null);
      await refreshData();
    } catch (nextError) {
      setDeleteError(nextError instanceof Error ? nextError.message : "Failed to delete wrapper.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface/70 px-5 py-4 shadow-panel">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-text">Wrappers</h1>
          <p className="mt-1 text-sm text-muted">
            {wrappers.length} wrapper{wrappers.length === 1 ? "" : "s"} with explicit version history.
          </p>
        </div>
        <Button onClick={() => navigate(`/${appRoutes.wrappersNew}`)}>Add wrapper</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-xl border border-border/80 bg-surface/70 px-5 py-6 text-sm text-muted shadow-panel">
            Loading wrappers...
          </div>
        ) : wrappers.length ? (
          wrappers.map((wrapper) => (
            <article
              key={wrapper.id}
              className="cursor-pointer rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel transition hover:border-primary/50 hover:bg-surface/90"
              onClick={() => navigate(`/${getWrapperDetailRoute(wrapper.id)}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-text">{wrapper.name}</h2>
                    <span className="rounded-full bg-surface/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                      v{wrapper.latestVersionNumber}
                    </span>
                    {wrapper.isDefault ? (
                      <span className="rounded-full bg-primary-soft/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {wrapper.usageCount} version{wrapper.usageCount === 1 ? "" : "s"} in use • {wrapper.updatedLabel}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="text-muted transition hover:text-text"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onMakeDefault(wrapper);
                    }}
                    aria-label={`Make ${wrapper.name} default`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="text-muted transition hover:text-red-300"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onDelete(wrapper);
                    }}
                    aria-label={`Delete ${wrapper.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <pre className="mt-4 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-code p-3 font-mono text-xs leading-5 text-muted">
                {wrapper.template}
              </pre>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-border/80 bg-[radial-gradient(circle_at_top,rgba(91,141,239,0.18),transparent_55%),rgba(15,18,24,0.94)] px-8 py-12 shadow-panel lg:col-span-2 lg:px-12 lg:py-14 xl:col-span-3">
            <div className="mx-auto max-w-4xl text-center">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Prompt wrappers</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-text lg:text-[2.25rem]">
                Standardize how prompts are sent to different models
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted">
                Wrappers are optional prompt templates. They sit around the final clipboard prompt and help you
                enforce a consistent output style, add shared instructions, or keep recurring HTML-generation rules
                in one reusable place.
              </p>

              <div className="mt-8 grid gap-4 text-left md:grid-cols-3 lg:gap-5">
                <div className="rounded-2xl border border-border/80 bg-surface/40 p-5 lg:p-6">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">1. Create</div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Create a wrapper and define the first explicit version with <code>{"{{prompt}}"}</code>.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-surface/40 p-5 lg:p-6">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">2. Version</div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Publish new immutable versions only when you explicitly want to change wrapper behavior.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-surface/40 p-5 lg:p-6">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">3. Compare</div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Attach a wrapper version to an experiment version and compare HTML outputs side by side.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3">
                <Button onClick={() => navigate(`/${appRoutes.wrappersNew}`)}>Create first wrapper</Button>
                <div className="text-sm text-dim">
                  Leave wrappers empty if you want experiments to copy only the base prompt.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : "Delete wrapper?"}
        description={
          deleteError ||
          "This removes the wrapper and all of its versions. The action is blocked if any experiment version still uses one of those wrapper versions."
        }
        confirmLabel="Delete wrapper"
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={() => void confirmDelete()}
        busy={deleting}
      />
    </section>
  );
}
