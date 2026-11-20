// ─────────────────────────────────────────────────────────────────────────────
// Fake backend used ONLY when VITE_USE_MOCKS=true.
//
// It answers with the example JSON from the API contract (src/mocks/*.json).
// It is not part of the real app: it does no scoring or ranking. It only keeps
// claims and capacity edits in memory so every button can be clicked while
// the backend isn't running. Delete nothing here: flip VITE_USE_MOCKS=false
// and the app talks to FastAPI instead.
// ─────────────────────────────────────────────────────────────────────────────
import rankJson from "../mocks/rank.json";
import rankFairJson from "../mocks/rank-fair-share.json";
import productsJson from "../mocks/products.json";
import placesJson from "../mocks/places.json";
import notesJson from "../mocks/place-notes.json";
import discoverJson from "../mocks/discover.json";
import regulatorJson from "../mocks/regulator.json";
import sourcesJson from "../mocks/sources.json";

const clone = (x) => JSON.parse(JSON.stringify(x));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

class MockError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// In-memory "database" (resets on page reload)
const db = {
  slots: Object.fromEntries(placesJson.map((p) => [p.id, { registered: p.registered, capacity: p.capacity }])),
  feedback: [],
};

function statusOf({ registered, capacity }) {
  if (registered >= capacity) return "full";
  if (registered / capacity >= 0.8) return "nearly_full";
  return "open";
}
function capacityObj(id) {
  const s = db.slots[id];
  return { registered: s.registered, capacity: s.capacity, slots_left: Math.max(s.capacity - s.registered, 0), status: statusOf(s) };
}
function placeById(id) {
  const p = placesJson.find((x) => x.id === id);
  if (!p) throw new MockError("not_found", `Place ${id} not found`, 404);
  const c = capacityObj(id);
  return { ...clone(p), registered: c.registered, capacity: c.capacity, slots_left: c.slots_left, status: c.status };
}

function rankResponse(body) {
  const base = clone(body?.fair_share ? rankFairJson : rankJson);
  const all = [...base.ranked];
  const ranked = [];
  const full = [];
  for (const item of all) {
    const cap = capacityObj(item.id);
    if (cap.status === "full") {
      full.push({ id: item.id, name: item.name, segment: item.segment, registered: cap.registered, capacity: cap.capacity });
    } else {
      ranked.push({ ...item, capacity: cap });
    }
  }
  for (const f of base.full) {
    const cap = capacityObj(f.id);
    if (cap.status === "full") full.push({ ...f, registered: cap.registered, capacity: cap.capacity });
    else {
      // A place that was full but got more capacity shows up again at the bottom.
      const p = placeById(f.id);
      ranked.push({
        rank: 0, id: p.id, name: p.name, area_type: p.area_type, is_rural: p.is_rural, segment: p.segment, channel: p.channel,
        scores: { demand: p.demand, health: p.protein_deficiency, affordability: p.meat_cost, total: 55, low: 45, high: 64 },
        confidence: { pct: 40, label: "medium" }, capacity: cap,
        explanation: { demand: "Strong demand signal.", health: "Health need reported.", affordability: "Meat prices near average.", uncertain: "Re-opened after a capacity change.", test_first: "Run a small trial before stocking." },
        labels: { demand: p.label_demand, health: p.label_health, affordability: p.label_meat_cost }, fair_share_added: false,
      });
    }
  }
  ranked.forEach((r, i) => { r.rank = i + 1; });
  const ruralTop5 = ranked.slice(0, 5).filter((r) => r.is_rural).length;
  return { ranked, full, equity: { rural_in_top5: ruralTop5, target: 2, balanced: ruralTop5 >= 2 }, meta: { ...base.meta, lens: body?.lens || "both" } };
}

function regulatorResponse() {
  const r = clone(regulatorJson);
  r.places = r.places.map((p) => ({ ...p, ...(({ registered, capacity, status }) => ({ registered, capacity, status }))(capacityObj(p.id)) }));
  r.counts = {
    businesses: r.places.reduce((n, p) => n + p.registered, 0),
    places: r.places.length,
    open: r.places.filter((p) => p.status === "open").length,
    nearly_full: r.places.filter((p) => p.status === "nearly_full").length,
    full: r.places.filter((p) => p.status === "full").length,
  };
  return r;
}

export async function mockBackend(method, path, body) {
  await wait(250); // feel like a network call so loading states are visible
  const route = `${method} ${path}`;
  let m;

  if (route === "GET /health") return { status: "ok", mocks: true };
  if (route === "GET /products") return clone(productsJson);
  if (route === "POST /rank") return rankResponse(body);
  if (route === "GET /places") return placesJson.map((p) => placeById(p.id));
  if ((m = route.match(/^GET \/places\/(.+)$/))) {
    const id = decodeURIComponent(m[1]);
    const p = placeById(id);
    const ids = String(p.source_ids || "").split(";").filter(Boolean);
    return { ...p, sources: sourcesJson.filter((s) => ids.includes(s.id)), notes: notesJson[id] || "" };
  }
  if ((m = route.match(/^GET \/discover\/(.+)$/))) {
    const id = decodeURIComponent(m[1]);
    const d = discoverJson[id];
    if (!d) throw new MockError("not_found", `Place ${id} not found`, 404);
    const rows = db.feedback.filter((f) => f.place_id === id);
    const pct = (key, val) => (rows.length ? Math.round((rows.filter((f) => f[key] === val).length / rows.length) * 100) : null);
    return { ...clone(d), feedback_summary: { tasters: rows.length, liked_pct: pct("liked", "yes"), can_cook_pct: pct("can_cook", "yes"), would_buy_pct: pct("would_buy", "yes") } };
  }
  if (route === "POST /feedback") {
    placeById(body.place_id);
    const rec = { id: db.feedback.length + 1, ...body, created_at: new Date().toISOString() };
    db.feedback.push(rec);
    return rec;
  }
  if (route === "POST /claims") {
    if (!body?.nafdac_no || !String(body.nafdac_no).trim()) throw new MockError("nafdac_required", "NAFDAC number is required", 400);
    placeById(body.place_id);
    const s = db.slots[body.place_id];
    if (s.registered >= s.capacity) throw new MockError("place_full", "No slots left", 409);
    s.registered += 1;
    return capacityObj(body.place_id);
  }
  if (route === "GET /regulator/overview") return regulatorResponse();
  if ((m = route.match(/^PATCH \/regulator\/places\/(.+)\/capacity$/))) {
    const id = decodeURIComponent(m[1]);
    placeById(id);
    const n = Number(body?.capacity);
    if (!Number.isInteger(n) || n < 1) throw new MockError("validation_error", "capacity must be an integer ≥ 1", 400);
    db.slots[id].capacity = n;
    return regulatorResponse().places.find((p) => p.id === id);
  }
  if (route === "GET /sources") return clone(sourcesJson);

  throw new MockError("not_found", `No mock for ${route}`, 404);
}
