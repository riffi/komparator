import { ChangeEvent, useRef, useState } from "react";
import { Download, Upload, X } from "lucide-react";
import { exportDatabaseToZip, importDatabaseFromZip } from "@/shared/db/backup";
import { Button } from "@/shared/ui/button";

export function SettingsPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<"" | "import" | "export">("");
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState("");

  const onExport = async () => {
    setBusy("export");
    try {
      await exportDatabaseToZip();
    } finally {
      setBusy("");
    }
  };

  const onImportClick = () => {
    inputRef.current?.click();
  };

  const onImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setImportError("");
    setPendingImportFile(file);
  };

  const onConfirmImport = async () => {
    if (!pendingImportFile) {
      return;
    }

    setBusy("import");
    setImportError("");

    try {
      await importDatabaseFromZip(pendingImportFile);
      window.location.reload();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy("");
    }
  };

  const onCloseImportModal = () => {
    if (busy === "import") {
      return;
    }

    setPendingImportFile(null);
    setImportError("");
  };

  return (
    <>
      <section className="space-y-5">
        <div className="rounded-xl border border-border/80 bg-surface/70 px-5 py-4 shadow-panel">
          <h1 className="font-mono text-2xl font-semibold text-text">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage local backups for this browser. Import replaces the current IndexedDB data.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-border/80 bg-surface/70 p-5 shadow-panel">
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-dim">Backup</div>
            <h2 className="mt-3 text-lg font-semibold text-text">Export local database</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Download a ZIP backup of all experiments, prompts, models, wrappers, results and analytics data.
            </p>
            <div className="mt-5">
              <Button onClick={() => void onExport()} disabled={busy !== ""}>
                <Download className="h-4 w-4" />
                {busy === "export" ? "Exporting..." : "Export backup"}
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border/80 bg-surface/70 p-5 shadow-panel">
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-dim">Restore</div>
            <h2 className="mt-3 text-lg font-semibold text-text">Import backup</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Restore a ZIP backup created by Komparator. This replaces all current local data in this browser.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={onImportChange}
            />
            <div className="mt-5">
              <Button variant="ghost" onClick={onImportClick} disabled={busy !== ""}>
                <Upload className="h-4 w-4" />
                {busy === "import" ? "Importing..." : "Choose backup"}
              </Button>
            </div>
          </section>
        </div>
      </section>

      {pendingImportFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border/80 bg-raised p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xl font-semibold text-text">Import backup</h2>
                <p className="mt-1 text-sm text-muted">This will replace the current local database in this browser.</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-text"
                onClick={onCloseImportModal}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-border/80 bg-code px-4 py-3 text-sm text-text">
              {pendingImportFile.name}
              <div className="mt-1 text-xs text-muted">{Math.max(1, Math.round(pendingImportFile.size / 1024))} KB</div>
            </div>

            {importError ? <div className="mt-4 text-sm text-red-300">{importError}</div> : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCloseImportModal} disabled={busy === "import"}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void onConfirmImport()} disabled={busy === "import"}>
                <Upload className="h-4 w-4" />
                {busy === "import" ? "Importing..." : "Import backup"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
