import { useEffect, useMemo, useState } from "react";
import {
  loadStatsDashboard,
  StatsCategoryMatrixRow,
  StatsDashboardData,
  StatsHistorySeries,
  StatsLeaderboardItem,
  StatsProviderBreakdownItem,
} from "@/shared/db/workspace";
import { cn } from "@/shared/lib/cn";
import { ratingToneClass } from "@/shared/lib/rating-color";

const HISTORY_WIDTH = 640;
const HISTORY_HEIGHT = 240;

export function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsDashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const nextStats = await loadStatsDashboard();
      if (!cancelled) {
        setStats(nextStats);
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-xl border border-border/80 bg-surface/70 p-6 shadow-panel">
        <h1 className="font-mono text-2xl font-semibold text-text">Stats</h1>
        <p className="mt-3 text-sm text-muted">Loading statistics...</p>
      </section>
    );
  }

  if (!stats || (stats.summary[1]?.value ?? "0") === "0") {
    return (
      <section className="rounded-xl border border-border/80 bg-surface/70 p-8 shadow-panel">
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-dim">No data yet</div>
        <h1 className="mt-3 font-mono text-3xl font-semibold tracking-[-0.05em] text-text">
          Stats will appear after you add rated results
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          This page aggregates experiments, model performance, provider averages, category patterns,
          and rating history. Create experiments, add HTML results, and assign ratings to unlock the
          dashboard.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-text">Stats</h1>
          <p className="mt-1 text-sm text-muted">
            Aggregated model, provider, category, and rating signals across your local workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.summary.map((card) => (
          <div key={card.label} className="rounded-xl border border-border/80 bg-surface/70 p-4 shadow-panel">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{card.label}</div>
            <div className="mt-3 font-mono text-3xl font-semibold tracking-[-0.05em] text-text">{card.value}</div>
            <div className="mt-2 text-sm text-muted">{card.helper}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <LeaderboardCard items={stats.leaderboard} />
        <ProviderBreakdownCard items={stats.providerBreakdown} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <CategoryMatrixCard rows={stats.categoryMatrix} models={stats.categoryModels} />
        <RatingHistoryCard series={stats.ratingHistory} />
      </div>
    </section>
  );
}

function LeaderboardCard({ items }: { items: StatsLeaderboardItem[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-surface/70 shadow-panel">
      <div className="border-b border-border/80 px-5 py-4">
        <h2 className="font-mono text-lg font-semibold text-text">Model leaderboard</h2>
        <p className="mt-1 text-sm text-muted">Highest average rating first.</p>
      </div>
      <div className="divide-y divide-border/70">
        {items.length ? (
          items.slice(0, 10).map((item, index) => (
            <div key={item.modelId} className="grid grid-cols-[56px_minmax(0,1fr)_110px_96px_96px] items-center gap-3 px-5 py-3">
              <div className="font-mono text-sm text-dim">#{index + 1}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.providerColor }} />
                  <div className="truncate text-sm font-semibold text-text">
                    {item.providerName} / {item.modelName} {item.modelVersion}
                  </div>
                </div>
              </div>
              <div className={cn("font-mono text-sm font-semibold", ratingToneClass(item.avgRating))}>
                {item.avgRating.toFixed(1)}
              </div>
              <div className="text-sm text-muted">{item.ratedCount} rated</div>
              <div className="text-sm text-muted">{item.winRate.toFixed(0)}% wins</div>
            </div>
          ))
        ) : (
          <div className="px-5 py-6 text-sm text-muted">No rated results yet.</div>
        )}
      </div>
    </section>
  );
}

function ProviderBreakdownCard({ items }: { items: StatsProviderBreakdownItem[] }) {
  const maxCount = Math.max(...items.map((item) => item.resultsCount), 1);

  return (
    <section className="rounded-xl border border-border/80 bg-surface/70 p-5 shadow-panel">
      <h2 className="font-mono text-lg font-semibold text-text">Provider breakdown</h2>
      <p className="mt-1 text-sm text-muted">Average rating and total results per provider.</p>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.providerId} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.providerColor }} />
                  <div className="truncate text-sm font-semibold text-text">{item.providerName}</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn("font-mono font-semibold", ratingToneClass(item.avgRating))}>
                    {item.avgRating.toFixed(1)}
                  </span>
                  <span className="text-muted">{item.resultsCount} results</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-code">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.resultsCount / maxCount) * 100}%`,
                    backgroundColor: item.providerColor,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted">No provider metrics available yet.</div>
        )}
      </div>
    </section>
  );
}

function CategoryMatrixCard({
  rows,
  models,
}: {
  rows: StatsCategoryMatrixRow[];
  models: Array<{ modelId: string; label: string; providerColor: string }>;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-surface/70 shadow-panel">
      <div className="border-b border-border/80 px-5 py-4">
        <h2 className="font-mono text-lg font-semibold text-text">Category stats</h2>
        <p className="mt-1 text-sm text-muted">Average rating by category across the strongest active models.</p>
      </div>
      {rows.length && models.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border/80 bg-code/50">
              <tr>
                <th className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  Category
                </th>
                {models.map((model) => (
                  <th key={model.modelId} className="min-w-[140px] px-4 py-3 text-left">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: model.providerColor }} />
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                        {model.label}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.categoryId} className="border-b border-border/70 last:border-b-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="font-medium text-text">{row.categoryName}</span>
                    </div>
                  </td>
                  {row.values.map((value) => (
                    <td key={`${row.categoryId}-${value.modelId}`} className="px-4 py-4">
                      <div className={cn("font-mono text-sm font-semibold", value.avgRating ? ratingToneClass(value.avgRating) : "text-dim")}>
                        {value.avgRating ? value.avgRating.toFixed(1) : "—"}
                      </div>
                      <div className="mt-1 text-xs text-muted">{value.resultsCount} rated</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-6 text-sm text-muted">Not enough rated category data yet.</div>
      )}
    </section>
  );
}

function RatingHistoryCard({ series }: { series: StatsHistorySeries[] }) {
  const chart = useMemo(() => {
    const allDates = [...new Set(series.flatMap((item) => item.points.map((point) => point.date)))].sort();
    if (!allDates.length) {
      return null;
    }

    const xStep = allDates.length > 1 ? (HISTORY_WIDTH - 80) / (allDates.length - 1) : 0;
    const yForRating = (rating: number) => HISTORY_HEIGHT - 32 - ((rating - 1) / 9) * (HISTORY_HEIGHT - 64);

    return {
      allDates,
      xStep,
      yForRating,
    };
  }, [series]);

  return (
    <section className="rounded-xl border border-border/80 bg-surface/70 p-5 shadow-panel">
      <h2 className="font-mono text-lg font-semibold text-text">Rating history</h2>
      <p className="mt-1 text-sm text-muted">Average rating over time for the strongest models.</p>

      {chart && series.some((item) => item.points.length > 0) ? (
        <>
          <div className="mt-5 overflow-x-auto">
            <svg width={HISTORY_WIDTH} height={HISTORY_HEIGHT} className="min-w-[640px]">
              {[1, 4, 7, 10].map((tick) => {
                const y = chart.yForRating(tick);
                return (
                  <g key={tick}>
                    <line x1="40" x2={HISTORY_WIDTH - 20} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                    <text x="12" y={y + 4} fill="rgba(160,167,178,0.9)" fontSize="11" fontFamily="monospace">
                      {tick}
                    </text>
                  </g>
                );
              })}

              {series.map((item) => {
                if (!item.points.length) {
                  return null;
                }

                const polyline = item.points
                  .map((point) => {
                    const dateIndex = chart.allDates.indexOf(point.date);
                    const x = 40 + dateIndex * chart.xStep;
                    const y = chart.yForRating(point.avgRating);
                    return `${x},${y}`;
                  })
                  .join(" ");

                return (
                  <g key={item.modelId}>
                    <polyline
                      fill="none"
                      stroke={item.color}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={polyline}
                    />
                    {item.points.map((point) => {
                      const dateIndex = chart.allDates.indexOf(point.date);
                      const x = 40 + dateIndex * chart.xStep;
                      const y = chart.yForRating(point.avgRating);
                      return <circle key={`${item.modelId}-${point.date}`} cx={x} cy={y} r="3.5" fill={item.color} />;
                    })}
                  </g>
                );
              })}

              {chart.allDates.map((date, index) => {
                const x = 40 + index * chart.xStep;
                return (
                  <text
                    key={date}
                    x={x}
                    y={HISTORY_HEIGHT - 8}
                    textAnchor={index === 0 ? "start" : index === chart.allDates.length - 1 ? "end" : "middle"}
                    fill="rgba(160,167,178,0.9)"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {date.slice(5)}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {series.map((item) => (
              <div key={item.modelId} className="flex items-center gap-2 rounded-full border border-border/80 bg-code px-3 py-1.5 text-sm text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-5 text-sm text-muted">Not enough rating history yet.</div>
      )}
    </section>
  );
}
