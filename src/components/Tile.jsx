export default function Tile({ label, value, sub, tone, children }) {
  return (
    <div className={`tile ${tone ? `tone-${tone}` : ""}`}>
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      {sub && <small>{sub}</small>}
      {children}
    </div>
  );
}
