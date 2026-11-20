export default function PageIntro({ eyebrow, title, children, right }) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {right && <div className="page-intro-right">{right}</div>}
    </div>
  );
}
