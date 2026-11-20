import { clamp } from "../utils/format";

export default function ScoreBar({ label, value, tone }) {
  const v = value === null || value === undefined ? null : clamp(value);
  return (
    <div className={`scorebar tone-${tone}`}>
      <span>{label}</span>
      <div className="track"><i style={{ width: `${v ?? 0}%` }} /></div>
      <b>{v === null ? "—" : Math.round(value)}</b>
    </div>
  );
}
