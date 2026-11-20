/** Data honesty label: measured / estimated / assumed (or any text, e.g. "Missing"). */
export default function LabelChip({ label }) {
  const key = String(label || "missing").toLowerCase();
  const text = label ? key.charAt(0).toUpperCase() + key.slice(1) : "Missing";
  return <span className={`chip label-${key}`}>{text}</span>;
}
