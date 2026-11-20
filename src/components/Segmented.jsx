/** A row of real <button>s; exactly one is selected. options: [{label, value}] */
export default function Segmented({ options, value, onChange, tone = "green", ariaLabel, small = false }) {
  return (
    <div className={`segmented tone-${tone} ${small ? "segmented--small" : ""}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "selected" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
