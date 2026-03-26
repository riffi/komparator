import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { WrapperSelectOption } from "@/shared/db/workspace";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

type WrapperVersionPickerDialogProps = {
  open: boolean;
  title?: string;
  value: string;
  options: WrapperSelectOption[];
  onClose: () => void;
  onSelect: (value: string) => void;
  emptyLabel?: string;
  description?: string;
};

export function WrapperVersionPickerDialog({
  open,
  title = "Choose wrapper version",
  value,
  options,
  onClose,
  onSelect,
  emptyLabel = "No wrapper",
  description,
}: WrapperVersionPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedWrapperName, setSelectedWrapperName] = useState<string | null>(null);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) =>
      [option.wrapperName, option.label, option.template].join(" ").toLowerCase().includes(query),
    );
  }, [options, search]);

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, WrapperSelectOption[]>();
    for (const option of filteredOptions) {
      const current = groups.get(option.wrapperName) ?? [];
      current.push(option);
      groups.set(option.wrapperName, current);
    }

    return [...groups.entries()];
  }, [filteredOptions]);

  const selectedGroup = useMemo(
    () => groupedOptions.find(([wrapperName]) => wrapperName === selectedWrapperName) ?? null,
    [groupedOptions, selectedWrapperName],
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedWrapperName(null);
      return;
    }

    if (selectedWrapperName && !groupedOptions.some(([wrapperName]) => wrapperName === selectedWrapperName)) {
      setSelectedWrapperName(null);
    }
  }, [groupedOptions, open, selectedWrapperName]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[min(760px,92vh)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border/80 bg-raised shadow-panel">
        <div className="flex items-start justify-between gap-3 border-b border-border/80 px-5 py-4">
          <div>
            <h2 className="font-mono text-xl font-semibold text-text">{title}</h2>
            <p className="mt-1 text-sm text-muted">
              {description ??
                "Choose a wrapper family first, then pick the exact immutable version to attach."}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-text"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border/80 px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <input
              className="h-10 w-full rounded-md border border-border/80 bg-code pl-10 pr-3 text-sm text-text outline-none transition focus:border-primary"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search wrappers or versions..."
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <button
            type="button"
            className={cn(
              "mb-4 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition",
              value === ""
                ? "border-primary/60 bg-primary-soft/20"
                : "border-border/80 bg-code/40 hover:border-primary/40 hover:bg-code/70",
            )}
            onClick={() => {
              onSelect("");
              onClose();
            }}
          >
            <div>
              <div className="font-medium text-text">{emptyLabel}</div>
              <div className="mt-1 text-sm text-muted">Use only the built-in HTML-output instruction and prompt text.</div>
            </div>
          </button>

          {selectedGroup ? (
            <div className="space-y-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"
                onClick={() => setSelectedWrapperName(null)}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to wrappers
              </button>

              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">Wrapper</div>
                <div className="mt-1 text-lg font-semibold text-text">{selectedGroup[0]}</div>
              </div>

              <div className="space-y-2">
                {selectedGroup[1].map((option) => {
                  const versionSummary = option.changeNote.trim() || "No change note";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left transition",
                        value === option.id
                          ? "border-primary/60 bg-primary-soft/20"
                          : "border-border/80 bg-code/40 hover:border-primary/40 hover:bg-code/70",
                      )}
                      onClick={() => {
                        onSelect(option.id);
                        onClose();
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-text">v{option.versionNumber}</div>
                        <div className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-muted">
                          {versionSummary}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-surface/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                        {option.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : groupedOptions.length ? (
            <div className="space-y-2">
              {groupedOptions.map(([wrapperName, group]) => {
                const currentSelected = group.find((option) => option.id === value);
                const latestVersion = group[0]?.versionNumber ?? "?";

                return (
                  <button
                    key={wrapperName}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition",
                      currentSelected
                        ? "border-primary/60 bg-primary-soft/20"
                        : "border-border/80 bg-code/40 hover:border-primary/40 hover:bg-code/70",
                    )}
                    onClick={() => setSelectedWrapperName(wrapperName)}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-text">{wrapperName}</div>
                      <div className="mt-1 text-sm text-muted">
                        {group.length} version{group.length === 1 ? "" : "s"} available, latest v{latestVersion}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {currentSelected ? (
                        <div className="rounded-full bg-surface/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                          Selected v{currentSelected.versionNumber}
                        </div>
                      ) : null}
                      <ChevronRight className="h-4 w-4 text-dim" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/80 bg-code/30 px-4 py-6 text-sm text-muted">
              No wrappers match your search.
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border/80 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
