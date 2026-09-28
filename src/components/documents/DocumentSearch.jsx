import { SearchInput } from "../common/SearchInput.jsx";
import "./DocumentSearch.css";

export function DocumentSearch({ value, onChange }) {
  return (
    <div className="doc-search">
      <SearchInput
        value={value}
        onChange={onChange}
        placeholder="Search documents…"
      />
    </div>
  );
}
