import "./SearchInput.css";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label,
}) {
  return (
    <input
      type="search"
      className="search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label ?? placeholder}
    />
  );
}
