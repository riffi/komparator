import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExperimentListItem } from "@/entities/experiment/model/types";
import { appRoutes } from "@/shared/config/routes";
import { loadExperimentPreviewHtml } from "@/shared/db/workspace";
import { ratingToneClass } from "@/shared/lib/rating-color";
import { cn } from "@/shared/lib/cn";

type ExperimentCardProps = {
  experiment: ExperimentListItem;
};

const previewHtmlCache = new Map<string, string | null>();

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  const topResult = experiment.topResultPreview;
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(
    topResult ? previewHtmlCache.get(topResult.resultId) ?? null : null,
  );
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!topResult || shouldLoadPreview) {
      return;
    }

    const node = previewRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoadPreview(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoadPreview, topResult]);

  useEffect(() => {
    if (!topResult || !shouldLoadPreview) {
      return;
    }

    const cachedPreview = previewHtmlCache.get(topResult.resultId);
    if (cachedPreview !== undefined) {
      setPreviewHtml(cachedPreview);
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);

    void loadExperimentPreviewHtml(topResult.resultId)
      .then((html) => {
        previewHtmlCache.set(topResult.resultId, html);
        if (!cancelled) {
          setPreviewHtml(html);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoadPreview, topResult]);

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
        <div
          ref={previewRef}
          className="mt-3 hidden overflow-hidden rounded-xl border border-border/80 bg-code lg:block"
        >
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
            {previewHtml ? (
              <iframe
                title={`${experiment.id}-top-result`}
                srcDoc={previewHtml}
                className="h-full w-full origin-top-left scale-[0.38] border-0"
                style={{ width: "263%", height: "263%" }}
                sandbox="allow-scripts"
                loading="lazy"
                tabIndex={-1}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
                <div className="text-center">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    {loadingPreview || shouldLoadPreview ? "Loading preview" : "Preview on scroll"}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {topResult.providerName} / {topResult.modelName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 hidden rounded-xl border border-dashed border-border/80 bg-code/50 p-4 lg:block">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">No results yet</div>
          <div className="mt-2 text-sm font-semibold text-text">This experiment has not been run yet</div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Open the experiment, copy the prompt, and add the first HTML result to start comparing models.
          </p>
        </div>
      )}

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
