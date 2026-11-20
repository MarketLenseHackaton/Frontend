// Display helpers only: they turn API enum values into words.
// They never compute scores, ranks, status or equity — those always come from the API.

export const WEIGHT_LEVELS = [
  { label: "Low", value: 1 },
  { label: "Medium", value: 2 },
  { label: "High", value: 3 },
];

export const LENSES = [
  { label: "Protein deficiency", value: "protein" },
  { label: "Colorectal cancer", value: "cancer" },
  { label: "Both", value: "both" },
];

const AREA = { big_city: "Big city", city: "City", rural: "Rural" };
const CHANNEL = {
  open_market: "Open market",
  supermarket: "Supermarket",
  canteen: "Canteen",
  restaurant: "Restaurant",
  village_shop: "Village shop",
};
const STATUS = { open: "Open", nearly_full: "Nearly full", full: "Full · hidden" };
const NEED = { protein: "Protein deficiency", cancer: "Colorectal cancer", both: "Both" };
const GAP = { low: "Low", medium: "Medium", high: "High" };
const EFFORT = { very_low: "Very low cost", low: "Low cost", medium: "Medium cost", high: "High cost" };
const LEVEL = { national: "National", state: "State", city: "City", local: "Local" };

const titleCase = (s) => String(s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const areaLabel = (v) => AREA[v] || titleCase(v);
export const channelLabel = (v) => CHANNEL[v] || titleCase(v);
export const statusLabel = (v) => STATUS[v] || titleCase(v);
export const needLabel = (v) => NEED[v] || titleCase(v);
export const gapLabel = (v) => GAP[v] || titleCase(v);
export const effortLabel = (v) => EFFORT[v] || titleCase(v);
export const levelLabel = (v) => LEVEL[v] || titleCase(v);
export const lensLabel = (v) => NEED[v] || titleCase(v);

export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const x = Number(n);
  if (Math.abs(x) >= 1_000_000) return `${(x / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (Math.abs(x) >= 1_000) return `${(x / 1_000).toFixed(0)}k`;
  return String(Math.round(x * 10) / 10);
}

export function pct(n) {
  return n === null || n === undefined ? "—" : `${Math.round(n)}%`;
}

export function clamp(n, lo = 0, hi = 100) {
  const x = Number(n);
  if (Number.isNaN(x)) return lo;
  return Math.min(hi, Math.max(lo, x));
}
