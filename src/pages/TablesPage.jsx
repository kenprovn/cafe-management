import Icon from "../components/common/Icon";
import StatusBadge from "../components/common/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateMessage";

function TablesPage({ tables, occupiedTables, error, loading, notice, onRetry, onOpenOrder }) {
  const total = tables.length;
  const available = total - occupiedTables;
  return (
    <div className="page-stack">
      {notice && <div className="page-notice success"><Icon name="check" size={18} />{notice}</div>}
      <section className="table-summary-grid">
        <article className="summary-card"><span className="stat-icon cream"><Icon name="tables" size={24} /></span><div><p>Tổng số bàn</p><h3>{loading ? "—" : total}</h3></div></article>
        <article className="summary-card"><span className="stat-icon sage"><Icon name="chair" size={24} /></span><div><p>Bàn trống</p><h3>{loading ? "—" : available}</h3></div></article>
        <article className="summary-card"><span className="stat-icon rose"><Icon name="users" size={24} /></span><div><p>Đang sử dụng</p><h3>{loading ? "—" : occupiedTables}</h3></div></article>
      </section>
      <section className="panel data-panel">
        <div className="panel-header"><div><span className="eyebrow">SƠ ĐỒ PHỤC VỤ</span><h2>Trạng thái bàn</h2><p>Chọn bàn trống để mở đơn mới hoặc bàn đang dùng để tiếp tục gọi món.</p></div><div className="legend"><span><i className="available-dot" />Bàn trống</span><span><i className="occupied-dot" />Đang dùng</span></div></div>
        {loading && <LoadingState label="Đang tải sơ đồ bàn..." />}
        {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && tables.length === 0 && <EmptyState title="Chưa có dữ liệu bàn" message="Danh sách bàn sẽ xuất hiện tại đây khi có dữ liệu." />}
        {!loading && !error && tables.length > 0 && (
          <div className="table-card-grid">
            {tables.map((table) => {
              const isEmpty = table.status === "Trống";
              return (
                <button className={`cafe-table-card ${isEmpty ? "empty" : "busy"}`} key={table.id} onClick={() => onOpenOrder(table)}>
                  <span className="table-card-top"><span className="table-number-icon"><Icon name="chair" size={23} /></span><StatusBadge status={table.status} /></span>
                  <span className="table-card-body"><span>BÀN</span><strong>{table.table_number}</strong><small>{isEmpty ? "Sẵn sàng mở đơn mới" : "Có đơn hàng đang phục vụ"}</small></span>
                  <span className={`button table-toggle ${isEmpty ? "secondary" : "ghost"}`}>{isEmpty ? "Mở đơn mới" : "Xem đơn hàng"}<Icon name="arrow" size={16} /></span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default TablesPage;
