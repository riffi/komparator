import { Plus, Search } from "lucide-react";
import { filterStore } from "@/features/experiment-filters/model/use-experiment-filters";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function ExperimentsHeader({
  count,
  onCreate,
}: {
  count: number;
  onCreate: () => void;
}) {
  const query = filterStore((state) => state.query);
  const setQuery = filterStore((state) => state.setQuery);

  return (
    <section className="flex flex-wrap items-center gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="font-mono text-[24px] font-semibold tracking-[-0.05em] text-text">
          Experiments
          <span className="ml-2 text-base font-normal text-dim">{count}</span>
        </h1>
      </div>
      <div className="relative min-w-[240px] max-w-[420px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
        <Input
          className="pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, tags, description..."
        />
      </div>
      <Button onClick={onCreate}>
        <Plus className="h-4 w-4" />
        New experiment
      </Button>
    </section>
  );
}
