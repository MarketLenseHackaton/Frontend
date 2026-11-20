import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, friendlyError } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useToast } from "../components/Toast";
import CheckCard from "../components/CheckCard";
import Segmented from "../components/Segmented";
import EquityStrip from "../components/EquityStrip";
import PlaceRow from "../components/PlaceRow";
import DetailsPanel from "../components/DetailsPanel";
import FullPlaces from "../components/FullPlaces";
import DemoBadge from "../components/DemoBadge";
import PageIntro from "../components/PageIntro";
import ErrorBox from "../components/ErrorBox";
import { SkeletonRows } from "../components/Skeleton";
import { LENSES, channelLabel, lensLabel } from "../utils/format";
import { downloadBrief } from "../utils/brief";

const STATES = ["Abuja (FCT)", "Kano", "Kaduna", "Lagos", "Oyo", "Rivers", "Bauchi", "Sokoto"];

export default function MarketFinder() {
  const toast = useToast();
  const products = useApi(() => api.products(), []);

  // Inputs (sent to /rank)
  const [productId, setProductId] = useState("soy_chunk");
  const [weights, setWeights] = useState({ demand: 3, health: 2, affordability: 2 }); // Demand High, others Medium
  const [lens, setLens] = useState("both");
  const [fairShare, setFairShare] = useState(false);

  // Kept in state, sent with claims
  const [basedIn, setBasedIn] = useState("Abuja (FCT)");
  const [businessName, setBusinessName] = useState("");
  const [nafdacNo, setNafdacNo] = useState("");

  // Result
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [claiming, setClaiming] = useState(false);

  // If the product list arrives and our default id isn't in it, pick the first product.
  useEffect(() => {
    const list = products.data;
    if (Array.isArray(list) && list.length && !list.some((p) => p.id === productId)) setProductId(list[0].id);
  }, [products.data, productId]);

  const product = useMemo(() => (products.data || []).find((p) => p.id === productId), [products.data, productId]);

  // Build the exact /rank body from the contract, then debounce it by 200 ms.
  const body = useMemo(
    () => ({ product_id: productId, weights: { ...weights }, lens, fair_share: fairShare }),
    [productId, weights, lens, fairShare]
  );
  const bodyKey = useDebouncedValue(JSON.stringify(body), 200);

  const abortRef = useRef(null);
  const runRank = useCallback(async (key, { quiet = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const data = await api.rank(JSON.parse(key), { signal: controller.signal });
      if (controller.signal.aborted) return;
      setResult(data);
    } catch (e) {
      if (controller.signal.aborted || e?.name === "AbortError") return;
      setError(friendlyError(e));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    runRank(bodyKey);
  }, [bodyKey, runRank]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ranked = result?.ranked || [];
  const full = result?.full || [];

  // Keep the selection if it's still in the list; otherwise select the #1 place.
  useEffect(() => {
    if (!ranked.length) return;
    if (!ranked.some((r) => r.id === selectedId)) setSelectedId(ranked[0].id);
  }, [ranked, selectedId]);

  const selected = ranked.find((r) => r.id === selectedId) || null;

  const setWeight = (key) => (value) => setWeights((w) => ({ ...w, [key]: value }));

  async function handleClaim() {
    if (!selected) return;
    setClaiming(true);
    try {
      const capacity = await api.claim({
        place_id: selected.id,
        business_name: businessName.trim() || "Unnamed business",
        nafdac_no: nafdacNo.trim(),
      });
      // Update the panel straight away with what the backend returned…
      setResult((r) => r && { ...r, ranked: r.ranked.map((x) => (x.id === selected.id ? { ...x, capacity: { ...x.capacity, ...capacity } } : x)) });
      toast(`Slot claimed in ${selected.name}. ${capacity?.slots_left ?? "—"} left.`);
      // …then re-rank quietly, because a place that just became full must leave the list.
      runRank(JSON.stringify(body), { quiet: true });
    } catch (e) {
      toast(friendlyError(e), "error");
      if (e?.code === "place_full") runRank(JSON.stringify(body), { quiet: true });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <>
      <div className="product-strip">
        <label className="field">
          <span>Your product</span>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!products.data?.length}>
            {(products.data || [{ id: productId, name: products.loading ? "Loading…" : productId }]).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Used in</span>
          <div className="field-static">{product?.uses?.length ? product.uses.join(", ") : "—"}</div>
        </div>
        <label className="field">
          <span>Based in</span>
          <select value={basedIn} onChange={(e) => setBasedIn(e.target.value)}>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Business name</span>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. SoyGood Foods" />
        </label>
        <label className="field">
          <span>NAFDAC no.</span>
          <input value={nafdacNo} onChange={(e) => setNafdacNo(e.target.value)} placeholder="e.g. A1-1234" />
        </label>
      </div>
      {products.error && <ErrorBox message={products.error} onRetry={products.reload} />}

      <PageIntro eyebrow="Market discovery" title="Find your best market in 3 checks" right={<DemoBadge />}>
        Compare where people may want your product, where a health need is reported, and where meat is expensive.
      </PageIntro>

      <div className="checks-grid">
        <CheckCard number="1" title="Demand" tone="blue" weight={weights.demand} onWeight={setWeight("demand")}
          description="Where people actually want this product: surveys, interviews, search interest and what already sells." />
        <CheckCard number="2" title="Health need" tone="green" weight={weights.health} onWeight={setWeight("health")}
          description="Places where protein deficiency or colorectal cancer and processed-meat concerns are reported.">
          <div className="lens-row">
            <span className="check-weight-label">Health lens</span>
            <Segmented options={LENSES} value={lens} onChange={setLens} tone="green" small ariaLabel="Health lens" />
          </div>
        </CheckCard>
        <CheckCard number="3" title="Affordability" tone="orange" weight={weights.affordability} onWeight={setWeight("affordability")}
          description="Where meat and processed meat are too expensive for people, so a plant protein makes sense." />
      </div>

      <EquityStrip
        equity={result?.equity}
        fairShare={fairShare}
        onFairShare={setFairShare}
        hiddenCount={full.length}
        onWhy={() => toast("Full places are hidden so new businesses spread out. Fair-share mode puts at least 2 rural places in your top 5.")}
      />

      <ErrorBox message={error} onRetry={() => runRank(JSON.stringify(body))} />

      <div className="finder-layout">
        <div className={`ranked-list ${loading && result ? "is-updating" : ""}`}>
          {loading && !result ? (
            <SkeletonRows rows={6} />
          ) : ranked.length === 0 ? (
            <div className="empty-state">No open places for these settings. Try another lens or turn on fair-share mode.</div>
          ) : (
            ranked.map((item) => <PlaceRow key={item.id} item={item} selected={item.id === selectedId} onSelect={setSelectedId} />)
          )}
          {result?.meta && (
            <p className="meta-line">
              Lens: {lensLabel(result.meta.lens)} · {result.meta.n_simulations?.toLocaleString?.() ?? result.meta.n_simulations} simulations · seed {result.meta.seed} · data as of {result.meta.data_as_of}
            </p>
          )}
        </div>
        {loading && !result ? (
          <aside className="details-panel"><SkeletonRows rows={4} height={70} /></aside>
        ) : (
          <DetailsPanel
            item={selected}
            claiming={claiming}
            onClaim={handleClaim}
            onDownload={() => downloadBrief({ result, selected, product, basedIn, lensText: lensLabel(lens), channelLabel })}
          />
        )}
      </div>

      <FullPlaces full={full} />

      <p className="disclaimer">
        Health data shows where a need is reported, not proof people will buy; no claim is made that any product prevents or treats disease.
        Scores rank places against each other, not sales.
      </p>
    </>
  );
}
