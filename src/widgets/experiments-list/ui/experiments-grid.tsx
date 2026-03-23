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
        <p className="font-mono text-sm text-dim">No experiments match your filters.</p>
      </div>
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