import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { buildPromptForClipboard } from "@/shared/lib/prompt";
import {
  createWrapperEntry,
  deleteWrapperEntry,
  loadWrappersCatalog,
  updateWrapperEntry,
  WrapperManagerItem,
} from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";

const SAMPLE_PROMPT =
  "Build a polished landing page for an AI design tool with a clear hero, benefits, pricing and FAQ.";

export function WrappersPage() {
  const [loading, setLoading] = useState(true);
  const [wrappers, setWrappers] = useState<WrapperManagerItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingWrapper, setEditingWrapper] = useState<WrapperManagerItem | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    template: "{{prompt}}",
    isDefault: false,
    samplePrompt: SAMPLE_PROMPT,
  });

  const refreshData = useCallback(async () => {
    setLoading(true);
    const nextWrappers = await loadWrappersCatalog();
    setWrappers(nextWrappers);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const preview = useMemo(
    () => buildPromptForClipboard(draft.samplePrompt, draft.template),
    [draft.samplePrompt, draft.template],
  );

  const openCreate = () => {
    setEditingWrapper(null);
    setError("");
    setDraft({
      name: "",
      template: "{{prompt}}",
      isDefault: wrappers.length === 0,
      samplePrompt: SAMPLE_PROMPT,
    });
    setShowModal(true);
  };

  const openEdit = (wrapper: WrapperManagerItem) => {
    setEditingWrapper(wrapper);
    setError("");
    setDraft({
      name: wrapper.name,
      template: wrapper.template,
      isDefault: wrapper.isDefault,
      samplePrompt: SAMPLE_PROMPT,
    });
    setShowModal(true);
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (editingWrapper) {
        await updateWrapperEntry({
          wrapperId: editingWrapper.id,
          name: draft.name,
          template: draft.template,
          isDefault: draft.isDefault,
        });
      } else {
        await createWrapperEntry({
          name: draft.name,
          template: draft.template,
          isDefault: draft.isDefault,
        });
      }

      setShowModal(false);
      await refreshData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save wrapper.");
    } finally {
      setSaving(false);
    }
  };

  const onMakeDefault = async (wrapper: WrapperManagerItem) => {
    await updateWrapperEntry({
      wrapperId: wrapper.id,
      name: wrapper.name,
      template: wrapper.template,
      isDefault: true,
    });
    await refreshData();
  };

  const onDelete = async (wrapper: WrapperManagerItem) => {
    if (!window.confirm(`Delete wrapper "${wrapper.name}"?`)) {
      return;
    }

    try {
      await deleteWrapperEntry(wrapper.id);
      await refreshData();
    } catch (nextError) {
      window.alert(nextError instanceof Error ? nextError.message : "Failed to delete wrapper.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface/70 px-5 py-4 shadow-panel">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-text">Wrappers</h1>
          <p className="mt-1 text-sm text-muted">Optional templates that wrap the final clipboard prompt.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add wrapper
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-xl border border-border/80 bg-surface/70 px-5 py-6 text-sm text-muted shadow-panel">
            Loading wrappers...
          </div>
        ) : wrappers.length ? (
          wrappers.map((wrapper) => (
            <article key={wrapper.id} className="rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-text">{wrapper.name}</h2>
                    {wrapper.isDefault ? (
                      <span className="rounded-full bg-primary-soft/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {wrapper.usageCount} experiment{wrapper.usageCount === 1 ? "" : "s"} • {wrapper.updatedLabel}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="text-muted transition hover:text-text" onClick={() => openEdit(wrapper)} aria-label={`Edit ${wrapper.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="text-muted transition hover:text-text" onClick={() => void onMakeDefault(wrapper)} aria-label={`Make ${wrapper.name} default`}>
                    <Star className="h-4 w-4" />
                  </button>
                  <button type="button" className="text-muted transition hover:text-red-300" onClick={() => void onDelete(wrapper)} aria-label={`Delete ${wrapper.name}`}>
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
          <div className="rounded-xl border border-dashed border-border/80 bg-surface/70 px-5 py-10 text-center text-sm text-muted shadow-panel">
            No wrappers yet. Create the first one to standardize prompt copying.
          </div>
        )}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form className="w-full max-w-5xl rounded-xl border border-border/80 bg-raised p-5 shadow-panel" onSubmit={onSave}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xl font-semibold text-text">{editingWrapper ? "Edit wrapper" : "Add wrapper"}</h2>
                <p className="mt-1 text-sm text-muted">
                  The template must contain <code>{"{{prompt}}"}</code>.
                </p>
              </div>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text" onClick={() => setShowModal(false)} aria-label="Close dialog">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section className="space-y-4">
                <div className="space-y-2">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Name</div>
                  <input className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Standard HTML wrapper" />
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Template</div>
                  <textarea className="min-h-[320px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 font-mono text-sm text-text outline-none focus:border-primary" value={draft.template} onChange={(event) => setDraft((current) => ({ ...current, template: event.target.value }))} />
                  <div className="text-xs text-muted">
                    {draft.template.includes("{{prompt}}")
                      ? "Placeholder found."
                      : "Template must include {{prompt}}."}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft((current) => ({ ...current, isDefault: event.target.checked }))} />
                  Use as default wrapper
                </label>
                {error ? <div className="text-sm text-red-300">{error}</div> : null}
              </section>
              <section className="space-y-4">
                <div className="space-y-2">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Sample prompt</div>
                  <textarea className="min-h-[100px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none focus:border-primary" value={draft.samplePrompt} onChange={(event) => setDraft((current) => ({ ...current, samplePrompt: event.target.value }))} />
                </div>
                <div className="rounded-lg border border-border/80 bg-code p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Preview</div>
                    <div className="font-mono text-[11px] text-dim">{preview.length} chars</div>
                  </div>
                  <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-[#050608] p-3 font-mono text-xs leading-5 text-muted">
                    {preview}
                  </pre>
                </div>
              </section>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{editingWrapper ? "Save wrapper" : "Create wrapper"}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
