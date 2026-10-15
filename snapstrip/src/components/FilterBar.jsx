import { CAMERA_FILTERS, filterToCss } from "../utils/cameraFilters";
import "./FilterBar.css";

function FilterBar({ active, onChange, disabled = false }) {
  return (
    <div
      className="filter-bar"
      role="listbox"
      aria-label="Camera filters"
    >
      {CAMERA_FILTERS.map((filter, index) => (
        <button
          key={filter.id}
          role="option"
          aria-selected={active === filter.id}
          className={
            active === filter.id
              ? "filter-chip active"
              : "filter-chip"
          }
          style={{ "--i": index }}
          onClick={() => onChange(filter.id)}
          disabled={disabled}
        >
          <span
            className="filter-swatch"
            style={{ filter: filterToCss(filter) }}
          >
            {filter.tint && (
              <i style={{ background: filter.tint }} />
            )}
          </span>

          <span className="filter-name">
            {filter.name}
          </span>
        </button>
      ))}
    </div>
  );
}

export default FilterBar;
