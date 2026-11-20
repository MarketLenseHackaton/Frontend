import { statusLabel } from "../utils/format";

export default function StatusChip({ status, children }) {
  return <span className={`chip status-${status || "unknown"}`}>{children || statusLabel(status)}</span>;
}
