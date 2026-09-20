import { useState } from "react";
import Icon from "../common/Icon";

const methods = [
  { value: "CASH", label: "Tiền mặt", description: "Thanh toán trực tiếp tại quầy", icon: "cash" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản", description: "Chuyển khoản ngân hàng / QR", icon: "bank" },
  { value: "CARD", label: "Thẻ", description: "Thẻ tín dụng hoặc thẻ ghi nợ", icon: "card" },
];

const currency = (value) => `${Number(value).toLocaleString("vi-VN")} ₫`;

function CheckoutModal({ order, table, user, loading, error, onClose, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  return (
    <div className="modal-overlay checkout-overlay" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <header className="checkout-header">
          <div><span className="eyebrow">THANH TOÁN</span><h2 id="checkout-title">Xác nhận thanh toán</h2><p>{table.table_number} · Đơn #{String(order.id).padStart(4, "0")}</p></div>
          <button className="icon-button" onClick={onClose} disabled={loading} aria-label="Đóng"><Icon name="close" /></button>
        </header>

        <div className="checkout-body">
          <div className="checkout-order-summary">
            <h3>Chi tiết đơn hàng</h3>
            <div className="checkout-items">{order.items.map((item) => <div className="checkout-item" key={item.order_item_id}><div><strong>{item.product_name}</strong><span>{item.quantity} × {currency(item.unit_price)}</span></div><b>{currency(item.subtotal)}</b></div>)}</div>
            <div className="checkout-total"><span>Tổng thanh toán</span><strong>{currency(order.total_amount)}</strong></div>
          </div>

          <div className="payment-panel">
            <h3>Phương thức thanh toán</h3>
            <div className="payment-methods">{methods.map((method) => <label className={`payment-method ${paymentMethod === method.value ? "selected" : ""}`} key={method.value}><input type="radio" name="payment-method" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} /><span className="payment-icon"><Icon name={method.icon} size={21} /></span><span><strong>{method.label}</strong><small>{method.description}</small></span><i><Icon name="check" size={14} /></i></label>)}</div>
            <div className="cashier-card"><span className="avatar small">{user.full_name?.charAt(0).toUpperCase() || "U"}</span><div><small>NHÂN VIÊN THANH TOÁN</small><strong>{user.full_name}</strong></div></div>
          </div>
        </div>

        {error && <div className="checkout-error"><Icon name="alert" size={17} />{error}</div>}
        <footer className="checkout-actions"><button className="button ghost" onClick={onClose} disabled={loading}>Quay lại</button><button className="button primary" onClick={() => onConfirm(paymentMethod)} disabled={loading}>{loading && <span className="button-spinner" />}{loading ? "Đang xử lý..." : `Thanh toán ${currency(order.total_amount)}`}</button></footer>
      </section>
    </div>
  );
}

export default CheckoutModal;
