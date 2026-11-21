import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

// What to lead with, by health lens
const LENS_ANGLE = {
  protein: "Lead with protein and price: show it fills the pot for less than meat.",
  cancer: "Lead with variety: an easy swap for some of the processed meat people already eat.",
  both: "Lead with price and variety. Keep health talk general.",
};

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
  const recipes = p?.recipes || [];

  return (
    <>
      <PageIntro title="Introduce your product" right={<DemoBadge />}>
        Most people haven't tried alt-protein yet. Plan how to introduce it in each place, then record what tasters said.
      </PageIntro>

      <ErrorBox message={places.error} onRetry={places.reload} />
      <div className="pill-tabs" role="tablist" aria-label="Places">
        {(places.data || []).map((pl) => (
          <button key={pl.id} type="button" role="tab" aria-selected={pl.id === id} className={pl.id === id ? "active" : ""}
            onClick={() => navigate(`/discover/${encodeURIComponent(pl.id)}`)}>
            {pl.name} · {channelLabel(pl.channel).toLowerCase()}
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
              <span className="muted small">Awareness gap{currentPlace ? ` in ${currentPlace.name}` : ""}</span>
              <strong className="big-word">{gapLabel(p.awareness_gap)}</strong>
              <div className="progress"><i style={{ width: `${GAP_WIDTH[p.awareness_gap] ?? 50}%` }} /></div>
              <p className="muted small">Higher means fewer people here know alt-protein.</p>
            </div>
            <div className="panel">
              <span className="muted small">Health angle</span>
              <strong className="big-word">{lensLabel(p.lens)}</strong>
              <p className="muted small">{LENS_ANGLE[p.lens] || LENS_ANGLE.both}</p>
            </div>
            <div className="panel">
              <span className="muted small">Message</span>
              <h3 className="quote">“{p.message}”</h3>
              <p className="muted small">No health or medical claims.</p>
            </div>
          </div>

          <div className={recipes.length ? "two-col" : ""}>
            <section className="panel">
              <h3 className="panel-title">What to do</h3>
              {(p.activities || []).map((a, i) => (
                <button type="button" key={i} className={`activity-card ${done[i] ? "done" : ""}`} aria-pressed={!!done[i]}
                  onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}>
                  <input type="checkbox" checked={!!done[i]} readOnly tabIndex={-1} aria-hidden="true" />
                  <span><b>{a.title}</b><p>{a.description}</p><small>{effortLabel(a.effort)}</small></span>
                </button>
              ))}
            </section>
            {recipes.length > 0 && (
              <section className="panel">
                <h3 className="panel-title">Cook it the way people already eat</h3>
                {recipes.map((r, i) => (
                  <div className="recipe" key={i}>
                    <div><b>{r.dish}</b><p>{r.steps}</p></div>
                  </div>
                ))}
              </section>
            )}
          </div>

          <section className="panel feedback-panel">
            <div>
              <h3 className="panel-title">Tasting feedback</h3>
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
            </div>
          </section>
        </>
      ) : !places.loading && !places.error && !(places.data || []).length ? (
        <div className="empty-state">No places yet.</div>
      ) : null}
    </>
  );
}