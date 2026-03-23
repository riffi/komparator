import { ExperimentListItem } from "@/entities/experiment/model/types";
import { filterExperiments } from "@/entities/experiment/model/selectors";
import { filterStore } from "@/features/experiment-filters/model/use-experiment-filters";
import { ExperimentCard } from "@/widgets/experiments-list/ui/experiment-card";

export function ExperimentsGrid({ experiments, loading }: { experiments: ExperimentListItem[]; loading: boolean }) {
  const filters = filterStore();
  const filteredExperiments = filterExperiments(experiments, filters);

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-surface/40 px-6 py-12 text-center">
        <p className="font-mono text-sm text-dim">Loading experiments...</p>
      </div>
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
