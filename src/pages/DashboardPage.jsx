import Icon from "../components/common/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateMessage";

function DashboardPage({ products, productsError, productsLoading, dashboardSummary, dashboardLoading, occupiedTables, totalTables, onNavigate, onRetryProducts }) {
  const stats = [
    { label: "Doanh thu hôm nay", value: dashboardLoading ? "—" : `${Number(dashboardSummary.today_revenue).toLocaleString("vi-VN")} ₫`, note: `${dashboardSummary.paid_orders_today || 0} hóa đơn đã thanh toán`, icon: "revenue", tone: "caramel" },
    { label: "Món trong thực đơn", value: productsLoading ? "—" : products.length, note: "Đang phục vụ tại quán", icon: "cup", tone: "cream" },
    { label: "Bàn đang sử dụng", value: `${occupiedTables} / ${totalTables}`, note: totalTables ? `${Math.round((occupiedTables / totalTables) * 100)}% công suất hiện tại` : "Chưa có dữ liệu bàn", icon: "chair", tone: "sage" },
  ];
  return (
    <div className="page-stack">
      <section className="welcome-banner"><div><span className="eyebrow light-text">ROAST & CO. COFFEE</span><h2>Chào buổi sáng! ☕</h2><p>Một ngày mới, thêm nhiều tách cà phê tuyệt vời.</p></div><div className="banner-circles"><span /><span /><span /></div></section>
      <section className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><span className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={25} /></span><div><p>{stat.label}</p><h3>{stat.value}</h3><small>{stat.note}</small></div></article>)}</section>
      <section className="panel">
        <div className="panel-header"><div><span className="eyebrow">THỰC ĐƠN</span><h2>Món nổi bật</h2><p>Những món đang có trong thực đơn của quán.</p></div><button className="button text-button" onClick={() => onNavigate("products")}>Xem tất cả <Icon name="arrow" size={17} /></button></div>
        {productsLoading && <LoadingState label="Đang tải thực đơn..." compact />}
        {!productsLoading && productsError && <ErrorState message={productsError} onRetry={onRetryProducts} />}
        {!productsLoading && !productsError && products.length === 0 && <EmptyState title="Thực đơn đang trống" message="Thêm món đầu tiên để bắt đầu phục vụ." actionLabel="Thêm món" onAction={() => onNavigate("products")} />}
        {!productsLoading && !productsError && products.length > 0 && <div className="featured-grid">{products.slice(0, 3).map((product, index) => <article className="featured-card" key={product.id}><div className={`product-visual visual-${(index % 3) + 1}`}><Icon name="cup" size={34} /><span>Roast & Co.</span></div><div className="featured-details"><span className="category-label">CÀ PHÊ</span><h3>{product.name}</h3><p>{Number(product.price).toLocaleString("vi-VN")} ₫</p></div></article>)}</div>}
      </section>
    </div>
  );
}

export default DashboardPage;
