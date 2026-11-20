// ─────────────────────────────────────────────────────────────────────────────
// MarketLens API client — the ONLY file in the frontend that talks to the backend.
//
// Contract: "MarketLens — Project Spec & API Contract", Section 4.
// Every function below maps 1-to-1 to a FastAPI route under /api.
// Field names are passed through exactly as the backend sends them.
//
//   VITE_API_URL   = base URL of the backend, e.g. http://localhost:8000/api
//   VITE_USE_MOCKS = "true"  -> answer from src/mocks (no backend needed)
//                    "false" -> call the real backend
// ─────────────────────────────────────────────────────────────────────────────
import { mockBackend } from "./mockBackend";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
export const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? "true").toLowerCase() === "true";
const TIMEOUT_MS = 15000;

// Friendly text for every error code the backend can send.
const FRIENDLY = {
  place_full: "This place is full. Try another one.",
  nafdac_required: "Add your NAFDAC registration number before claiming a slot.",
  not_found: "We couldn't find that place. It may have been removed.",
  validation_error: "Some of the inputs were not accepted. Check them and try again.",
  bad_request: "That request was not accepted. Check your inputs and try again.",
  server_error: "The server had a problem. Please try again in a moment.",
  network_error: "Can't reach the MarketLens server. Check that the backend is running.",
  timeout: "The server took too long to answer. Please try again.",
};

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.friendly = FRIENDLY[code] || message || FRIENDLY.server_error;
  }
}

/** Turn any thrown value into a sentence a user can read. */
export function friendlyError(err) {
  if (err instanceof ApiError) return err.friendly;
  return FRIENDLY.server_error;
}

async function request(method, path, body, { signal } = {}) {
  if (USE_MOCKS) {
    try {
      return await mockBackend(method, path, body);
    } catch (e) {
      throw new ApiError(e.code || "server_error", e.message, e.status || 500);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e; // caller cancelled (e.g. a newer rank request) — let it bubble as AbortError
    if (controller.signal.reason === "timeout") throw new ApiError("timeout", "Request timed out", 0);
    throw new ApiError("network_error", "Network error", 0);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    // Contract: {"error": {"code": "...", "message": "..."}}
    // FastAPI's own validation errors come as {"detail": [...]} with HTTP 422.
    const code = data?.error?.code || (res.status === 422 ? "validation_error" : res.status >= 500 ? "server_error" : res.status === 404 ? "not_found" : "bad_request");
    const message = data?.error?.message || (typeof data?.detail === "string" ? data.detail : `HTTP ${res.status}`);
    throw new ApiError(code, message, res.status);
  }
  return data;
}

const get = (path, opts) => request("GET", path, undefined, opts);
const post = (path, body, opts) => request("POST", path, body, opts);
const patch = (path, body, opts) => request("PATCH", path, body, opts);
const enc = encodeURIComponent;

export const api = {
  /** GET /api/health → server is up */
  health: () => get("/health"),

  /** GET /api/products → [{ id, name, uses[] }] */
  products: () => get("/products"),

  /**
   * POST /api/rank — the main call. Your AI module's rank() answers this.
   * body: { product_id, weights: { demand, health, affordability } (1|2|3), lens: "protein"|"cancer"|"both", fair_share }
   * → { ranked[], full[], equity, meta }
   */
  rank: (body, opts) => post("/rank", body, opts),

  /** GET /api/places → Place[] (Section 3 + derived fields) */
  places: () => get("/places"),

  /** GET /api/places/{id} → Place + sources[] + notes */
  place: (id) => get(`/places/${enc(id)}`),

  /** GET /api/discover/{id} → awareness plan for one place */
  discover: (id) => get(`/discover/${enc(id)}`),

  /** POST /api/feedback  body: { place_id, liked, can_cook, would_buy } → saved record (201) */
  sendFeedback: (body) => post("/feedback", body),

  /**
   * POST /api/claims  body: { place_id, business_name, nafdac_no }
   * → updated capacity object (201) | 409 place_full | 400 nafdac_required
   */
  claim: (body) => post("/claims", body),

  /** GET /api/regulator/overview → { counts, equity, places[], missing_nafdac, nafdac_notices[] } */
  regulator: () => get("/regulator/overview"),

  /** PATCH /api/regulator/places/{id}/capacity  body: { capacity } (int ≥ 1) → updated place row */
  setCapacity: (id, capacity) => patch(`/regulator/places/${enc(id)}/capacity`, { capacity }),

  /** GET /api/sources → [{ id, title, publisher, url, year, level, used_for }] */
  sources: () => get("/sources"),
};
