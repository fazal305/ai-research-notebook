import { useMemo, useState } from "react";
import { PanelSection } from "../layout/PanelSection.jsx";
import { Button } from "../common/Button.jsx";
import { DocumentSearch } from "./DocumentSearch.jsx";
import { DocumentList } from "./DocumentList.jsx";
import { ImportButton } from "./ImportButton.jsx";
import { useResearch } from "../../hooks/useResearch.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import "./DocumentSidebar.css";

export function DocumentSidebar() {
  const {
    documents,
    status,
    error,
    selectedDocumentId,
    selectDocument,
    createDocument,
    updateDocument,
    duplicateDocument,
    deleteDocument,
  } = useResearch();

  const [query, setQuery] = useState("");
  const [importError, setImportError] = useState(null);
  const debouncedQuery = useDebounce(query, 200);

  const filteredDocuments = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q),
    );
  }, [documents, debouncedQuery]);

  async function handleNewDocument() {
    const doc = await createDocument({
      title: "Untitled document",
      type: "txt",
      content: "",
    });
    selectDocument(doc.id);
  }

  return (
    <PanelSection
      title="Documents"
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNewDocument}
          >
            New
          </Button>
          <ImportButton onImport={createDocument} onError={setImportError} />
        </>
      }
    >
      <DocumentSearch value={query} onChange={setQuery} />

      {importError ? (
        <div className="doc-sidebar__import-error" role="alert">
          <span>{importError}</span>
          <button
            type="button"
            onClick={() => setImportError(null)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ) : null}

      <DocumentList
        documents={filteredDocuments}
        status={status}
        error={error}
        selectedDocumentId={selectedDocumentId}
        onSelect={selectDocument}
        onRename={(id, title) => updateDocument(id, { title })}
        onDuplicate={duplicateDocument}
        onDelete={deleteDocument}
        hasQuery={debouncedQuery.trim().length > 0}
      />
    </PanelSection>
  );
}
