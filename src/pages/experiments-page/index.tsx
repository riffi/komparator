import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExperimentListItem } from "@/entities/experiment/model/types";
import { ExperimentsHeader } from "@/widgets/experiments-list/ui/experiments-header";
import { ExperimentsFilters } from "@/widgets/experiments-list/ui/experiments-filters";
import { ExperimentsGrid } from "@/widgets/experiments-list/ui/experiments-grid";
import {
  SelectOption,
  createExperimentWithInitialPrompt,
  loadCategoryOptions,
  loadExperimentsList,
  loadWrapperOptions,
} from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type ExperimentCreateForm = {
  title: string;
  description: string;
  status: "draft" | "active" | "completed" | "archived";
  categoryId: string;
  wrapperId: string;
  tags: string;
  promptText: string;
  changeNote: string;
};

export function ExperimentsPage() {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentListItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [wrapperOptions, setWrapperOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExperimentCreateForm>({
    title: "",
    description: "",
    status: "draft" as const,
    categoryId: "",
    wrapperId: "",
    tags: "",
    promptText: "",
    changeNote: "",
  });

  const refresh = async (cancelledRef?: { current: boolean }) => {
    setLoading(true);
    const [nextExperiments, nextCategories, nextWrappers] = await Promise.all([
      loadExperimentsList(),
      loadCategoryOptions(),
      loadWrapperOptions(),
    ]);

    if (!cancelledRef?.current) {
      setExperiments(nextExperiments);
      setCategoryOptions(nextCategories);
      setWrapperOptions(nextWrappers);
      setLoading(false);
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || nextCategories[0]?.id || "",
        wrapperId: current.wrapperId || nextWrappers[0]?.id || "",
      }));
    }
  };

  useEffect(() => {
    const cancelledRef = { current: false };

    const run = async () => {
      await refresh(cancelledRef);
    };

    void run();

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const onCreateExperiment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.promptText.trim()) {
      return;
    }

    setSaving(true);
    const experimentId = await createExperimentWithInitialPrompt({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      categoryId: form.categoryId,
      wrapperId: form.wrapperId,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      promptText: form.promptText,
      changeNote: form.changeNote.trim(),
    });
    setSaving(false);
    setShowCreate(false);
    setForm({
      title: "",
      description: "",
      status: "draft",
      categoryId: categoryOptions[0]?.id || "",
      wrapperId: wrapperOptions[0]?.id || "",
      tags: "",
      promptText: "",
      changeNote: "",
    });
    await refresh();
    navigate(`/experiments/${experimentId}`);
  };

  return (
    <div className="space-y-6">
      <ExperimentsHeader count={experiments.length} onCreate={() => setShowCreate(true)} />
      <ExperimentsFilters />
      <ExperimentsGrid experiments={experiments} loading={loading} />

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            className="w-full max-w-2xl rounded-xl border border-border/80 bg-raised p-5 shadow-panel"
            onSubmit={onCreateExperiment}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xl font-semibold text-text">New experiment</h2>
                <p className="mt-1 text-sm text-muted">
                  Create the experiment and its first prompt version.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Title
                </span>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Dashboard widget comparison"
                  required
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Description
                </span>
                <textarea
                  className="min-h-[88px] w-full rounded-md border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none transition focus:border-primary"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Status
                </span>
                <select
                  className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as "draft" | "active" | "completed" | "archived",
                    }))
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Tags
                </span>
                <Input
                  value={form.tags}
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="dashboard, charts, responsive"
                />
              </label>

              <label className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Category
                </span>
                <select
                  className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, categoryId: event.target.value }))
                  }
                >
                  {categoryOptions.length === 0 ? <option value="">No categories</option> : null}
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Wrapper
                </span>
                <select
                  className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
                  value={form.wrapperId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, wrapperId: event.target.value }))
                  }
                >
                  {wrapperOptions.length === 0 ? <option value="">No wrappers</option> : null}
                  {wrapperOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Prompt text
                </span>
                <textarea
                  className="min-h-[180px] w-full rounded-md border border-border/80 bg-code px-3 py-2 font-mono text-sm text-text outline-none transition focus:border-primary"
                  value={form.promptText}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, promptText: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                  Change note
                </span>
                <Input
                  value={form.changeNote}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, changeNote: event.target.value }))
                  }
                  placeholder="Initial version"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                Create experiment
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
