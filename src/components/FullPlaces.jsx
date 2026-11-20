import { Lock } from "lucide-react";

/** Places from `full` in /rank — never recommended to new businesses. */
export default function FullPlaces({ full }) {
  if (!full || full.length === 0) return null;
  return (
    <section className="full-box">
      <h3><Lock size={16} /> Full places · not open to new businesses</h3>
      <div className="full-list">
        {full.map((f) => (
          <div className="full-item" key={f.id}>
            <Lock size={14} />
            <b>{f.name}</b>
            <span>{f.segment}</span>
            <small>{f.registered} of {f.capacity} businesses</small>
          </div>
        ))}
      </div>
    </section>
  );
}
