import { USE_MOCKS } from "../api/client";

const SHOW = String(import.meta.env.VITE_SHOW_DEMO_BADGE ?? "true").toLowerCase() === "true";

/** "Demonstration data" badge, shown on every screen until real data is in. */
export default function DemoBadge({ children = "Demonstration data" }) {
  if (!SHOW) return null;
  return (
    <span className="demo-badge" title={USE_MOCKS ? "Using mock JSON (VITE_USE_MOCKS=true)" : "Connected to the backend"}>
      {children}
      {USE_MOCKS && <em> · mocks</em>}
    </span>
  );
}
