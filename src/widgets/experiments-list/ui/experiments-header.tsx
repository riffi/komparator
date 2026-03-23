import { FolderTree, Plus, Search } from "lucide-react";
import { filterStore } from "@/features/experiment-filters/model/use-experiment-filters";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { cn } from "@/shared/lib/cn";

export function ExperimentsHeader({
  count,
  onCreate,
  onManageCategories,
}: {
  count: number;
  onCreate: () => void;
  onManageCategories: () => void;
}) {
  const query = filterStore((state) => state.query);
  const sort = filterStore((state) => state.sort);
  const viewMode = filterStore((state) => state.viewMode);
  const setQuery = filterStore((state) => state.setQuery);
  const setSort = filterStore((state) => state.setSort);
  const setViewMode = filterStore((state) => state.setViewMode);

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-surface/60 p-4 shadow-panel">
      <div className="min-w-0">
        <h1 className="font-mono text-[24px] font-semibold tracking-[-0.05em] text-text">
          Experiments
          <span className="ml-2 text-base font-normal text-dim">{count}</span>
        </h1>
      </div>

      <div className="flex rounded-md border border-border/80 bg-code p-1">
        <button
          type="button"
          className={cn(
            "rounded px-3 py-1.5 text-sm text-muted transition",
            viewMode === "all" && "bg-surface text-text",
          )}
          onClick={() => setViewMode("all")}
        >
          All
        </button>
        <button
          type="button"
          className={cn(
            "rounded px-3 py-1.5 text-sm text-muted transition",
            viewMode === "grouped" && "bg-surface text-text",
          )}
          onClick={() => setViewMode("grouped")}
        >
          By category
        </button>
      </div>

      <div className="relative min-w-[240px] flex-1 lg:max-w-[420px] lg:ml-auto">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
        <Input
          className="pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title..."
        />
      </div>

      <Select
        wrapperClassName="min-w-[170px]"
        value={sort}
        onChange={(event) => setSort(event.target.value as typeof sort)}
      >
        <option value="updated">Recently updated</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="title">A-Z</option>
      </Select>

      <Button variant="ghost" onClick={onManageCategories}>
        <FolderTree className="h-4 w-4" />
        Categories
      </Button>

      <Button onClick={onCreate}>
        <Plus className="h-4 w-4" />
        New experiment
      </Button>
    </section>
  );
}
