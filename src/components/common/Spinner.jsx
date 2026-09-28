import "./Spinner.css";

/**
 * Generic inline spinner. Any operation expected to take longer than ~200ms
 * should render this (or a skeleton) rather than leave the UI static.
 */
export function Spinner({ size = 16, label }) {
  return (
    <span className="spinner-wrap" role="status">
      <span
        className="spinner"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label ? (
        <span className="spinner-label">{label}</span>
      ) : (
        <span className="visually-hidden">Loading</span>
      )}
    </span>
  );
}
