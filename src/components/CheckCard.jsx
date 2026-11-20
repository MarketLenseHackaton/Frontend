import Segmented from "./Segmented";
import { WEIGHT_LEVELS } from "../utils/format";

/** One of the 3 checks: Demand (blue), Health need (green), Affordability (orange). */
export default function CheckCard({ number, title, description, tone, weight, onWeight, children }) {
  return (
    <section className={`check-card tone-${tone}`}>
      <div className="check-title">
        <span className="check-number">{number}</span>
        <h3>{title}</h3>
      </div>
      <p>{description}</p>
      {children}
      <div className="check-weight">
        <span className="check-weight-label">How much does it matter?</span>
        <Segmented options={WEIGHT_LEVELS} value={weight} onChange={onWeight} tone={tone} ariaLabel={`${title} weight`} />
      </div>
    </section>
  );
}
