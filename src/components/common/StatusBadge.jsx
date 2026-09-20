function StatusBadge({ status }) {
  const isAvailable = status === "Trống";
  return <span className={`status-badge ${isAvailable ? "available" : "occupied"}`}><span className="status-dot" />{status}</span>;
}

export default StatusBadge;
