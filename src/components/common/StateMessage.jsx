import Icon from "./Icon";

export function LoadingState({ label = "Đang tải dữ liệu...", compact = false }) {
  return <div className={`state-message ${compact ? "compact" : ""}`}><span className="spinner" /><p>{label}</p></div>;
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return <div className="state-message"><span className="state-icon"><Icon name="empty" size={26} /></span><h3>{title}</h3><p>{message}</p>{onAction && <button className="button secondary" onClick={onAction}>{actionLabel}</button>}</div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="state-message error-state"><span className="state-icon"><Icon name="alert" size={26} /></span><h3>Không thể tải dữ liệu</h3><p>{message}</p><button className="button secondary" onClick={onRetry}><Icon name="refresh" size={17} /> Thử lại</button></div>;
}
