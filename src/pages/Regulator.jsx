import { useState } from "react";
import { ShieldAlert, ExternalLink, Minus, Plus } from "lucide-react";
import { api, friendlyError } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/Toast";
import PageIntro from "../components/PageIntro";
import DemoBadge from "../components/DemoBadge";
import Tile from "../components/Tile";
import StatusChip from "../components/StatusChip";
import ScoreBar from "../components/ScoreBar";
import ErrorBox from "../components/ErrorBox";
import { SkeletonBlock, SkeletonRows } from "../components/Skeleton";
import { areaLabel, clamp, needLabel } from "../utils/format";

const FILTERS = [
  { label: "All", test: () => true },
  { label: "Open", test: (p) => p.status === "open" },
  { label: "Nearly full", test: (p) => p.status === "nearly_full" },
  { label: "Full", test: (p) => p.status === "full" },
  { label: "Rural", test: (p) => p.area_type === "rural" },
];

export default function Regulator() {
  const toast = useToast();
  const overview = useApi(() => api.regulator(), []);
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState(null);
  const o = overview.data;

  async function change(place, delta) {
    const next = place.capacity + delta;
    if (next < 1) return;
    setBusy(place.id);
    try {
      await api.setCapacity(place.id, next);
      await overview.reload({ quiet: true }); // re-fetch so counts, status and equity all come from the backend
      toast(`${place.name}: capacity set to ${next}.`);
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setBusy(null);
    }
  }

  const rows = (o?.places || []).filter(FILTERS.find((f) => f.label === filter).test);
  const c = o?.counts || {};

  return (
    <div className="regulator">
      <PageIntro eyebrow="Regulator & association view" title="Market balance across Nigeria" right={<DemoBadge />}>
        Each place gets a number of business slots based on its population, demand and health need. When a place is full, MarketLens stops
        showing it to new businesses so they spread to other places, rural areas included.
      </PageIntro>

      <ErrorBox message={overview.error} onRetry={overview.reload} />

      {!o && overview.loading ? (
        <div className="tiles four"><SkeletonBlock height={110} /><SkeletonBlock height={110} /><SkeletonBlock height={110} /><SkeletonBlock height={110} /></div>
      ) : o ? (
        <div className="tiles four">
          <Tile label="Businesses on MarketLens" value={c.businesses ?? "—"} sub={`across ${c.places ?? "—"} places`} />
          <Tile label="Places open" value={c.open ?? "—"} sub={`${c.nearly_full ?? 0} nearly full`} />
          <Tile label="Places full" value={c.full ?? "—"} sub="hidden from new businesses" />
          <Tile label="Equity score" value={`${o.equity?.score ?? "—"}/100`} sub={o.equity?.score < 50 ? "Businesses bunched in big cities" : "Businesses fairly spread"} tone="navy" />
        </div>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <h3 className="panel-title">Capacity by place</h3>
          <div className="pill-tabs compact">
            {FILTERS.map((f) => (
              <button type="button" key={f.label} className={filter === f.label ? "active" : ""} onClick={() => setFilter(f.label)}>{f.label}</button>
            ))}
          </div>
        </div>
        {!o && overview.loading ? (
          <SkeletonRows rows={5} height={48} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Place</th><th>Area</th><th>Health need</th><th>Demand</th><th>Businesses</th><th>Space used</th><th>Status</th><th>Capacity</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const used = p.capacity ? clamp((p.registered / p.capacity) * 100) : 0;
                  return (
                    <tr key={p.id} className={busy === p.id ? "is-updating" : ""}>
                      <td><b>{p.name}</b></td>
                      <td>{areaLabel(p.area_type)}</td>
                      <td>{needLabel(p.health_need)}</td>
                      <td>{p.demand}</td>
                      <td>{p.registered} / {p.capacity}</td>
                      <td><div className={`capacity-track status-${p.status}`}><i style={{ width: `${used}%` }} /></div></td>
                      <td><StatusChip status={p.status} /></td>
                      <td>
                        <div className="capacity-controls">
                          <button type="button" aria-label={`Lower capacity of ${p.name}`} onClick={() => change(p, -1)} disabled={busy !== null || p.capacity <= 1}><Minus size={16} /></button>
                          <b>{p.capacity}</b>
                          <button type="button" aria-label={`Raise capacity of ${p.name}`} onClick={() => change(p, +1)} disabled={busy !== null}><Plus size={16} /></button>
                        </div>
                        {p.suggested_capacity !== undefined && p.suggested_capacity !== p.capacity && (
                          <small className="muted">suggested {p.suggested_capacity}</small>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={8} className="muted">No places match this filter.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">Suggested capacity comes from population, demand and health need, recalculated monthly. A regulator can adjust it; every change is logged.</p>
      </section>

      {o && (
        <div className="two-col">
          <section className="panel">
            <h3 className="panel-title">Where businesses are vs where need is</h3>
            {(o.equity?.by_area || []).map((a) => (
              <div className="distribution" key={a.area}>
                <b>{areaLabel(a.area)}</b>
                <ScoreBar label="Businesses" value={a.business_pct} tone="navy" />
                <ScoreBar label="Health need" value={a.need_pct} tone="green" />
              </div>
            ))}
            <p className="muted small">Bars show share of businesses vs share of need (%). When business share is much higher than need share, MarketLens nudges new businesses toward places with bigger need.</p>
          </section>
          <section className="panel">
            <h3 className="panel-title">NAFDAC &amp; food safety</h3>
            {o.missing_nafdac > 0 && (
              <div className="alert-box">
                <ShieldAlert size={20} />
                <span><b>{o.missing_nafdac} business{o.missing_nafdac === 1 ? "" : "es"}</b> have not added a NAFDAC registration number. They can browse, but can’t claim a slot until verified.</span>
              </div>
            )}
            <h4>Latest official notices</h4>
            {(o.nafdac_notices || []).map((n, i) => (
              <div className="notice" key={i}>
                <b>NAFDAC</b>
                <span>{n.title} · {n.date}</span>
                {n.url && <a href={n.url} target="_blank" rel="noreferrer" aria-label="Open notice"><ExternalLink size={14} /></a>}
              </div>
            ))}
            {(!o.nafdac_notices || o.nafdac_notices.length === 0) && <p className="muted small">No notices.</p>}
            <p className="muted small">Only official notices are shown, each with its date and source.</p>
          </section>
        </div>
      )}

      <p className="disclaimer">MarketLens does not legally stop a business from entering a place. It decides what it recommends, and gives regulators and associations a shared view of balance.</p>
    </div>
  );
}
