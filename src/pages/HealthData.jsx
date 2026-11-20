import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import PageIntro from "../components/PageIntro";
import DemoBadge from "../components/DemoBadge";
import Tile from "../components/Tile";
import LabelChip from "../components/LabelChip";
import ErrorBox from "../components/ErrorBox";
import { SkeletonBlock } from "../components/Skeleton";
import { areaLabel, formatNumber, levelLabel } from "../utils/format";

const placeLabel = (p, dupes) => (dupes.has(p.name) ? `${p.name} · ${p.segment}` : p.name);

export default function HealthData() {
  const places = useApi(() => api.places(), []);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!selectedId && places.data?.length) setSelectedId(places.data[0].id);
  }, [places.data, selectedId]);

  const detail = useApi(() => (selectedId ? api.place(selectedId) : Promise.resolve(null)), [selectedId]);
  const d = detail.data;

  // Names that appear more than once (e.g. Abuja) get their segment added so chips stay unique.
  const dupes = useMemo(() => {
    const count = {};
    (places.data || []).forEach((p) => { count[p.name] = (count[p.name] || 0) + 1; });
    return new Set(Object.keys(count).filter((k) => count[k] > 1));
  }, [places.data]);

  const chart = useMemo(
    () => (places.data || []).map((p) => ({ id: p.id, name: placeLabel(p, dupes), value: p.protein_deficiency })),
    [places.data, dupes]
  );

  return (
    <>
      <PageIntro eyebrow="Health & nutrition" title="Health data by place" right={<DemoBadge>Place values are demonstration data</DemoBadge>}>
        Where protein deficiency is reported, where colorectal cancer and processed-meat intake are high, and how many people live there.
      </PageIntro>

      <ErrorBox message={places.error} onRetry={places.reload} />

      <div className="pill-tabs" role="tablist" aria-label="Places">
        {places.loading && !places.data ? <span className="muted">Loading places…</span> : null}
        {(places.data || []).map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={selectedId === p.id} className={selectedId === p.id ? "active" : ""} onClick={() => setSelectedId(p.id)}>
            {placeLabel(p, dupes)}
          </button>
        ))}
      </div>

      <ErrorBox message={detail.error} onRetry={detail.reload} />

      {!d && (detail.loading || places.loading) ? (
        <div className="tiles four"><SkeletonBlock height={110} /><SkeletonBlock height={110} /><SkeletonBlock height={110} /><SkeletonBlock height={110} /></div>
      ) : d ? (
        <>
          <div className={`tiles four ${detail.loading ? "is-updating" : ""}`}>
            <Tile label="Population" value={formatNumber(d.population)} sub="NBS estimate · verify year" />
            <Tile label="Area type" value={areaLabel(d.area_type)} sub={d.state ? `${d.state} State` : ""} />
            <Tile label="Demand signal" value={`${d.demand ?? "—"}/100`} sub="Surveys + interviews"><LabelChip label={d.label_demand} /></Tile>
            <Tile label="Alt-protein businesses" value={`${d.registered ?? "—"}`} sub={`registered of ${d.capacity ?? "—"} slots`} />
          </div>

          <div className="two-col">
            <section className="panel">
              <h3 className="panel-title">Protein deficiency <span className="place-tag">{placeLabel(d, dupes)}</span></h3>
              <div className="highlight">
                <div>
                  <span>Protein deficiency index</span>
                  <b>{d.protein_deficiency ?? "No data"}</b>
                  <small>0–100</small>
                  <LabelChip label={d.label_health} />
                </div>
              </div>
              <h4>Protein deficiency index, all places</h4>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={Math.max(220, chart.length * 30)}>
                  <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E6EBE7" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: "#3d4a43" }} />
                    <Tooltip cursor={{ fill: "rgba(27,127,76,0.06)" }} formatter={(v) => [v ?? "No data", "Index"]} />
                    <Bar dataKey="value" radius={[0, 5, 5, 0]} label={{ position: "right", fontSize: 11, fill: "#3d4a43" }}>
                      {chart.map((c) => <Cell key={c.id} fill={c.id === selectedId ? "#1B7F4C" : "#9CC9B0"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="context-box">
                <b>National context</b>
                <p>45% of Nigerians do not eat protein daily; average intake is 45.4 g a day against an FAO minimum of 53.8 g. Nigerian Protein Deficiency Report, Ipsos, 2020 · national survey, never shown as a local figure.</p>
              </div>
            </section>

            <section className="panel">
              <h3 className="panel-title">Colorectal cancer &amp; processed meat <span className="place-tag">{placeLabel(d, dupes)}</span></h3>
              <div className="highlight purple">
                <div>
                  <span>Colorectal cancer index</span>
                  <b className={d.crc_index === null || d.crc_index === undefined ? "smaller" : ""}>{d.crc_index ?? "No data"}</b>
                  <small>{d.crc_index === null || d.crc_index === undefined ? "No registry data for this place" : "0–100 · registry + processed-meat intake"}</small>
                </div>
              </div>
              <div className="who-box">
                <b>What WHO says</b>
                <p>WHO’s cancer agency (IARC) classifies processed meat as carcinogenic to humans (Group 1) and red meat as probably carcinogenic (Group 2A), mainly linked to colorectal cancer. IARC Monographs, 2015.</p>
                <small>This is not saying all animal protein is unsafe, or that alt-protein prevents cancer.</small>
              </div>
              {d.notes && <p className="notes"><b>Notes:</b> {d.notes}</p>}
              <h4>Sources for this place</h4>
              <ul className="source-list">
                {(d.sources || []).map((s) => (
                  <li key={s.id}>
                    <span className="chip">{levelLabel(s.level)}</span>
                    <span>{s.title} · {s.publisher}{s.year ? `, ${s.year}` : ""}</span>
                    {s.url && <a href={s.url} target="_blank" rel="noreferrer" aria-label={`Open ${s.title}`}><ExternalLink size={13} /></a>}
                  </li>
                ))}
                {(!d.sources || d.sources.length === 0) && <li className="muted">No sources listed.</li>}
              </ul>
            </section>
          </div>
        </>
      ) : null}

      <section className="panel">
        <h3 className="section-label">What data we actually have</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Place</th><th>Demand</th><th>Health need</th><th>Meat cost</th><th>Cancer data</th><th>Population</th></tr>
            </thead>
            <tbody>
              {(places.data || []).map((p) => (
                <tr key={p.id} className={p.id === selectedId ? "row-selected" : ""}>
                  <td><b>{placeLabel(p, dupes)}</b></td>
                  <td><LabelChip label={p.label_demand} /></td>
                  <td><LabelChip label={p.label_health} /></td>
                  <td><LabelChip label={p.label_meat_cost} /></td>
                  <td>{p.crc_index === null || p.crc_index === undefined ? <LabelChip label="missing" /> : <span className="chip label-registry">Registry-based</span>}</td>
                  <td>{formatNumber(p.population)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dark-note">
        <ShieldCheck size={18} /> Health data shows where a need has been reported. It is not proof people will buy and not a diagnosis.
        All data is grouped by place, never by person. National figures are never shown as local ones.
      </div>
    </>
  );
}
