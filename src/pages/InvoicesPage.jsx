import { useState } from "react";
import Icon from "../components/common/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateMessage";

const currency = (value) => `${Number(value).toLocaleString("vi-VN")} ₫`;
const paymentLabels = { CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", CARD: "Thẻ" };
const formatDate = (value) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

function InvoicesPage({ invoices, loading, error, onSearch, onRetry, onOpen }) {
  const [filters, setFilters] = useState({ search: "", dateFrom: "", dateTo: "" });
  const submit = (event) => { event.preventDefault(); onSearch(filters); };

  return (
    <section className="panel data-panel invoice-history">
      <div className="panel-header"><div><span className="eyebrow">THANH TOÁN</span><h2>Lịch sử hóa đơn</h2><p>{loading ? "Đang cập nhật..." : `${invoices.length} hóa đơn đã thanh toán`}</p></div></div>
      <form className="invoice-filters" onSubmit={submit}>
        <label className="search-box invoice-search"><Icon name="search" size={17} /><input aria-label="Tìm hóa đơn" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tìm mã hóa đơn, bàn hoặc thu ngân..." /></label>
        <label><span>Từ ngày</span><input aria-label="Từ ngày" type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} /></label>
        <label><span>Đến ngày</span><input aria-label="Đến ngày" type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} /></label>
        <button className="button secondary" type="submit"><Icon name="filter" size={16} /> Lọc</button>
      </form>
      {loading && <LoadingState label="Đang tải lịch sử hóa đơn..." />}
      {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && invoices.length === 0 && <EmptyState title="Chưa có hóa đơn thanh toán" message="Hóa đơn sẽ xuất hiện tại đây sau khi một đơn hàng được thanh toán." />}
      {!loading && !error && invoices.length > 0 && <div className="table-wrap"><table className="data-table invoice-history-table"><thead><tr><th>HÓA ĐƠN</th><th>BÀN</th><th>THU NGÂN</th><th>PHƯƠNG THỨC</th><th>TỔNG TIỀN</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th></tr></thead><tbody>{invoices.map((invoice) => <tr className="clickable-row" key={invoice.invoice_id} onClick={() => onOpen(invoice.invoice_id)}><td><strong>#{String(invoice.invoice_id).padStart(6, "0")}</strong><span>Đơn #{String(invoice.order_id).padStart(4, "0")}</span></td><td>{invoice.table_number}</td><td>{invoice.cashier_name}</td><td><span className={`payment-badge ${invoice.payment_method.toLowerCase()}`}>{paymentLabels[invoice.payment_method]}</span></td><td className="price-cell">{currency(invoice.amount)}</td><td>{formatDate(invoice.paid_at)}</td><td><span className="status-badge available"><span className="status-dot" />Đã thanh toán</span></td></tr>)}</tbody></table></div>}
    </section>
  );
}

export default InvoicesPage;
