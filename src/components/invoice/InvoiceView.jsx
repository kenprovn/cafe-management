import Icon from "../common/Icon";

const currency = (value) => `${Number(value).toLocaleString("vi-VN")} ₫`;
const paymentLabels = { CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", CARD: "Thẻ" };
const formatDate = (value) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function InvoiceView({ invoice, onBack }) {
  return (
    <div className="invoice-page">
      <div className="invoice-toolbar no-print"><button className="button ghost" onClick={onBack}><Icon name="back" size={17} /> Quay lại</button><button className="button primary" onClick={() => window.print()}><Icon name="print" size={17} /> In hóa đơn</button></div>
      <article className="invoice-sheet">
        <header className="invoice-brand"><div className="brand-mark"><Icon name="cup" size={25} /></div><div><h1>Roast & Co.</h1><p>COFFEE MANAGEMENT</p></div><span className="invoice-paid"><Icon name="check" size={15} /> ĐÃ THANH TOÁN</span></header>
        <section className="invoice-title"><div><span>HÓA ĐƠN THANH TOÁN</span><h2>#{String(invoice.invoice_id).padStart(6, "0")}</h2></div><div><p><span>Bàn</span><strong>{invoice.table_number}</strong></p><p><span>Mã đơn</span><strong>#{String(invoice.order_id).padStart(4, "0")}</strong></p></div></section>
        <section className="invoice-meta"><div><span>Thu ngân</span><strong>{invoice.cashier_name}</strong></div><div><span>Giờ mở đơn</span><strong>{formatDate(invoice.order_created_at)}</strong></div><div><span>Giờ thanh toán</span><strong>{formatDate(invoice.paid_at)}</strong></div><div><span>Phương thức</span><strong>{paymentLabels[invoice.payment_method]}</strong></div></section>
        <div className="invoice-table-wrap"><table className="invoice-table"><thead><tr><th>Món</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.order_item_id}><td>{item.product_name}</td><td>{currency(item.unit_price)}</td><td>{item.quantity}</td><td>{currency(item.subtotal)}</td></tr>)}</tbody></table></div>
        {invoice.note && <div className="invoice-note"><span>Ghi chú</span><p>{invoice.note}</p></div>}
        <section className="invoice-total"><span>Tổng cộng</span><strong>{currency(invoice.amount)}</strong></section>
        <footer className="invoice-footer"><Icon name="cup" size={20} /><p>Cảm ơn quý khách và hẹn gặp lại!</p><span>Roast & Co. · Một tách cà phê, một câu chuyện</span></footer>
      </article>
    </div>
  );
}

export default InvoiceView;
