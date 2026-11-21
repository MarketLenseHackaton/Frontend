import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import PageIntro from "../components/PageIntro";
import DemoBadge from "../components/DemoBadge";
import ErrorBox from "../components/ErrorBox";
import { SkeletonRows } from "../components/Skeleton";
import { levelLabel } from "../utils/format";

// Real interview quotes go here once the team has them. Leave the list empty to hide the section.
const QUOTES = [];

const METHODS = [
  { title: "Market types", desc: "k-means grouped all 37 states into 2 market types with no labels given: high need and price-squeezed, or processed-meat heavy. Silhouette score 0.42." },
  { title: "Scoring", desc: "Demand, health need and meat cost, each weighted Low, Medium or High by the business." },
  { title: "Confidence", desc: "Each ranking is re-run 1,000 times with the inputs and weights shifted a little. Seed 42, so results repeat." },
  { title: "Tests", desc: "42 automated tests pass, e.g. a full place is hidden, and fair share puts 2 rural places in the top 5." },
];

const LIMITS = [
  "Scores rank markets against each other. They are not sales forecasts.",
  "Meat prices are by zone (NBS, May 2026), not by city.",
  "Protein need is estimated from child mortality and poverty until NDHS stunting data is added.",
  "The cancer signal counts processed-meat outlets on OpenStreetMap. It is not a cancer registry.",
  "Interviews come from a small group on one campus.",
  "No product here claims to prevent or treat disease.",
];

const NEXT = [
  "Pilot with 3 to 5 producers running the suggested tests.",
  "Monthly price updates from NBS.",
  "Live business sign-up with NAFDAC checks.",
  "Views for NGOs, school feeding programmes and farmers.",
];

export default function Evidence() {
  const sources = useApi(() => api.sources(), []);

  return (
    <>
      <PageIntro title="Where the numbers come from" right={<DemoBadge />}>
        The datasets behind each score, how the model works, and what it can't tell you.
      </PageIntro>

      {QUOTES.length > 0 && (
        <>
          <div className="section-label">From our interviews</div>
          <div className="three-col">
            {QUOTES.map((q) => (
              <div className="panel" key={q.text}>
                <p>“{q.text}”</p>
                <small className="muted">{q.by}</small>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-label">Sources</div>
      <ErrorBox message={sources.error} onRetry={sources.reload} />
      <section className="panel">
        {sources.loading && !sources.data ? (
          <SkeletonRows rows={5} height={40} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>ID</th><th>Source</th><th>Publisher</th><th>Used for</th><th>Year</th><th>Level</th><th /></tr></thead>
              <tbody>
                {(sources.data || []).map((s) => (
                  <tr key={s.id}>
                    <td className="muted">{s.id}</td>
                    <td><b>{s.title}</b></td>
                    <td>{s.publisher}</td>
                    <td>{s.used_for}</td>
                    <td>{s.year}</td>
                    <td>{levelLabel(s.level)}</td>
                    <td>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">Open</a> : null}</td>
                  </tr>
                ))}
                {sources.data && sources.data.length === 0 && <tr><td colSpan={7} className="muted">No sources yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="section-label">How the model works</div>
      <div className="four-col">
        {METHODS.map(({ title, desc }) => (
          <div className="panel method-card" key={title}>
            <b>{title}</b>
            <p>{desc}</p>
          </div>
        ))}
      </div>

      <div className="panel two-col-inner">
        <div>
          <h3 className="panel-title">Limits</h3>
          <ul className="plain-list">{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
        <div>
          <h3 className="panel-title">Next</h3>
          <ol className="plain-list">{NEXT.map((l) => <li key={l}>{l}</li>)}</ol>
        </div>
      </div>

      <p className="disclaimer">
        Built with scikit-learn (clustering) and NumPy (simulation). An AI coding assistant helped write code and documents; the team ran and checked all of it.
      </p>
    </>
  );
} 