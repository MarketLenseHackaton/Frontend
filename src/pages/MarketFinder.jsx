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

export default function MarketFinder() {
  const toast = useToast();
  const products = useApi(() => api.products(), []);

  // Inputs (sent to /rank)
  const [productId, setProductId] = useState("soy_chunk");
  const [weights, setWeights] = useState({ demand: 3, health: 2, affordability: 2 }); // Demand High, others Medium
  const [lens, setLens] = useState("both");
  const [fairShare, setFairShare] = useState(false);

  // Result
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

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
      </div>
      {products.error && <ErrorBox message={products.error} onRetry={products.reload} />}

      <PageIntro title="Find your best market" right={<DemoBadge />}>
        Set how much each check matters. Places are ranked on demand, health need and meat cost.
      </PageIntro>

      <div className="checks-grid">
        <CheckCard number="1" title="Demand" tone="blue" weight={weights.demand} onWeight={setWeight("demand")}
          description="Do people here want it? Google search interest plus our own interviews." />
        <CheckCard number="2" title="Health need" tone="green" weight={weights.health} onWeight={setWeight("health")}
          description="Protein deficiency, or a lot of processed meat (linked to colorectal cancer by the WHO).">
          <div className="lens-row">
            <span className="check-weight-label">Health lens</span>
            <Segmented options={LENSES} value={lens} onChange={setLens} tone="green" small ariaLabel="Health lens" />
          </div>
        </CheckCard>
        <CheckCard number="3" title="Affordability" tone="orange" weight={weights.affordability} onWeight={setWeight("affordability")}
          description="Is meat too expensive for people here? Then a cheaper protein has room." />
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
              Lens: {lensLabel(result.meta.lens)} · {result.meta.n_simulations?.toLocaleString?.() ?? result.meta.n_simulations} simulations · seed {result.meta.seed}{result.meta.data_as_of ? ` · data as of ${result.meta.data_as_of}` : ""}
            </p>
          )}
        </div>
        {loading && !result ? (
          <aside className="details-panel"><SkeletonRows rows={4} height={70} /></aside>
        ) : (
          <DetailsPanel
            item={selected}
            onDownload={() => downloadBrief({ result, selected, product, lensText: lensLabel(lens), channelLabel })}
          />
        )}
      </div>

      <FullPlaces full={full} />

      <p className="disclaimer">
        Scores rank places against each other. They are not sales forecasts, and no product here claims to prevent or treat disease.
      </p>
    </>
  );
}