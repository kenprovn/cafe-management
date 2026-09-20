import Icon from "../common/Icon";

function currency(value) {
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
}

function OrderCart({ table, order, items, note, error, success, saving, checkingOut, dirty, onNoteChange, onQuantityChange, onRemove, onSave, onCheckout }) {
  const total = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

  return (
    <aside className="order-cart">
      <div className="cart-heading">
        <div><span className="eyebrow">ĐƠN HIỆN TẠI</span><h2>{table.table_number}</h2><p>{order ? `Mã đơn #${String(order.id).padStart(4, "0")}` : "Đơn hàng mới"}</p></div>
        <span className={`status-badge ${order ? "occupied" : "available"}`}><span className="status-dot" />{order ? "Đang phục vụ" : "Đơn mới"}</span>
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="empty-cart"><span><Icon name="cart" size={28} /></span><h3>Chưa có món nào</h3><p>Chọn món từ thực đơn để thêm vào đơn hàng.</p></div>
        ) : items.map((item) => (
          <article className="cart-item" key={item.order_item_id || `product-${item.product_id}`}>
            <div className="cart-item-main"><div><strong>{item.product_name}</strong><span>{currency(item.unit_price)} / món</span></div><button className="remove-item" onClick={() => onRemove(item)} aria-label={`Xóa ${item.product_name}`}><Icon name="trash" size={16} /></button></div>
            <div className="cart-item-bottom">
              <div className="quantity-control"><button onClick={() => onQuantityChange(item, item.quantity - 1)} aria-label={`Giảm ${item.product_name}`}><Icon name="minus" size={14} /></button><span>{item.quantity}</span><button onClick={() => onQuantityChange(item, item.quantity + 1)} aria-label={`Tăng ${item.product_name}`}><Icon name="plus" size={14} /></button></div>
              <strong>{currency(Number(item.unit_price) * item.quantity)}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="order-note"><label htmlFor="order-note"><Icon name="note" size={16} /> Ghi chú</label><textarea id="order-note" value={note} onChange={(event) => onNoteChange(event.target.value)} maxLength="500" placeholder="Ví dụ: ít đá, không đường..." /><span>{note.length}/500</span></div>
      {error && <div className="order-feedback error"><Icon name="alert" size={17} />{error}</div>}
      {success && <div className="order-feedback success"><Icon name="check" size={17} />{success}</div>}
      <div className="cart-total"><span>Tổng cộng</span><strong>{currency(total)}</strong></div>
      <button className="button primary save-order-button" disabled={items.length === 0 || saving || checkingOut || (order && !dirty)} onClick={onSave}>{saving && <span className="button-spinner" />}{saving ? "Đang lưu..." : order ? dirty ? "Cập nhật đơn" : "Đơn đã được lưu" : "Lưu và mở bàn"}</button>
      {order && <button className="button checkout-order-button" disabled={saving || checkingOut || dirty} onClick={onCheckout}><Icon name="receipt" size={17} />{dirty ? "Lưu thay đổi trước khi thanh toán" : "Thanh toán"}</button>}
    </aside>
  );
}

export default OrderCart;
