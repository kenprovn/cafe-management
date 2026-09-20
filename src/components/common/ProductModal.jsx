import { useEffect } from "react";
import Icon from "./Icon";

function ProductModal({ editing, error, formData, loading, onChange, onClose, onSubmit }) {
  useEffect(() => {
    const handleEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="modal-header"><div><span className="eyebrow">THỰC ĐƠN</span><h2 id="product-modal-title">{editing ? "Cập nhật món" : "Thêm món mới"}</h2><p>{editing ? "Chỉnh sửa thông tin món trong thực đơn." : "Nhập thông tin món bạn muốn thêm vào thực đơn."}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button></div>
        <form onSubmit={onSubmit}>
          <div className="field-group"><label htmlFor="product-name">Tên món</label><input id="product-name" autoFocus type="text" name="name" value={formData.name} onChange={onChange} placeholder="Ví dụ: Cà phê sữa đá" /></div>
          <div className="field-group"><label htmlFor="product-price">Giá bán</label><div className="input-suffix"><input id="product-price" type="number" name="price" value={formData.price} onChange={onChange} placeholder="0" min="0" /><span>VNĐ</span></div></div>
          {error && <div className="form-error"><Icon name="alert" size={17} />{error}</div>}
          <div className="modal-actions"><button type="button" className="button ghost" onClick={onClose} disabled={loading}>Hủy</button><button type="submit" className="button primary" disabled={loading}>{loading && <span className="button-spinner" />}{loading ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm món"}</button></div>
        </form>
      </section>
    </div>
  );
}

export default ProductModal;
