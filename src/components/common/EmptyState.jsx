import "./EmptyState.css";

/**
 * Reusable "nothing here yet" panel. Used instead of leaving blank space
 * whenever a list/panel has no data — search results, document list,
 * AI history, etc.
 */
export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {description ? (
        <p className="empty-state__description">{description}</p>
      ) : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
