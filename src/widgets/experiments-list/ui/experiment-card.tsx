import { Link } from "react-router-dom";
import { ExperimentListItem } from "@/entities/experiment/model/types";
import { appRoutes } from "@/shared/config/routes";
import { ratingToneClass } from "@/shared/lib/rating-color";
import { cn } from "@/shared/lib/cn";

type ExperimentCardProps = {
  experiment: ExperimentListItem;
};

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  return (
    <Link
      to={`/${appRoutes.experiments}/${experiment.id}`}
      className="group flex min-h-[220px] flex-col rounded-lg border border-border/80 bg-surface p-5 shadow-panel transition hover:-translate-y-1 hover:border-border hover:bg-raised"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: experiment.categoryColor }}
          />
          {experiment.categoryName}
        </span>
        <span className="font-mono text-[11px] text-dim">{experiment.updatedLabel}</span>
      </div>

      <h2 className="mt-4 text-base font-semibold text-text">{experiment.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{experiment.description}</p>

      <div className="mt-auto border-t border-border/80 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Prompts" value={String(experiment.promptCount)} />
          <Stat label="Results" value={String(experiment.resultCount)} />
          <Stat
            label="Avg Rating"
            value={experiment.avgRating ? experiment.avgRating.toFixed(1) : "—"}
            className={experiment.avgRating ? ratingToneClass(experiment.avgRating) : "text-dim"}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-dim">
          <span>{experiment.createdLabel}</span>
          <span>{experiment.resultCount} results</span>
        </div>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className={cn("font-mono text-sm font-semibold text-text", className)}>{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
        {label}
      </div>
    </div>
  );
}
