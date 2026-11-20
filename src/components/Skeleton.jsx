export function SkeletonRows({ rows = 5, height = 92 }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}
export function SkeletonBlock({ height = 160 }) {
  return <div className="skeleton" style={{ height }} aria-busy="true" />;
}
