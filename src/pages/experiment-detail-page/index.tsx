import { useParams } from "react-router-dom";

export function ExperimentDetailPage() {
  const { experimentId } = useParams();

  return (
    <section className="rounded-lg border border-border/80 bg-surface/70 p-6 shadow-panel">
      <h1 className="font-mono text-2xl font-semibold text-text">Experiment Detail</h1>
      <p className="mt-3 text-sm text-muted">
        Detail workspace for <span className="font-mono text-text">{experimentId}</span> will be implemented next.
      </p>
    </section>
  );
}