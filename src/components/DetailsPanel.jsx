import { Link } from "react-router-dom";
import { Download, Megaphone, CirclePlus } from "lucide-react";
import ConfidenceChip from "./ConfidenceChip";
import LabelChip from "./LabelChip";
import StatusChip from "./StatusChip";
import { areaLabel, channelLabel, clamp } from "../utils/format";

/** Right-hand panel for the selected /rank item. */
export default function DetailsPanel({ item, onClaim, claiming, onDownload }) {
  if (!item) {
    return <aside className="details-panel empty-state">Pick a place on the left to see why it ranks there.</aside>;
  }
  const s = item.scores || {};
  const cap = item.capacity || {};
  const e = item.explanation || {};
  const labels = item.labels || {};
  const used = cap.capacity ? clamp((cap.registered / cap.capacity) * 100) : 0;

  return (
    <aside className="details-panel" aria-live="polite">
      <div className="detail-kicker">
        <span className="rank-pill">#{item.rank} for you</span>
        <span className={`area-tag ${item.is_rural ? "rural" : ""}`}>{item.is_rural ? "Rural · viable" : areaLabel(item.area_type)}</span>
      </div>
      <h2>{item.name}</h2>
      <p className="muted">{item.segment} · {channelLabel(item.channel)}</p>

      <div className="score-tiles">
        <div className="score-tile tone-blue"><span>Demand</span><b>{s.demand ?? "—"}</b><LabelChip label={labels.demand} /></div>
        <div className="score-tile tone-green"><span>Health need</span><b>{s.health ?? "—"}</b><LabelChip label={labels.health} /></div>
        <div className="score-tile tone-orange"><span>Meat cost</span><b>{s.affordability ?? "—"}</b><LabelChip label={labels.affordability} /></div>
      </div>

      <div className="total-line">
        <span>Total score</span>
        <b>{s.total ?? "—"}</b>
        {s.low !== undefined && s.high !== undefined && <small>range {s.low}–{s.high}</small>}
      </div>

      <div className="explain">
        <p><b className="blue-text">Demand:</b> {e.demand || "—"}</p>
        <p><b className="green-text">Health:</b> {e.health || "—"}</p>
        <p><b className="orange-text">Meat cost:</b> {e.affordability || "—"}</p>
      </div>

      <div className="detail-meta">
        <span>Confidence</span>
        <ConfidenceChip confidence={item.confidence} />
      </div>
      {e.uncertain && <p className="uncertain">{e.uncertain}</p>}

      <div className="capacity-block">
        <div className="detail-meta">
          <span>Market space</span>
          <b>
            {cap.registered ?? "—"} of {cap.capacity ?? "—"} businesses · {cap.slots_left ?? "—"} slot{cap.slots_left === 1 ? "" : "s"} left
          </b>
        </div>
        <div className={`capacity-track status-${cap.status}`}><i style={{ width: `${used}%` }} /></div>
        {cap.status && cap.status !== "open" && <StatusChip status={cap.status} />}
      </div>

      {e.test_first && <div className="test-box"><b>Test first:</b> {e.test_first}</div>}

      <div className="button-row">
        <button type="button" className="primary-btn" onClick={onClaim} disabled={claiming || cap.status === "full"}>
          <CirclePlus size={17} /> {claiming ? "Claiming…" : "Claim a slot"}
        </button>
        <Link className="secondary-btn" to={`/discover/${encodeURIComponent(item.id)}`}>
          <Megaphone size={17} /> Plan awareness
        </Link>
      </div>
      <button type="button" className="download-link" onClick={onDownload}>
        <Download size={14} /> Download brief for this market
      </button>
    </aside>
  );
}
