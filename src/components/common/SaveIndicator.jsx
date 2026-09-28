import "./SaveIndicator.css";

const LABELS = { saving: "Saving…", saved: "Saved", error: "Save failed" };

export function SaveIndicator({ state }) {
  const label = LABELS[state];
  if (!label) return null;
  return (
    <span
      className={`save-indicator save-indicator--${state}`}
      aria-live="polite"
      role="status"
    >
      {label}
    </span>
  );
}
