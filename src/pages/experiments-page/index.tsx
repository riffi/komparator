import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ExperimentListItem } from "@/entities/experiment/model/types";
import { ExperimentsHeader } from "@/widgets/experiments-list/ui/experiments-header";
import { ExperimentsGrid } from "@/widgets/experiments-list/ui/experiments-grid";
import {
  CategoryManagerItem,
  SelectOption,
  createCategoryEntry,
  createExperimentWithInitialPrompt,
  deleteCategoryEntry,
  loadCategoryOptions,
  loadExperimentsList,
  loadManageCategories,
  loadWrapperOptions,
  updateCategoryEntry,
} from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type ExperimentCreateForm = {
  title: string;
  description: string;
  categoryId: string;
  wrapperId: string;
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
  const [showCategories, setShowCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryManagerItem[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#5b8def",
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string>("");
  const [categoryError, setCategoryError] = useState("");
  const [form, setForm] = useState<ExperimentCreateForm>({
    title: "",
    description: "",
    categoryId: "",
    wrapperId: "",
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
    const nextManageCategories = await loadManageCategories();

    if (!cancelledRef?.current) {
      setExperiments(nextExperiments);
      setCategoryOptions(nextCategories);
      setWrapperOptions(nextWrappers);
      setCategories(nextManageCategories);
      setLoading(false);
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
      categoryId: form.categoryId || null,
      wrapperId: form.wrapperId || null,
      tags: [],
      promptText: form.promptText,
      changeNote: form.changeNote.trim(),
    });
    setSaving(false);
    setShowCreate(false);
    setForm({
      title: "",
      description: "",
      categoryId: "",
      wrapperId: "",
      promptText: "",
      changeNote: "",
    });
    await refresh();
    navigate(`/experiments/${experimentId}`);
  };

  const onSaveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      return;
    }

    setCategoryError("");

    if (editingCategoryId) {
      await updateCategoryEntry({
        categoryId: editingCategoryId,
        name: categoryForm.name,
        description: categoryForm.description,
        color: categoryForm.color,
      });
    } else {
      await createCategoryEntry(categoryForm);
    }

    setCategoryForm({ name: "", description: "", color: "#5b8def" });
    setEditingCategoryId("");
    await refresh();
  };

  const onEditCategory = (category: CategoryManagerItem) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description,
      color: category.color,
    });
  };

  const onDeleteCategory = async (categoryId: string) => {
    try {
      setCategoryError("");
      await deleteCategoryEntry(categoryId);
      if (editingCategoryId === categoryId) {
        setEditingCategoryId("");
        setCategoryForm({ name: "", description: "", color: "#5b8def" });
      }
      await refresh();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Unable to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      <ExperimentsHeader
        count={experiments.length}
        onCreate={() => setShowCreate(true)}
        onManageCategories={() => setShowCategories(true)}
      />
      <ExperimentsGrid experiments={experiments} loading={loading} onCreate={() => setShowCreate(true)} />

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
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-text"
                onClick={() => setShowCreate(false)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
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
                  Category
                </span>
                <select
                  className="h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, categoryId: event.target.value }))
                  }
                >
                  <option value="">No category</option>
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
                  <option value="">No wrapper</option>
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

      {showCategories ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-xl border border-border/80 bg-raised p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xl font-semibold text-text">Manage categories</h2>
                <p className="mt-1 text-sm text-muted">
                  Create, rename, recolor and remove categories without leaving experiments.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-text"
                onClick={() => setShowCategories(false)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 bg-surface/40 px-4 py-8 text-center font-mono text-sm text-dim">
                    No categories yet.
                  </div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-surface/60 px-4 py-3"
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-text">{category.name}</div>
                        <div className="truncate text-xs text-muted">
                          {category.description || "No description"}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-dim">{category.count}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onEditCategory(category)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void onDeleteCategory(category.id)}
                        disabled={category.count > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <form className="space-y-4 rounded-lg border border-border/80 bg-surface/60 p-4" onSubmit={onSaveCategory}>
                <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">
                  {editingCategoryId ? "Edit category" : "New category"}
                </div>
                <label className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Name</span>
                  <Input
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Landing Pages"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Description</span>
                  <textarea
                    className="min-h-[96px] w-full rounded-md border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none transition focus:border-primary"
                    value={categoryForm.description}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Color</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 rounded-md border border-border/80 bg-code p-1"
                      value={categoryForm.color}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, color: event.target.value }))}
                    />
                    <Input
                      value={categoryForm.color}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, color: event.target.value }))}
                    />
                  </div>
                </label>
                {categoryError ? <div className="text-sm text-rose-400">{categoryError}</div> : null}
                <div className="flex items-center justify-end gap-2">
                  {editingCategoryId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategoryId("");
                        setCategoryForm({ name: "", description: "", color: "#5b8def" });
                        setCategoryError("");
                      }}
                    >
                      Reset
                    </Button>
                  ) : null}
                  <Button type="submit">
                    <Plus className="h-4 w-4" />
                    {editingCategoryId ? "Save category" : "Create category"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
