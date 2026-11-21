/** Places from `full` in /rank — never recommended to new businesses. */
export default function FullPlaces({ full }) {
  if (!full || full.length === 0) return null;
  return (
    <section className="full-box">
      <h3>Full, so not shown to new businesses</h3>
      <div className="full-list">
        {full.map((f) => (
          <div className="full-item" key={f.id}>
            <b>{f.name}</b>
            <span>{f.segment}</span>
            <small>{f.registered} of {f.capacity}</small>
          </div>
        ))}
      </div>
    </section>
  );
}