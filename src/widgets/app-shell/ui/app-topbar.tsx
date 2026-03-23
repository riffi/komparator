import { ChangeEvent, ReactNode, useRef, useState } from "react";
import { Download, MoonStar, Settings, Upload, X } from "lucide-react";
import { exportDatabaseToZip, importDatabaseFromZip } from "@/shared/db/backup";
import { themeStore } from "@/shared/config/theme";
import { Button } from "@/shared/ui/button";

type AppTopbarProps = {
  leadingAction?: ReactNode;
};

export function AppTopbar({ leadingAction }: AppTopbarProps) {
  const toggleTheme = themeStore((state) => state.toggleTheme);
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

  const onImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/80 bg-[rgba(16,18,22,0.86)] backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {leadingAction}
            <div className="font-mono text-[15px] font-semibold tracking-[-0.04em] text-text">
              <span className="mr-2 text-primary">◈</span>
              Komparator
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={onImportChange}
            />
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={onImportClick} disabled={busy !== ""}>
              <Upload className="h-4 w-4" />
              {busy === "import" ? "Importing..." : "Import"}
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => void onExport()} disabled={busy !== ""}>
              <Download className="h-4 w-4" />
              {busy === "export" ? "Exporting..." : "Export"}
            </Button>
            <Button variant="icon" size="icon" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="icon" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
              <MoonStar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

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
