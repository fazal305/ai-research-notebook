import "./PanelSection.css";

/**
 * Consistent "title bar + scrollable body" wrapper used by each of the
 * three workspace columns (documents, editor, AI analysis) so they share
 * the same header rhythm and spacing.
 */
export function PanelSection({ title, actions, children, className = "" }) {
  return (
    <div className={`panel-section ${className}`}>
      <div className="panel-section__header">
        <h2 className="panel-section__title">{title}</h2>
        {actions ? (
          <div className="panel-section__actions">{actions}</div>
        ) : null}
      </div>
      <div className="panel-section__body scrollable">{children}</div>
    </div>
  );
}
