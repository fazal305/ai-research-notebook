import { useCallback, useMemo, useRef, useState } from "react";
import "./App.css";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { ResearchProvider } from "./context/ResearchContext.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";
import {
  AppLoadingScreen,
  AppErrorScreen,
} from "./components/layout/AppStatusScreen.jsx";
import { DocumentSidebar } from "./components/documents/DocumentSidebar.jsx";
import { WorkspacePanel } from "./components/layout/WorkspacePanel.jsx";
import { AIAnalysisPanel } from "./components/ai/AIAnalysisPanel.jsx";
import { HistoryModal } from "./components/history/HistoryModal.jsx";
import { SettingsModal } from "./components/settings/SettingsModal.jsx";
import { SessionImportTrigger } from "./components/settings/SessionImportTrigger.jsx";
import { CommandPalette } from "./components/commandPalette/CommandPalette.jsx";
import { GlobalImportTrigger } from "./components/documents/GlobalImportTrigger.jsx";
import { useIndexedDB } from "./hooks/useIndexedDB.js";
import { useResearch } from "./hooks/useResearch.js";
import { useTheme } from "./hooks/useTheme.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { requestFlush } from "./utils/saveBus.js";
import { requestAnalyze } from "./utils/analyzeBus.js";
import { exportSession } from "./services/session/sessionExporter.js";

function App() {
  const { status, error, retry } = useIndexedDB();

  if (status === "loading") {
    return <AppLoadingScreen />;
  }

  if (status === "error") {
    return <AppErrorScreen error={error} onRetry={retry} />;
  }

  return (
    <SettingsProvider>
      <ResearchProvider>
        <AppContent />
      </ResearchProvider>
    </SettingsProvider>
  );
}

/**
 * Split out from App so it can call useResearch() (needs to be inside
 * ResearchProvider) — the History/Settings/Command-Palette overlays all
 * need document actions, so they have to live somewhere with access to them.
 */
function AppContent() {
  const {
    documents,
    selectedDocument,
    selectDocument,
    createDocument,
    reload,
  } = useResearch();
  const { cycleTheme } = useTheme();

  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null); // { tone: 'error' | 'success', message }
  const importTriggerRef = useRef(null);
  const sessionImportTriggerRef = useRef(null);

  useKeyboardShortcuts({
    onCommandPalette: () => setPaletteOpen(true),
    onSave: requestFlush,
    onImport: () => importTriggerRef.current?.open(),
    onAnalyze: requestAnalyze,
  });

  const handleExportSession = useCallback(async () => {
    try {
      const result = await exportSession();
      setToast({
        tone: "success",
        message: `Exported ${result.documentCount} documents, ${result.noteCount} notes, ${result.historyCount} AI history entries.`,
      });
    } catch (err) {
      setToast({ tone: "error", message: `Export failed: ${err.message}` });
    }
  }, []);

  const handleSessionImportSuccess = useCallback(
    (result, warnings) => {
      reload();
      const warningNote =
        warnings.length > 0
          ? ` (${warnings.length} item(s) skipped — see console)`
          : "";
      if (warnings.length > 0)
        console.warn("Session import warnings:", warnings);
      setToast({
        tone: "success",
        message: `Imported ${result.documentCount} documents, ${result.noteCount} notes, ${result.historyCount} AI history entries.${warningNote}`,
      });
    },
    [reload],
  );

  const handleSessionImportError = useCallback((message, warnings) => {
    if (warnings?.length) console.warn("Session import warnings:", warnings);
    setToast({ tone: "error", message });
  }, []);

  const commands = useMemo(() => {
    const list = [
      {
        id: "new-document",
        label: "New Document",
        run: async () => {
          const doc = await createDocument({
            title: "Untitled document",
            type: "txt",
            content: "",
          });
          selectDocument(doc.id);
        },
      },
      {
        id: "import-document",
        label: "Import Document",
        run: () => importTriggerRef.current?.open(),
      },
      { id: "toggle-theme", label: "Toggle Theme", run: cycleTheme },
      {
        id: "open-history",
        label: "Open AI History",
        run: () => setHistoryOpen(true),
      },
      {
        id: "open-settings",
        label: "Settings",
        run: () => setSettingsOpen(true),
      },
      {
        id: "export-session",
        label: "Export Research Session",
        run: handleExportSession,
      },
      {
        id: "import-session",
        label: "Import Research Session",
        run: () => sessionImportTriggerRef.current?.open(),
      },
    ];
    if (selectedDocument) {
      list.push({
        id: "analyze-current",
        label: "Analyze Current Document",
        run: requestAnalyze,
      });
    }
    return list;
  }, [
    createDocument,
    selectDocument,
    cycleTheme,
    selectedDocument,
    handleExportSession,
  ]);

  return (
    <>
      <AppShell
        statusLabel="Local / Ready"
        statusTone="ready"
        onOpenCommandPalette={() => setPaletteOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        sidebar={<DocumentSidebar />}
        workspace={<WorkspacePanel />}
        aiPanel={<AIAnalysisPanel />}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setHistoryOpen(false)}
        onOpenDocument={(documentId) => {
          selectDocument(documentId);
          setHistoryOpen(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        onExportSession={handleExportSession}
        onImportSession={() => sessionImportTriggerRef.current?.open()}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
        documents={documents}
        onSelectDocument={selectDocument}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <GlobalImportTrigger
        ref={importTriggerRef}
        onImport={createDocument}
        onError={(message) => setToast({ tone: "error", message })}
      />
      <SessionImportTrigger
        ref={sessionImportTriggerRef}
        onSuccess={handleSessionImportSuccess}
        onError={handleSessionImportError}
      />

      {toast ? (
        <div className={`app-toast app-toast--${toast.tone}`} role="alert">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ) : null}
    </>
  );
}

export default App;
