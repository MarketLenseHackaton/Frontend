import { AlertTriangle, RotateCw } from "lucide-react";

export default function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-box" role="alert">
      <AlertTriangle size={18} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="secondary-btn small-btn" onClick={() => onRetry()}>
          <RotateCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
