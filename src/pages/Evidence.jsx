import { ExternalLink, Network, SlidersHorizontal, Activity, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import PageIntro from "../components/PageIntro";
import DemoBadge from "../components/DemoBadge";
import ErrorBox from "../components/ErrorBox";
import { SkeletonRows } from "../components/Skeleton";
import { levelLabel } from "../utils/format";

// Interview quotes come from the team (hard-coded is fine per the spec). Replace the placeholders.
const QUOTES = [
  { text: "[Quote from campus akara vendor]", by: "Campus akara vendor · used with permission" },
  { text: "[Quote from a student on how often they eat meat]", by: "300-level student · used with permission" },
  { text: "[Quote from a canteen owner on protein prices]", by: "Campus canteen owner · used with permission" },
];

const METHODS = [
  { icon: Network, title: "Clustering", desc: "k-means groups locations into 3 market types. Silhouette score: [VALUE]." },
  { icon: SlidersHorizontal, title: "Scoring", desc: "3 checks — demand, health need, meat cost — weighted Low / Medium / High by you." },
  { icon: Activity, title: "Simulation", desc: "1,000 runs with prices, inputs and weights varied. Seed 42, so results repeat." },
  { icon: CheckCircle2, title: "Tests passed", desc: "[N] of [N] unit and behaviour tests, e.g. a crowded market drops when supply rises." },
];

const LIMITS = [
  "Scores rank markets; they are not sales forecasts.",
  "Prices change monthly; results are as of the price month shown.",
  "Cancer registries cover few cities; most places have no cancer data.",
  "Capacity per place is an estimate, recalculated monthly.",
  "Interviews come from a small group on one campus.",
  "Health data is context, not proof people will buy. No product claims to prevent or treat disease.",
];

const NEXT = [
  "Pilot with 3–5 real producers running the recommended tests.",
  "Monthly price updates from NBS releases.",
  "Live business registrations and NAFDAC verification.",
  "Views for NGOs, school feeding programmes and farmers.",
];

export default function Evidence() {
  const sources = useApi(() => api.sources(), []);

  return (
    <>
      <PageIntro eyebrow="Transparency & methodology" title="Where every number comes from" right={<DemoBadge />}>
        Street evidence from our campus interviews, the datasets behind each score, and how the model was checked.
      </PageIntro>

      <div className="section-label">From the street · interviews, Veritas University, 20 Nov 2026</div>
      <div className="three-col">
        {QUOTES.map((q) => (
          <div className="panel quote-card" key={q.text}>
            <span className="quote-mark">“</span>
            <p>{q.text}</p>
            <small>{q.by}</small>
          </div>
        ))}
      </div>

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
                    <td><span className="chip">{levelLabel(s.level)}</span></td>
                    <td>{s.url ? <a href={s.url} target="_blank" rel="noreferrer" aria-label={`Open ${s.title}`}><ExternalLink size={14} /></a> : null}</td>
                  </tr>
                ))}
                {sources.data && sources.data.length === 0 && <tr><td colSpan={7} className="muted">No sources yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="section-label">How the AI works, and how we checked it</div>
      <div className="four-col">
        {METHODS.map(({ icon: Icon, title, desc }) => (
          <div className="panel method-card" key={title}>
            <span className="method-icon"><Icon size={20} /></span>
            <b>{title}</b>
            <p>{desc}</p>
          </div>
        ))}
      </div>

      <div className="panel two-col-inner">
        <div>
          <h3 className="panel-title">What this tool cannot claim</h3>
          <ul className="plain-list">{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
        <div>
          <h3 className="panel-title">Next steps</h3>
          <ol className="plain-list">{NEXT.map((l) => <li key={l}>{l}</li>)}</ol>
        </div>
      </div>

      <p className="disclaimer">
        AI and data disclosure: scikit-learn (clustering), NumPy (simulation); any language model only rewords pre-computed results and never adds numbers.
        An AI coding assistant helped write code and documents; all output was run and checked by the team.
      </p>
    </>
  );
}
