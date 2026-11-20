export default function ConfidenceChip({ confidence }) {
  if (!confidence) return null;
  const label = confidence.label || "medium";
  return (
    <span className={`chip conf-${label}`}>
      {confidence.pct !== undefined && confidence.pct !== null ? `${Math.round(confidence.pct)}% · ` : ""}
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}
