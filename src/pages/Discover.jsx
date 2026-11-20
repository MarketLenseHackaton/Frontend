import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, Utensils } from "lucide-react";
import { api, friendlyError } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useToast } from "../components/Toast";
import PageIntro from "../components/PageIntro";
import DemoBadge from "../components/DemoBadge";
import Segmented from "../components/Segmented";
import Tile from "../components/Tile";
import ErrorBox from "../components/ErrorBox";
import { SkeletonBlock } from "../components/Skeleton";
import { channelLabel, effortLabel, gapLabel, lensLabel, pct } from "../utils/format";

const LIKED = [{ label: "Yes", value: "yes" }, { label: "It was okay", value: "okay" }, { label: "No", value: "no" }];
const COOK = [{ label: "Yes", value: "yes" }, { label: "Not sure", value: "not_sure" }, { label: "No", value: "no" }];
const BUY = [{ label: "Yes", value: "yes" }, { label: "Maybe", value: "maybe" }, { label: "No", value: "no" }];
const GAP_WIDTH = { low: 30, medium: 58, high: 85 };

export default function Discover() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const places = useApi(() => api.places(), []);

  // /discover with no id → go to the first place.
  useEffect(() => {
    if (!id && places.data?.length) navigate(`/discover/${encodeURIComponent(places.data[0].id)}`, { replace: true });
  }, [id, places.data, navigate]);

  const plan = useApi(() => (id ? api.discover(id) : Promise.resolve(null)), [id]);
  const p = plan.data;

  const [done, setDone] = useState({});
  const [liked, setLiked] = useState("yes");
  const [canCook, setCanCook] = useState("yes");
  const [wouldBuy, setWouldBuy] = useState("maybe");
  const [saving, setSaving] = useState(false);

  useEffect(() => setDone({}), [id]);

  const currentPlace = useMemo(() => (places.data || []).find((x) => x.id === id), [places.data, id]);

  async function save() {
    if (!id) return;
    setSaving(true);
    try {
      await api.sendFeedback({ place_id: id, liked, can_cook: canCook, would_buy: wouldBuy });
      toast("Response saved.");
      plan.reload({ quiet: true }); // refresh the results summary
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setSaving(false);
    }
  }

  const fs = p?.feedback_summary || {};

  return (
    <>
      <PageIntro eyebrow="Customer awareness" title="Discover: introduce your product" right={<DemoBadge />}>
        Many people don’t know alt-protein yet. Plan how to bring awareness in each market you picked, then measure what happened.
      </PageIntro>

      <ErrorBox message={places.error} onRetry={places.reload} />
      <div className="pill-tabs" role="tablist" aria-label="Places">
        {(places.data || []).map((pl) => (
          <button key={pl.id} type="button" role="tab" aria-selected={pl.id === id} className={pl.id === id ? "active" : ""}
            onClick={() => navigate(`/discover/${encodeURIComponent(pl.id)}`)}>
            {pl.name} · {pl.segment.toLowerCase()} · {channelLabel(pl.channel).toLowerCase()}
          </button>
        ))}
      </div>

      <ErrorBox message={plan.error} onRetry={plan.reload} />

      {!p && plan.loading ? (
        <div className="three-col"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div>
      ) : p ? (
        <>
          <div className={`three-col ${plan.loading ? "is-updating" : ""}`}>
            <div className="panel">
              <span className="overline">Awareness gap</span>
              <strong className="big-word">{gapLabel(p.awareness_gap)}</strong>
              <div className="progress"><i style={{ width: `${GAP_WIDTH[p.awareness_gap] ?? 50}%` }} /></div>
              <p className="muted small">How little people here know alt-protein{currentPlace ? ` (${currentPlace.name})` : ""}.</p>
            </div>
            <div className="panel">
              <span className="overline">Need lens here</span>
              <span className="chip lens-chip">{lensLabel(p.lens)}</span>
              <p className="muted small">Explain why protein matters and show how to cook it in meals people already eat.</p>
            </div>
            <div className="panel">
              <span className="overline">Suggested message</span>
              <h3 className="quote">“{p.message}”</h3>
              <p className="muted small">No health or medical claims. Checked against the safeguards.</p>
            </div>
          </div>

          <div className="two-col">
            <section className="panel">
              <h3 className="panel-title">Recommended activities</h3>
              {(p.activities || []).map((a, i) => (
                <button type="button" key={i} className={`activity-card ${done[i] ? "done" : ""}`} aria-pressed={!!done[i]}
                  onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}>
                  {done[i] ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  <span><b>{a.title}</b><p>{a.description}</p><small>{effortLabel(a.effort)}</small></span>
                </button>
              ))}
            </section>
            <section className="panel">
              <h3 className="panel-title">Cook it the way people already eat</h3>
              {(p.recipes || []).map((r, i) => (
                <div className="recipe" key={i}>
                  <span className="recipe-icon"><Utensils size={17} /></span>
                  <div><b>{r.dish}</b><p>{r.steps}</p></div>
                </div>
              ))}
              <p className="muted small">[Team to test each method before the tasting day.]</p>
            </section>
          </div>

          <section className="panel feedback-panel">
            <div>
              <h3 className="panel-title">Trial feedback (one taster)</h3>
              <div className="question"><b>Did you like it?</b><Segmented options={LIKED} value={liked} onChange={setLiked} ariaLabel="Did you like it?" /></div>
              <div className="question"><b>Do you know how to cook it now?</b><Segmented options={COOK} value={canCook} onChange={setCanCook} ariaLabel="Can cook" /></div>
              <div className="question"><b>Would you buy it?</b><Segmented options={BUY} value={wouldBuy} onChange={setWouldBuy} ariaLabel="Would buy" /></div>
              <button type="button" className="primary-btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save response"}</button>
            </div>
            <div>
              <h3 className="panel-title">Results so far</h3>
              <div className="tiles two">
                <Tile label="Tasters" value={fs.tasters ?? 0} />
                <Tile label="Liked it" value={pct(fs.liked_pct)} />
                <Tile label="Can cook it now" value={pct(fs.can_cook_pct)} />
                <Tile label="Would buy" value={pct(fs.would_buy_pct)} />
              </div>
              <p className="muted small">Results feed back into this market’s demand and awareness estimates. Awareness activity is measured, never assumed to create demand.</p>
            </div>
          </section>
        </>
      ) : !places.loading && !places.error && !(places.data || []).length ? (
        <div className="empty-state">No places yet.</div>
      ) : null}
    </>
  );
}
