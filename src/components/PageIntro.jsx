/** Page title + one line of intro. (The old uppercase "eyebrow" label is gone.) */
export default function PageIntro({ title, children, right }) {
  return (
    <div className="page-intro">
      <div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {right && <div className="page-intro-right">{right}</div>}
    </div>
  );
}