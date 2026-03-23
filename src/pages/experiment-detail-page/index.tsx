import { useEffect, useMemo, useState } from "react";
import {
  Code2,
  Copy,
  Expand,
  FileText,
  ListFilter,
  Monitor,
  Pencil,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { WorkspaceResultItem } from "@/entities/experiment/model/types";
import { cn } from "@/shared/lib/cn";
import { ratingToneClass } from "@/shared/lib/rating-color";
import { getExperimentWorkspace } from "@/shared/db/seeds";
import { Button } from "@/shared/ui/button";

const deviceWidths = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
} as const;

export function ExperimentDetailPage() {
  const navigate = useNavigate();
  const { experimentId = "" } = useParams();
  const workspace = useMemo(() => getExperimentWorkspace(experimentId), [experimentId]);
  const [activeTab, setActiveTab] = useState<"results" | "prompt">("results");
  const [viewMode, setViewMode] = useState<"single" | "sbs">("single");
  const [selectedVersionId, setSelectedVersionId] = useState<string>(workspace?.promptVersions[0]?.id ?? "");
  const [selectedResultId, setSelectedResultId] = useState<string>("");
  const [slotAId, setSlotAId] = useState<string>("");
  const [slotBId, setSlotBId] = useState<string>("");
  const [lastSlot, setLastSlot] = useState<"a" | "b">("b");
  const [device, setDevice] = useState<keyof typeof deviceWidths>("desktop");
  const [showCode, setShowCode] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const visibleResults = useMemo(() => {
    if (!workspace || !selectedVersionId) {
      return [];
    }

    const activeVersion = workspace.promptVersions.find((item) => item.id === selectedVersionId);
    if (!activeVersion) {
      return [];
    }

    return workspace.results.filter((item) => item.promptVersionNumber === activeVersion.versionNumber);
  }, [selectedVersionId, workspace]);

  useEffect(() => {
    if (!workspace?.promptVersions.length) {
      return;
    }

    setSelectedVersionId((current) => current || workspace.promptVersions[0].id);
  }, [workspace]);

  useEffect(() => {
    if (!visibleResults.length) {
      setSelectedResultId("");
      setSlotAId("");
      setSlotBId("");
      return;
    }

    setSelectedResultId((current) =>
      visibleResults.some((item) => item.id === current) ? current : visibleResults[0].id,
    );
    setSlotAId((current) =>
      visibleResults.some((item) => item.id === current) ? current : visibleResults[0].id,
    );
    setSlotBId((current) => {
      if (visibleResults.some((item) => item.id === current)) {
        return current;
      }

      return visibleResults[1]?.id ?? visibleResults[0].id;
    });
  }, [visibleResults]);

  const selectedResult = visibleResults.find((item) => item.id === selectedResultId) ?? visibleResults[0];
  const slotA = visibleResults.find((item) => item.id === slotAId) ?? visibleResults[0];
  const slotB = visibleResults.find((item) => item.id === slotBId) ?? visibleResults[1] ?? visibleResults[0];
  const activePrompt =
    workspace?.promptVersions.find((item) => item.id === selectedVersionId) ?? workspace?.promptVersions[0];

  if (!workspace) {
    return (
      <section className="rounded-lg border border-border/80 bg-surface/70 p-6 shadow-panel">
        <h1 className="font-mono text-2xl font-semibold text-text">Experiment not found</h1>
        <p className="mt-3 text-sm text-muted">No experiment matches the requested route.</p>
        <Button className="mt-4" variant="ghost" onClick={() => navigate("/experiments")}>
          <Undo2 className="h-4 w-4" />
          Back to experiments
        </Button>
      </section>
    );
  }

  const copyPrompt = async () => {
    if (!activePrompt) {
      return;
    }

    const wrapped = workspace.wrapperTemplate.replace("{{prompt}}", activePrompt.promptText);
    await navigator.clipboard.writeText(wrapped);
  };

  const onSelectResult = (resultId: string) => {
    if (viewMode === "single") {
      setSelectedResultId(resultId);
      return;
    }

    if (lastSlot === "b") {
      setSlotAId(resultId);
      setLastSlot("a");
      return;
    }

    setSlotBId(resultId);
    setLastSlot("b");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-surface/70 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-mono text-xl font-semibold tracking-[-0.04em] text-text">
              {workspace.title}
            </h1>
            <span className="rounded-full bg-primary-soft/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
              {workspace.status}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: workspace.categoryColor }} />
              {workspace.categoryName}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted">{workspace.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void copyPrompt()}>
            <Copy className="h-4 w-4" />
            Copy prompt
          </Button>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border/80 px-4 py-2">
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:text-text",
            activeTab === "results" && "bg-primary-soft/60 text-text",
          )}
          onClick={() => setActiveTab("results")}
        >
          Results
          <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px]">
            {visibleResults.length}
          </span>
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:text-text",
            activeTab === "prompt" && "bg-primary-soft/60 text-text",
          )}
          onClick={() => setActiveTab("prompt")}
        >
          Prompt & settings
        </button>

        {activeTab === "results" ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-border/80 bg-code p-1">
              <button
                type="button"
                className={cn(
                  "rounded px-2.5 py-1 text-xs text-muted transition",
                  viewMode === "single" && "bg-surface text-text",
                )}
                onClick={() => setViewMode("single")}
              >
                Single
              </button>
              <button
                type="button"
                className={cn(
                  "rounded px-2.5 py-1 text-xs text-muted transition",
                  viewMode === "sbs" && "bg-surface text-text",
                )}
                onClick={() => setViewMode("sbs")}
              >
                Side by side
              </button>
            </div>
            <select
              className="h-9 rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
              value={selectedVersionId}
              onChange={(event) => setSelectedVersionId(event.target.value)}
            >
              {workspace.promptVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.versionNumber}
                </option>
              ))}
            </select>
            <Button size="sm">+ Add result</Button>
          </div>
        ) : null}
      </div>

      {activeTab === "results" ? (
        <div className="grid min-h-[680px] grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-border/80 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">Results</div>
                <div className="mt-1 text-sm text-muted">
                  Prompt version v{activePrompt?.versionNumber ?? "-"}
                </div>
              </div>
              <button
                type="button"
                className="rounded-md border border-border/80 bg-code p-2 text-muted transition hover:text-text"
              >
                <ListFilter className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[680px] space-y-1 overflow-y-auto p-2">
              {visibleResults.map((result) => {
                const isSelected = selectedResult?.id === result.id;
                const isA = slotA?.id === result.id;
                const isB = slotB?.id === result.id;

                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => onSelectResult(result.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-3 text-left transition hover:bg-raised",
                      viewMode === "single" && isSelected && "border-border bg-raised",
                      viewMode === "sbs" && (isA || isB) && "border-border bg-raised",
                    )}
                  >
                    <span
                      className="mt-1 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: result.providerColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-semibold text-text">
                          {result.providerName} / {result.modelName} {result.modelVersion}
                        </div>
                        {viewMode === "sbs" && isA ? (
                          <span className="rounded bg-primary-soft/60 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                            A
                          </span>
                        ) : null}
                        {viewMode === "sbs" && isB ? (
                          <span className="rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] text-orange-300">
                            B
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted">{result.modelComment}</div>
                      <div className="mt-1 font-mono text-[11px] text-dim">
                        Attempt {result.attempt} • {result.createdLabel}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "font-mono text-sm font-semibold",
                        result.rating ? ratingToneClass(result.rating) : "text-dim",
                      )}
                    >
                      {result.rating ?? "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: (viewMode === "single" ? selectedResult : slotA)?.providerColor }}
                  />
                  <div className="truncate text-sm font-semibold text-text">
                    {viewMode === "single"
                      ? `${selectedResult?.providerName ?? ""} / ${selectedResult?.modelName ?? ""} ${selectedResult?.modelVersion ?? ""}`
                      : "Comparison workspace"}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {viewMode === "single"
                    ? `${selectedResult?.fileSizeBytes ?? 0} bytes • ${selectedResult?.lineCount ?? 0} lines`
                    : "Click results on the left to assign slots A and B."}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={showCode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowCode((value) => !value)}
                >
                  <Code2 className="h-4 w-4" />
                  Code
                </Button>
                <Button
                  variant={showNotes ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowNotes((value) => !value)}
                >
                  <FileText className="h-4 w-4" />
                  Notes
                </Button>
                <Button variant="ghost" size="sm">
                  <Expand className="h-4 w-4" />
                  Fullscreen
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 border-b border-border/80 px-3 py-2">
              <DeviceButton
                active={device === "mobile"}
                onClick={() => setDevice("mobile")}
                icon={Smartphone}
                label="375"
              />
              <DeviceButton
                active={device === "tablet"}
                onClick={() => setDevice("tablet")}
                icon={Tablet}
                label="768"
              />
              <DeviceButton
                active={device === "desktop"}
                onClick={() => setDevice("desktop")}
                icon={Monitor}
                label="Full"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-code p-4">
              {viewMode === "single" ? (
                showCode ? (
                  <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-[#050608] p-4 font-mono text-xs leading-6 text-muted">
                    {selectedResult?.htmlContent ?? "No result selected."}
                  </pre>
                ) : (
                  <div
                    className="mx-auto h-[520px] max-w-full overflow-hidden rounded-lg border border-border/80 bg-white"
                    style={{ width: deviceWidths[device] }}
                  >
                    {selectedResult ? (
                      <iframe
                        title={selectedResult.id}
                        srcDoc={selectedResult.htmlContent}
                        className="h-full w-full border-0"
                        sandbox="allow-scripts"
                      />
                    ) : null}
                  </div>
                )
              ) : (
                <div className="grid h-[520px] gap-4 xl:grid-cols-2">
                  <ComparePanel label="A" result={slotA} device={device} showCode={showCode} />
                  <ComparePanel
                    label="B"
                    result={slotB}
                    device={device}
                    showCode={showCode}
                    accent="orange"
                  />
                </div>
              )}
            </div>

            {showNotes ? (
              <div className="border-t border-border/80 p-4">
                <div className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-dim">Notes</div>
                <textarea
                  className="min-h-[110px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  defaultValue={selectedResult?.notes}
                />
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {workspace.promptVersions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-xs transition",
                    selectedVersionId === version.id
                      ? "border-primary bg-primary-soft/50 text-primary"
                      : "border-border/80 text-muted hover:text-text",
                  )}
                >
                  v{version.versionNumber}
                </button>
              ))}
              <button
                type="button"
                className="rounded-full border border-dashed border-border/80 px-3 py-1.5 font-mono text-xs text-dim transition hover:text-text"
              >
                + New version
              </button>
            </div>

            <div className="rounded-lg border border-border/80 bg-code p-4">
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-dim">
                Prompt text
              </div>
              <textarea
                className="min-h-[260px] w-full resize-y bg-transparent font-mono text-sm leading-6 text-text outline-none"
                defaultValue={activePrompt?.promptText}
              />
            </div>

            <div className="text-sm italic text-muted">{activePrompt?.changeNote}</div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-raised p-4">
              <div className="font-mono text-xs uppercase tracking-[0.12em] text-dim">
                Experiment settings
              </div>
              <div className="mt-4 space-y-4">
                <Field label="Description" value={workspace.description} multiline />
                <Field label="Wrapper" value={workspace.wrapperName} />
                <Field label="Category" value={workspace.categoryName} />
                <Field label="Tags" value={workspace.tags.join(", ")} />
                <Field label="Status" value={workspace.status} />
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                    Wrapper preview
                  </div>
                  <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-code p-3 font-mono text-xs leading-5 text-muted">
                    {workspace.wrapperTemplate.replace("{{prompt}}", activePrompt?.promptText ?? "")}
                  </pre>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function DeviceButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Smartphone;
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted transition hover:text-text",
        active && "bg-surface text-text",
      )}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ComparePanel({
  label,
  result,
  device,
  showCode,
  accent = "blue",
}: {
  label: "A" | "B";
  result?: WorkspaceResultItem;
  device: keyof typeof deviceWidths;
  showCode: boolean;
  accent?: "blue" | "orange";
}) {
  if (!result) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/80 bg-[#050608] font-mono text-sm text-dim">
        Select a result
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-[#050608]">
      <div className="flex items-center gap-2 border-b border-border/80 px-3 py-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[10px]",
            accent === "blue" ? "bg-primary-soft/60 text-primary" : "bg-orange-500/10 text-orange-300",
          )}
        >
          {label}
        </span>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: result.providerColor }} />
        <div className="truncate text-sm font-semibold text-text">
          {result.providerName} / {result.modelName} {result.modelVersion}
        </div>
        <div
          className={cn(
            "ml-auto font-mono text-sm",
            result.rating ? ratingToneClass(result.rating) : "text-dim",
          )}
        >
          {result.rating ?? "—"}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {showCode ? (
          <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-6 text-muted">
            {result.htmlContent}
          </pre>
        ) : (
          <div
            className="mx-auto h-full min-h-[420px] max-w-full overflow-hidden rounded-lg border border-border/80 bg-white"
            style={{ width: deviceWidths[device] }}
          >
            <iframe
              title={result.id}
              srcDoc={result.htmlContent}
              className="h-full w-full border-0"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</div>
      {multiline ? (
        <textarea
          className="min-h-[100px] w-full rounded-lg border border-border/80 bg-code px-3 py-2 text-sm text-text outline-none focus:border-primary"
          defaultValue={value}
        />
      ) : (
        <input
          className="h-10 w-full rounded-lg border border-border/80 bg-code px-3 text-sm text-text outline-none focus:border-primary"
          defaultValue={value}
        />
      )}
    </div>
  );
}