import { useEffect } from "react";
import Icon from "./Icon";

function ConfirmDialog({ title, message, confirmLabel = "Xác nhận", tone = "danger", loading, error, onCancel, onConfirm }) {
  useEffect(() => {
    const handleEscape = (event) => event.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loading, onCancel]);

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && !loading && onCancel()}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <span className={`confirm-icon ${tone}`}><Icon name={tone === "danger" ? "alert" : "check"} size={25} /></span>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        {error && <div className="form-error confirm-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="modal-actions">
          <button className="button ghost" type="button" onClick={onCancel} disabled={loading}>Hủy</button>
          <button className={`button ${tone === "danger" ? "danger-button" : "primary"}`} type="button" onClick={onConfirm} disabled={loading}>{loading && <span className="button-spinner" />}{loading ? "Đang xử lý..." : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
