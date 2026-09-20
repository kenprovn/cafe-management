import Icon from "../components/common/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateMessage";

function ProductsPage({ products, error, loading, onAdd, onDelete, onEdit, onRetry }) {
  return (
    <section className="panel data-panel">
      <div className="panel-header"><div><span className="eyebrow">THỰC ĐƠN</span><h2>Danh sách món</h2><p>{loading ? "Đang cập nhật..." : `${products.length} món đang có trong thực đơn`}</p></div><button className="button primary" onClick={onAdd}><Icon name="plus" size={18} /> Thêm món</button></div>
      {loading && <LoadingState label="Đang tải danh sách món..." />}
      {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && products.length === 0 && <EmptyState title="Chưa có món nào" message="Thực đơn sẽ xuất hiện ở đây sau khi bạn thêm món đầu tiên." actionLabel="Thêm món đầu tiên" onAction={onAdd} />}
      {!loading && !error && products.length > 0 && <div className="table-wrap"><table className="data-table"><thead><tr><th>MÓN</th><th>GIÁ BÁN</th><th>TRẠNG THÁI</th><th className="actions-column">THAO TÁC</th></tr></thead><tbody>{products.map((product, index) => <tr key={product.id}><td><div className="product-cell"><span className={`mini-product visual-${(index % 3) + 1}`}><Icon name="cup" size={20} /></span><div><strong>{product.name}</strong><span>Mã món #{String(product.id).padStart(3, "0")}</span></div></div></td><td className="price-cell">{Number(product.price).toLocaleString("vi-VN")} ₫</td><td><span className="status-badge available"><span className="status-dot" />Đang bán</span></td><td><div className="row-actions"><button className="icon-button edit-action" onClick={() => onEdit(product)} aria-label={`Sửa ${product.name}`}><Icon name="edit" size={18} /></button><button className="icon-button delete-action" onClick={() => onDelete(product.id)} aria-label={`Xóa ${product.name}`}><Icon name="trash" size={18} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
  );
}

export default ProductsPage;
