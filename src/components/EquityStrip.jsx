import Toggle from "./Toggle";

/** Shows the equity object exactly as /rank returns it, plus the fair-share switch. */
export default function EquityStrip({ equity, fairShare, onFairShare, hiddenCount, onWhy }) {
  const balanced = !!equity?.balanced;
  return (
    <div className="equity-row">
      <div className={`equity-pill ${balanced ? "good" : "warn"}`}>
        {equity ? (
          <span>
            <b>{equity.rural_in_top5} of your top 5</b> are rural (aim: {equity.target ?? 2} or more)
          </span>
        ) : (
          <span>Rural share</span>
        )}
      </div>
      <Toggle checked={fairShare} onChange={onFairShare} label="Fair share" id="fair-share" />
      <span className="muted small">
        {hiddenCount} full place{hiddenCount === 1 ? "" : "s"} hidden ·{" "}
        <button type="button" className="text-button" onClick={onWhy}>why?</button>
      </span>
    </div>
  );
}