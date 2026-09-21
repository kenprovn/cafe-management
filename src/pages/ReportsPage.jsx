import { useEffect, useState } from "react";
import Icon from "../components/common/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateMessage";
import DailyRevenueChart from "../components/report/DailyRevenueChart";
import { getReportOverview } from "../services/api";

const currency = (value) => `${Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫`;
const number = (value) => Number(value).toLocaleString("vi-VN");
const paymentLabels = { CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", CARD: "Thẻ" };

function datePartsInVietnam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function formatCalendarDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function shiftCalendarDate(value, days) {
  const [year, month, day] = value.split("-").map(Number);
  return formatCalendarDate(new Date(Date.UTC(year, month - 1, day + days)));
}

function getPresetRange(preset) {
  const todayParts = datePartsInVietnam();
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  if (preset === "today") return { dateFrom: today, dateTo: today };
  if (preset === "7days") return { dateFrom: shiftCalendarDate(today, -6), dateTo: today };
  if (preset === "month") return { dateFrom: `${todayParts.year}-${todayParts.month}-01`, dateTo: today };
  return { dateFrom: shiftCalendarDate(today, -29), dateTo: today };
}

const presets = [
  { id: "today", label: "Hôm nay" },
  { id: "7days", label: "7 ngày" },
  { id: "30days", label: "30 ngày" },
  { id: "month", label: "Tháng này" },
  { id: "custom", label: "Tùy chọn" },
];

function RankingList({ items, metric, emptyLabel }) {
  const max = Math.max(...items.map((item) => Number(item[metric])), 1);
  return items.length === 0 ? <p className="report-inline-empty">{emptyLabel}</p> : (
    <ol className="report-ranking-list">
      {items.map((item, index) => (
        <li key={`${item.product_name}-${index}`}>
          <span className="ranking-number">{index + 1}</span>
          <div className="ranking-content">
            <div><strong>{item.product_name}</strong><span>{metric === "revenue" ? currency(item.revenue) : `${number(item.total_quantity)} sản phẩm`}</span></div>
            <span className="ranking-track"><i style={{ width: `${(Number(item[metric]) / max) * 100}%` }} /></span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ReportsPage() {
  const initialRange = getPresetRange("30days");
  const [activePreset, setActivePreset] = useState("30days");
  const [filters, setFilters] = useState(initialRange);
  const [submittedRange, setSubmittedRange] = useState(initialRange);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async (range) => {
    setLoading(true);
    setError("");
    setSubmittedRange(range);
    try {
      setReport(await getReportOverview(range));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(initialRange);
    // The initial Vietnam calendar range is intentionally captured once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choosePreset = (preset) => {
    setActivePreset(preset);
    if (preset === "custom") return;
    const range = getPresetRange(preset);
    setFilters(range);
    loadReport(range);
  };

  const applyCustomRange = (event) => {
    event.preventDefault();
    setActivePreset("custom");
    loadReport(filters);
  };

  const hasPaidOrders = Number(report?.summary?.paid_order_count || 0) > 0;
  const summaryCards = report ? [
    { label: "Tổng doanh thu", value: currency(report.summary.total_revenue), note: "Từ các hóa đơn đã thanh toán", icon: "revenue", tone: "caramel" },
    { label: "Hóa đơn đã trả", value: number(report.summary.paid_order_count), note: "Không gồm đơn hoàn tất chưa trả", icon: "receipt", tone: "cream" },
    { label: "Trung bình hóa đơn", value: currency(report.summary.average_invoice_value), note: "Giá trị trung bình mỗi lần thanh toán", icon: "report", tone: "sage" },
    { label: "Sản phẩm đã bán", value: number(report.summary.total_quantity_sold), note: "Theo ảnh chụp món trong đơn", icon: "cup", tone: "rose" },
  ] : [];

  return (
    <div className="page-stack reports-page">
      <section className="panel report-filter-panel">
        <div className="panel-header">
          <div><span className="eyebrow">PHÂN TÍCH KINH DOANH</span><h2>Bộ lọc báo cáo</h2><p>Dữ liệu doanh thu theo múi giờ Việt Nam (UTC+7).</p></div>
          {report && <span className="report-range-label"><Icon name="filter" size={15} /> {report.range.date_from} — {report.range.date_to}</span>}
        </div>
        <div className="report-presets" aria-label="Khoảng thời gian nhanh">
          {presets.map((preset) => <button className={activePreset === preset.id ? "active" : ""} key={preset.id} onClick={() => choosePreset(preset.id)} type="button">{preset.label}</button>)}
        </div>
        <form className="report-custom-range" onSubmit={applyCustomRange}>
          <label><span>Từ ngày</span><input required type="date" value={filters.dateFrom} onChange={(event) => { setActivePreset("custom"); setFilters({ ...filters, dateFrom: event.target.value }); }} /></label>
          <label><span>Đến ngày</span><input required type="date" value={filters.dateTo} onChange={(event) => { setActivePreset("custom"); setFilters({ ...filters, dateTo: event.target.value }); }} /></label>
          <button className="button primary" disabled={loading} type="submit">{loading ? <span className="button-spinner" /> : <Icon name="report" size={16} />} Xem báo cáo</button>
        </form>
      </section>

      {loading && <section className="panel"><LoadingState label="Đang tổng hợp dữ liệu báo cáo..." /></section>}
      {!loading && error && <section className="panel"><ErrorState message={error} onRetry={() => loadReport(submittedRange)} /></section>}
      {!loading && !error && report && !hasPaidOrders && <section className="panel"><EmptyState title="Chưa có doanh thu trong khoảng này" message="Hãy chọn một khoảng ngày khác để xem các hóa đơn đã thanh toán." /></section>}

      {!loading && !error && report && hasPaidOrders && (
        <>
          <section className="report-summary-grid">
            {summaryCards.map((card) => <article className="report-summary-card" key={card.label}><span className={`stat-icon ${card.tone}`}><Icon name={card.icon} size={24} /></span><div><p>{card.label}</p><h3>{card.value}</h3><small>{card.note}</small></div></article>)}
          </section>

          <section className="panel report-trend-panel">
            <div className="panel-header"><div><span className="eyebrow">DOANH THU THEO NGÀY</span><h2>Xu hướng doanh thu</h2><p>Bao gồm cả những ngày không phát sinh thanh toán.</p></div></div>
            <DailyRevenueChart data={report.daily_revenue} />
          </section>

          <section className="report-two-column">
            <article className="panel">
              <div className="panel-header"><div><span className="eyebrow">SẢN PHẨM</span><h2>Bán chạy theo số lượng</h2><p>Dựa trên tên và số lượng đã lưu trong đơn.</p></div></div>
              <RankingList emptyLabel="Chưa có sản phẩm." items={report.top_products_by_quantity} metric="total_quantity" />
            </article>
            <article className="panel">
              <div className="panel-header"><div><span className="eyebrow">SẢN PHẨM</span><h2>Doanh thu theo sản phẩm</h2><p>Dựa trên thành tiền lịch sử của từng món.</p></div></div>
              <RankingList emptyLabel="Chưa có sản phẩm." items={report.top_products_by_revenue} metric="revenue" />
            </article>
          </section>

          <section className="panel">
            <div className="panel-header"><div><span className="eyebrow">THANH TOÁN</span><h2>Phương thức thanh toán</h2><p>Tỷ trọng trên tổng doanh thu đã thanh toán.</p></div></div>
            <div className="payment-report-grid">
              {report.payment_methods.map((method) => <article key={method.payment_method}><span className={`payment-report-icon ${method.payment_method.toLowerCase()}`}><Icon name={method.payment_method === "CASH" ? "cash" : method.payment_method === "CARD" ? "card" : "bank"} size={21} /></span><div><p>{paymentLabels[method.payment_method] || method.payment_method}</p><strong>{currency(method.revenue)}</strong><small>{number(method.payment_count)} giao dịch · {Number(method.percentage).toLocaleString("vi-VN")} %</small><span className="payment-share"><i style={{ width: `${Math.min(Number(method.percentage), 100)}%` }} /></span></div></article>)}
            </div>
          </section>

          <section className="report-two-column report-table-grid">
            <article className="panel">
              <div className="panel-header"><div><span className="eyebrow">NHÂN VIÊN</span><h2>Giao dịch theo nhân viên</h2><p>Doanh thu được xử lý tại quầy.</p></div></div>
              <div className="table-wrap"><table className="data-table report-data-table"><thead><tr><th>NHÂN VIÊN</th><th>HÓA ĐƠN</th><th>DOANH THU</th><th>TRUNG BÌNH</th></tr></thead><tbody>{report.employees.map((employee) => <tr key={employee.employee_id}><td><strong>{employee.employee_name}</strong></td><td>{number(employee.paid_orders)}</td><td className="price-cell">{currency(employee.revenue_handled)}</td><td>{currency(employee.average_invoice_value)}</td></tr>)}</tbody></table></div>
            </article>
            <article className="panel">
              <div className="panel-header"><div><span className="eyebrow">BÀN PHỤC VỤ</span><h2>Hiệu quả theo bàn</h2><p>Số hóa đơn và doanh thu từng bàn.</p></div></div>
              <div className="table-wrap"><table className="data-table report-data-table"><thead><tr><th>BÀN</th><th>HÓA ĐƠN</th><th>DOANH THU</th></tr></thead><tbody>{report.tables.map((table) => <tr key={table.table_id}><td><strong>{table.table_number}</strong></td><td>{number(table.paid_orders)}</td><td className="price-cell">{currency(table.revenue)}</td></tr>)}</tbody></table></div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}

export default ReportsPage;
