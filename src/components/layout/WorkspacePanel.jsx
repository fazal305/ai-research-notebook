import { useState } from "react";
import { PanelSection } from "./PanelSection.jsx";
import { DocumentEditor } from "../documents/DocumentEditor.jsx";
import { NotesPanel } from "../notes/NotesPanel.jsx";
import { DashboardPanel } from "../dashboard/DashboardPanel.jsx";
import { useResearch } from "../../hooks/useResearch.js";
import "./WorkspacePanel.css";

const TABS = [
  { id: "document", label: "Document" },
  { id: "notes", label: "Notes" },
];

/**
 * Both tab contents stay mounted (toggled via CSS) rather than being
 * conditionally rendered — unmounting mid-edit would drop whatever hadn't
 * been autosaved yet in the ~600ms debounce window.
 */
export function WorkspacePanel() {
  const { selectedDocument, updateDocument } = useResearch();
  const [activeTab, setActiveTab] = useState("document");

  if (!selectedDocument) {
    return (
      <PanelSection title="Research Workspace">
        <DashboardPanel />
      </PanelSection>
    );
  }

  return (
    <PanelSection
      title="Research Workspace"
      actions={
        <div
          className="workspace-tabs"
          role="tablist"
          aria-label="Workspace view"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className="workspace-tabs__btn"
              data-active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      <div
        className="workspace-view"
        data-active={activeTab === "document"}
        role="tabpanel"
      >
        <DocumentEditor
          key={selectedDocument.id}
          doc={selectedDocument}
          updateDocument={updateDocument}
        />
      </div>
      <div
        className="workspace-view"
        data-active={activeTab === "notes"}
        role="tabpanel"
      >
        <NotesPanel documentId={selectedDocument.id} />
      </div>
    </PanelSection>
  );
}
