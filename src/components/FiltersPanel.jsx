import { AMENITY_TYPES } from '../lib/amenities'

export default function FiltersPanel({ filters, onToggle, amenitiesWarning }) {
  return (
    <div className="filters-panel">
      <div className="filters-title">Filter op voorzieningen bij de laadpaal</div>
      <div className="filters-grid">
        {Object.entries(AMENITY_TYPES).map(([key, meta]) => (
          <label key={key} className={`filter-chip ${filters[key] ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={() => onToggle(key)}
            />
            <span className="filter-icon" aria-hidden="true">{meta.icon}</span>
            <span>{meta.label}</span>
          </label>
        ))}
      </div>
      {amenitiesWarning && <div className="search-hint error">{amenitiesWarning}</div>}
    </div>
  )
}
