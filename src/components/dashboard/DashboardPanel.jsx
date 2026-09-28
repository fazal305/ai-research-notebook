import { StatTile } from "./StatTile.jsx";
import { EmptyState } from "../common/EmptyState.jsx";
import { Spinner } from "../common/Spinner.jsx";
import { useDashboardStats } from "../../hooks/useDashboardStats.js";
import { useResearch } from "../../hooks/useResearch.js";
import { formatRelativeTime } from "../../utils/fileUtils.js";
import { OPERATION_LABELS } from "../../services/ai/constants.js";
import "./DashboardPanel.css";

/**
 * Shown in the workspace when no document is selected — real numbers
 * derived from IndexedDB, not placeholder/demo data.
 */
export function DashboardPanel() {
  const { documents, selectDocument } = useResearch();
  const stats = useDashboardStats(documents);

  if (stats.status === "loading") {
    return (
      <div className="dashboard-panel__loading">
        <Spinner label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div className="dashboard-panel scrollable">
      <h2 className="dashboard-panel__heading">Research Dashboard</h2>

      <div className="dashboard-panel__stats">
        <StatTile label="Documents" value={stats.documentCount} />
        <StatTile label="Notes" value={stats.noteCount} />
        <StatTile label="AI Analyses" value={stats.aiAnalysisCount} />
        <StatTile label="Words" value={stats.totalWords} />
      </div>

      <section className="dashboard-panel__section">
        <h3>Recent Documents</h3>
        {stats.recentDocuments.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Create or import a document to get started."
          />
        ) : (
          <ul className="dashboard-list">
            {stats.recentDocuments.map((doc) => (
              <li key={doc.id}>
                <button type="button" onClick={() => selectDocument(doc.id)}>
                  <span className="dashboard-list__title">{doc.title}</span>
                  <span className="dashboard-list__meta">
                    {formatRelativeTime(doc.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-panel__section">
        <h3>Recent AI Analyses</h3>
        {stats.recentAnalyses.length === 0 ? (
          <EmptyState
            title="No analyses yet"
            description="Results from AI tools will appear here."
          />
        ) : (
          <ul className="dashboard-list">
            {stats.recentAnalyses.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() =>
                    entry.documentId && selectDocument(entry.documentId)
                  }
                  disabled={!entry.documentId}
                >
                  <span className="dashboard-list__title">
                    {OPERATION_LABELS[entry.operation] ?? entry.operation}
                    <span className="dashboard-list__subtitle">
                      {" "}
                      · {entry.documentTitle ?? "Untitled document"}
                    </span>
                  </span>
                  <span className="dashboard-list__meta">
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-panel__section">
        <h3>Most Used Topics</h3>
        {stats.mostUsedTopics.length === 0 ? (
          <EmptyState
            title="No topics yet"
            description="Run Key Concepts on a few documents to see your most common topics here."
          />
        ) : (
          <ul className="dashboard-panel__topics">
            {stats.mostUsedTopics.map((topic) => (
              <li key={topic.term} className="dashboard-panel__topic">
                {topic.term}
                <span className="dashboard-panel__topic-count">
                  {topic.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
