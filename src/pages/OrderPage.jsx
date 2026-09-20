import { useState } from "react";
import Icon from "../components/common/Icon";
import OrderCart from "../components/order/OrderCart";
import ProductCatalog from "../components/order/ProductCatalog";
import CheckoutModal from "../components/payment/CheckoutModal";

function OrderPage({ table, order, user, products, productsLoading, productsError, onBack, onRetryProducts, onSave, onCheckout }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [items, setItems] = useState(() => order?.items || []);
  const [note, setNote] = useState(() => order?.note || "");
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dirty, setDirty] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const addProduct = (product) => {
    setError("");
    setSuccess("");
    setDirty(true);
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
      setDirty(true);
      return;
    }
    if (quantity > 999) return;
    setItems((current) => current.map((item) => item === target ? { ...item, quantity } : item));
    setSuccess("");
    setDirty(true);
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
      setDirty(false);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const checkout = async (paymentMethod) => {
    setCheckingOut(true);
    setCheckoutError("");
    try {
      await onCheckout(currentOrder.id, paymentMethod);
    } catch (checkoutFailure) {
      setCheckoutError(checkoutFailure.message);
      setCheckingOut(false);
    }
  };

  return (
    <div className="order-page">
      <div className="order-page-toolbar"><button className="button ghost" onClick={onBack}><Icon name="back" size={17} /> Quay lại sơ đồ bàn</button><div><span className="status-dot" />{dirty ? "Có thay đổi chưa lưu" : currentOrder ? "Đơn đã lưu" : "Chưa lưu"}</div></div>
      <div className="pos-layout">
        <ProductCatalog products={products} loading={productsLoading} error={productsError} onAdd={addProduct} onRetry={onRetryProducts} />
        <OrderCart table={table} order={currentOrder} items={items} note={note} error={error} success={success} saving={saving} checkingOut={checkingOut} dirty={dirty} onNoteChange={(value) => { setNote(value); setSuccess(""); setDirty(true); }} onQuantityChange={changeQuantity} onRemove={(target) => { setItems((current) => current.filter((item) => item !== target)); setSuccess(""); setDirty(true); }} onSave={saveOrder} onCheckout={() => setCheckoutOpen(true)} />
      </div>
      {checkoutOpen && <CheckoutModal order={currentOrder} table={table} user={user} loading={checkingOut} error={checkoutError} onClose={() => { setCheckoutOpen(false); setCheckoutError(""); }} onConfirm={checkout} />}
    </div>
  );
}

export default OrderPage;
