import { Link } from "react-router-dom";
import { ExperimentListItem } from "@/entities/experiment/model/types";
import { appRoutes } from "@/shared/config/routes";
import { ratingToneClass } from "@/shared/lib/rating-color";
import { cn } from "@/shared/lib/cn";

type ExperimentCardProps = {
  experiment: ExperimentListItem;
};

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  const topResult = experiment.topResultPreview;

  return (
    <Link
      to={`/${appRoutes.experiments}/${experiment.id}`}
      className="group flex min-h-[200px] flex-col rounded-lg border border-border/80 bg-surface p-4 shadow-panel transition hover:-translate-y-1 hover:border-border hover:bg-raised"
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

      <h2 className="mt-3 text-[15px] font-semibold text-text">{experiment.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{experiment.description}</p>

      {topResult ? (
        <div className="mt-3 hidden overflow-hidden rounded-xl border border-border/80 bg-code lg:block">
          <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Top result</div>
              <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: topResult.providerColor }} />
                <span className="truncate">
                  {topResult.providerName} / {topResult.modelName} {topResult.modelVersion}
                </span>
              </div>
            </div>
            <div className={cn("font-mono text-sm font-semibold", topResult.rating ? ratingToneClass(topResult.rating) : "text-dim")}>
              {topResult.rating ? topResult.rating.toFixed(1) : "—"}
            </div>
          </div>
          <div className="pointer-events-none aspect-[16/9] overflow-hidden bg-white">
            <iframe
              title={`${experiment.id}-top-result`}
              srcDoc={topResult.htmlContent}
              className="h-full w-full origin-top-left scale-[0.38] border-0"
              style={{ width: "263%", height: "263%" }}
              sandbox="allow-scripts"
              tabIndex={-1}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-auto border-t border-border/80 pt-3">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Prompts" value={String(experiment.promptCount)} />
          <Stat label="Results" value={String(experiment.resultCount)} />
          <Stat
            label="Avg Rating"
            value={experiment.avgRating ? experiment.avgRating.toFixed(1) : "—"}
            className={experiment.avgRating ? ratingToneClass(experiment.avgRating) : "text-dim"}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-dim">
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
