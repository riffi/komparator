import { ExperimentListItem } from "@/entities/experiment/model/types";
import { filterExperiments } from "@/entities/experiment/model/selectors";
import { filterStore } from "@/features/experiment-filters/model/use-experiment-filters";
import { Button } from "@/shared/ui/button";
import { ExperimentCard } from "@/widgets/experiments-list/ui/experiment-card";

export function ExperimentsGrid({
  experiments,
  loading,
  onCreate,
}: {
  experiments: ExperimentListItem[];
  loading: boolean;
  onCreate: () => void;
}) {
  const filters = filterStore();
  const filteredExperiments = filterExperiments(experiments, filters);

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-surface/40 px-6 py-12 text-center">
        <p className="font-mono text-sm text-dim">Loading experiments...</p>
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface/60 shadow-panel">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="relative overflow-hidden px-6 py-8 md:px-8 md:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,141,239,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(94,194,105,0.12),transparent_32%)]" />
            <div className="relative max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-dim">Empty workspace</div>
              <h2 className="mt-3 font-mono text-3xl font-semibold tracking-[-0.05em] text-text">
                Start with your first experiment
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
                Experiments are reusable comparison cases for the same prompt. You create one task,
                collect HTML outputs from different models, then review them side by side and rate the
                results.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={onCreate}>Create experiment</Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border/80 bg-code/70 px-6 py-8 md:px-8 xl:border-l xl:border-t-0">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-dim">How it works</div>
            <ol className="mt-5 space-y-4">
              <li className="rounded-xl border border-border/80 bg-surface/50 px-4 py-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Step 1</div>
                <div className="mt-1 text-sm font-semibold text-text">Create an experiment</div>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Define the task, write the prompt, and optionally attach a wrapper and category.
                </p>
              </li>
              <li className="rounded-xl border border-border/80 bg-surface/50 px-4 py-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Step 2</div>
                <div className="mt-1 text-sm font-semibold text-text">Generate results</div>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Copy the prepared prompt, send it to one or more LLM chats, and collect their HTML output.
                </p>
              </li>
              <li className="rounded-xl border border-border/80 bg-surface/50 px-4 py-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Step 3</div>
                <div className="mt-1 text-sm font-semibold text-text">Compare and rate</div>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Add results back into the experiment, inspect them in preview, compare side by side,
                  and assign ratings.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>
    );
  }

  if (filteredExperiments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-surface/40 px-6 py-12 text-center">
        <p className="font-mono text-sm text-dim">No experiments match your search.</p>
      </div>
    );
  }

  if (filters.viewMode === "grouped") {
    const sections = new Map<string, { name: string; color: string; items: ExperimentListItem[] }>();

    for (const experiment of filteredExperiments) {
      const key = experiment.categoryId ?? "uncategorized";
      const current = sections.get(key) ?? {
        name: experiment.categoryName,
        color: experiment.categoryColor,
        items: [],
      };
      current.items.push(experiment);
      sections.set(key, current);
    }

    return (
      <section className="space-y-6">
        {[...sections.entries()]
          .sort((left, right) => left[1].name.localeCompare(right[1].name))
          .map(([key, section]) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: section.color }} />
                <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.12em] text-text">
                  {section.name}
                </h2>
                <span className="font-mono text-xs text-dim">{section.items.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.items.map((experiment) => (
                  <ExperimentCard key={experiment.id} experiment={experiment} />
                ))}
              </div>
            </div>
          ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredExperiments.map((experiment) => (
        <ExperimentCard key={experiment.id} experiment={experiment} />
      ))}
    </section>
  );
}
