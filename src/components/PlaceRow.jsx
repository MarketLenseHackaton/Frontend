import ScoreBar from "./ScoreBar";
import { areaLabel, channelLabel } from "../utils/format";

/** One row of the ranked list. Everything shown comes straight from the /rank item. */
export default function PlaceRow({ item, selected, onSelect }) {
  const top5 = item.rank <= 5;
  return (
    <button
      type="button"
      className={`place-row ${selected ? "chosen" : ""} ${top5 ? "top5" : "rest"}`}
      onClick={() => onSelect(item.id)}
      aria-pressed={selected}
    >
      <span className={`rank ${item.rank === 1 ? "first" : ""}`}>{item.rank}</span>
      <span className="place-name">
        <span className="place-title">
          <b>{item.name}</b>
          <span className={`area-tag ${item.is_rural ? "rural" : ""}`}>{areaLabel(item.area_type)}</span>
          {item.fair_share_added && <span className="area-tag fair">added by fair share</span>}
        </span>
        <em>{item.segment} · {channelLabel(item.channel)}</em>
      </span>
      <span className="mini-bars">
        <ScoreBar label="Demand" value={item.scores?.demand} tone="blue" />
        <ScoreBar label="Health" value={item.scores?.health} tone="green" />
        <ScoreBar label="Meat cost" value={item.scores?.affordability} tone="orange" />
      </span>
      <strong className="place-score">
        {item.scores?.total ?? "—"}
        <small>/ 100</small>
      </strong>
    </button>
  );
}