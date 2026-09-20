import { useState } from "react";
import Icon from "../components/common/Icon";
import OrderCart from "../components/order/OrderCart";
import ProductCatalog from "../components/order/ProductCatalog";

function OrderPage({ table, order, products, productsLoading, productsError, onBack, onRetryProducts, onSave, onComplete }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [items, setItems] = useState(() => order?.items || []);
  const [note, setNote] = useState(() => order?.note || "");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmingComplete, setConfirmingComplete] = useState(false);

  const addProduct = (product) => {
    setError("");
    setSuccess("");
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.product_id === product.id);
      if (existing) {
        return currentItems.map((item) => item === existing ? { ...item, quantity: Math.min(item.quantity + 1, 999) } : item);
      }
      return [...currentItems, {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: 1,
      }];
    });
  };

  const changeQuantity = (target, quantity) => {
    if (quantity < 1) {
      setItems((current) => current.filter((item) => item !== target));
      return;
    }
    if (quantity > 999) return;
    setItems((current) => current.map((item) => item === target ? { ...item, quantity } : item));
    setSuccess("");
  };

  const saveOrder = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const savedOrder = await onSave(currentOrder, {
        note,
        items: items.map((item) => ({
          order_item_id: item.order_item_id,
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });
      setCurrentOrder(savedOrder);
      setItems(savedOrder.items);
      setNote(savedOrder.note || "");
      setSuccess(currentOrder ? "Đơn hàng đã được cập nhật." : "Đã mở đơn hàng và chuyển bàn sang đang sử dụng.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const completeOrder = async () => {
    setConfirmingComplete(false);
    setCompleting(true);
    setError("");
    try {
      await onComplete(currentOrder.id);
    } catch (completeError) {
      setError(completeError.message);
      setCompleting(false);
    }
  };

  return (
    <div className="order-page">
      <div className="order-page-toolbar"><button className="button ghost" onClick={onBack}><Icon name="back" size={17} /> Quay lại sơ đồ bàn</button><div><span className="status-dot" />{currentOrder ? "Đơn đã lưu" : "Chưa lưu"}</div></div>
      <div className="pos-layout">
        <ProductCatalog products={products} loading={productsLoading} error={productsError} onAdd={addProduct} onRetry={onRetryProducts} />
        <OrderCart table={table} order={currentOrder} items={items} note={note} error={error} success={success} saving={saving} completing={completing} onNoteChange={(value) => { setNote(value); setSuccess(""); }} onQuantityChange={changeQuantity} onRemove={(target) => { setItems((current) => current.filter((item) => item !== target)); setSuccess(""); }} onSave={saveOrder} onComplete={() => setConfirmingComplete(true)} />
      </div>
      {confirmingComplete && (
        <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setConfirmingComplete(false)}>
          <section className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="complete-order-title">
            <span className="confirm-icon"><Icon name="check" size={27} /></span>
            <h2 id="complete-order-title">Hoàn tất đơn hàng?</h2>
            <p>Đơn của <strong>{table.table_number}</strong> sẽ được đóng và bàn sẽ chuyển về trạng thái trống.</p>
            <div className="modal-actions"><button type="button" className="button ghost" onClick={() => setConfirmingComplete(false)}>Tiếp tục phục vụ</button><button type="button" className="button primary" onClick={completeOrder}>Hoàn tất & trả bàn</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

export default OrderPage;
