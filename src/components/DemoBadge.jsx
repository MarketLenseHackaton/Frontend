import { useEffect, useState } from "react";
import { api, API_TARGET, API_URL } from "../api/client";

const COLORS = { checking: "#9AA39D", online: "#1B7F4C", offline: "#B3392F" };

/**
 * Small server status: which backend we're on and whether it answers.
 * Pings GET /api/health once when the page opens.
 */
export default function DemoBadge() {
  const [up, setUp] = useState(null); // null = checking, true/false = answer

  useEffect(() => {
    let alive = true;
    api.health().then(() => alive && setUp(true)).catch(() => alive && setUp(false));
    return () => { alive = false; };
  }, []);

  const state = up === null ? "checking" : up ? "online" : "offline";
  return (
    <span
      title={API_URL}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#66746C", whiteSpace: "nowrap" }}
    >
      <i style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[state], display: "inline-block" }} />
      {API_TARGET === "live" ? "Live server" : "Local server"} · {state}
    </span>
  );
}