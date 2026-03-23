import { useEffect, useState } from "react";
import { filterStore } from "@/features/experiment-filters/model/use-experiment-filters";
import { loadSidebarCategories, SidebarCategoryItem } from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";

const statuses = [
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
] as const;

export function ExperimentsFilters() {
  const selectedStatuses = filterStore((state) => state.statuses);
  const selectedCategory = filterStore((state) => state.category);
  const tagQuery = filterStore((state) => state.tagQuery);
  const sort = filterStore((state) => state.sort);
  const toggleStatus = filterStore((state) => state.toggleStatus);
  const setCategory = filterStore((state) => state.setCategory);
  const setTagQuery = filterStore((state) => state.setTagQuery);
  const setSort = filterStore((state) => state.setSort);
  const reset = filterStore((state) => state.reset);
  const [categories, setCategories] = useState<SidebarCategoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const nextCategories = await loadSidebarCategories();
      if (!cancelled) {
        setCategories(nextCategories);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-lg border border-border/80 bg-surface/60 p-4 shadow-panel">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const active = selectedStatuses.includes(status.key);

            return (
              <button
                key={status.key}
                type="button"
                onClick={() => toggleStatus(status.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-primary/60 bg-primary-soft/50 text-primary"
                    : "border-border/80 text-muted hover:border-border hover:text-text",
                )}
              >
                {status.label}
              </button>
            );
          })}
        </div>

        <select
          className="h-9 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
          value={selectedCategory}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <Input
          value={tagQuery}
          onChange={(event) => setTagQuery(event.target.value)}
          placeholder="Filter tags..."
          className="max-w-[220px]"
        />

        <select
          className="h-9 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition focus:border-primary"
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="results">Most results</option>
          <option value="rating">Highest avg rating</option>
        </select>

        <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
          Reset
        </Button>
      </div>
    </section>
  );
}