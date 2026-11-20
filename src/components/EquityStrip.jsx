import { Scale } from "lucide-react";
import Toggle from "./Toggle";

/** Shows the equity object exactly as /rank returns it, plus the fair-share switch. */
export default function EquityStrip({ equity, fairShare, onFairShare, hiddenCount, onWhy }) {
  const balanced = !!equity?.balanced;
  return (
    <div className="equity-row">
      <div className={`equity-pill ${balanced ? "good" : "warn"}`}>
        <Scale size={16} />
        <b>{equity ? (balanced ? "Balanced" : "Big cities only") : "Equity"}</b>
        {equity && (
          <span>
            {equity.rural_in_top5} of your top 5 are rural <small>(target {equity.target ?? 2}+)</small>
          </span>
        )}
      </div>
      <Toggle checked={fairShare} onChange={onFairShare} label="Fair-share mode" id="fair-share" />
      <span className="muted small">
        {hiddenCount} full place{hiddenCount === 1 ? "" : "s"} hidden ·{" "}
        <button type="button" className="text-button" onClick={onWhy}>why?</button>
      </span>
    </div>
  );
}
