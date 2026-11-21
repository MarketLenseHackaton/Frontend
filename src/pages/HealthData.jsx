import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
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
const hasValue = (v) => v !== null && v !== undefined && v !== "";

export default function HealthData() {
  const places = useApi(() => api.places(), []);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!selectedId && places.data?.length) setSelectedId(places.data[0].id);
  }, [places.data, selectedId]);

  const detail = useApi(() => (selectedId ? api.place(selectedId) : Promise.resolve(null)), [selectedId]);
  const d = detail.data;

  // Names that appear more than once (e.g. Abuja) get their segment added so tabs stay unique.
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
      <PageIntro title="Health data by place" right={<DemoBadge />}>
        Protein need, the processed-meat signal, and how many people live in each place.
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
            <Tile label="Population" value={formatNumber(d.population)} sub="US Census Bureau estimate" />
            <Tile label="Area type" value={areaLabel(d.area_type)} sub={d.state ? `${d.state} State` : ""} />
            <Tile label="Demand" value={`${d.demand ?? "—"}/100`} sub="Google Trends + interviews"><LabelChip label={d.label_demand} /></Tile>
            <Tile label="Alt-protein businesses" value={`${d.registered ?? "—"}`} sub={`of ${d.capacity ?? "—"} slots`} />
          </div>

          <div className="two-col">
            <section className="panel">
              <h3 className="panel-title">Protein need <span className="place-tag">{placeLabel(d, dupes)}</span></h3>
              <div className="highlight">
                <div>
                  <span>Protein need, 0 to 100</span>
                  <b>{d.protein_deficiency ?? "No data"}</b>
                  <LabelChip label={d.label_health} />
                </div>
              </div>
              <h4>All places</h4>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={Math.max(220, chart.length * 30)}>
                  <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke="#EEEEEA" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: "#44443F" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} formatter={(v) => [v ?? "No data", "Protein need"]} />
                    <Bar dataKey="value" radius={0} label={{ position: "right", fontSize: 11, fill: "#44443F" }}>
                      {chart.map((c) => <Cell key={c.id} fill={c.id === selectedId ? "#1B7F4C" : "#C9D6CD"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="muted small">
                Estimated from under-5 mortality and poverty (US Census Bureau) until NDHS stunting figures are added.
              </p>
            </section>

            <section className="panel">
              <h3 className="panel-title">Processed meat and colorectal cancer <span className="place-tag">{placeLabel(d, dupes)}</span></h3>
              <div className="highlight">
                <div>
                  <span>Processed-meat signal, 0 to 100</span>
                  <b className={hasValue(d.crc_index) ? "" : "smaller"}>{hasValue(d.crc_index) ? d.crc_index : "No data"}</b>
                  <small>{hasValue(d.crc_index) ? "Fast food, supermarket and butcher outlets per person, from OpenStreetMap" : "No outlet data for this place"}</small>
                </div>
              </div>
              <div className="who-box">
                <p>The WHO cancer agency (IARC) classifies processed meat as a cause of colorectal cancer (Group 1) and red meat as a probable cause (Group 2A). IARC Monographs, 2015.</p>
                <small>That does not make all animal protein unsafe, and no plant protein here claims to prevent cancer.</small>
              </div>
              {d.notes && <p className="notes">{d.notes}</p>}
              <h4>Sources for this place</h4>
              <ul className="source-list">
                {(d.sources || []).map((s) => (
                  <li key={s.id}>
                    <span className="muted">{levelLabel(s.level)}</span>
                    <span>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title} · {s.publisher}{s.year ? `, ${s.year}` : ""}</span>
                  </li>
                ))}
                {(!d.sources || d.sources.length === 0) && <li className="muted">No sources listed.</li>}
              </ul>
            </section>
          </div>
        </>
      ) : null}

      <section className="panel">
        <h3 className="section-label">How solid each number is</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Place</th><th>Demand</th><th>Health need</th><th>Meat cost</th><th>Processed-meat signal</th><th>Population</th></tr>
            </thead>
            <tbody>
              {(places.data || []).map((p) => (
                <tr key={p.id} className={p.id === selectedId ? "row-selected" : ""}>
                  <td><b>{placeLabel(p, dupes)}</b></td>
                  <td><LabelChip label={p.label_demand} /></td>
                  <td><LabelChip label={p.label_health} /></td>
                  <td><LabelChip label={p.label_meat_cost} /></td>
                  <td>{hasValue(p.crc_index) ? p.crc_index : <LabelChip label="missing" />}</td>
                  <td>{formatNumber(p.population)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="dark-note">
        Health data shows where a need is reported. It is not proof people will buy, and not a diagnosis. Everything is grouped by place, never by person.
      </p>
    </>
  );
}