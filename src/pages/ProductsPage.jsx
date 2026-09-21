import { useMemo, useState } from "react";
import Icon from "../components/common/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateMessage";

function ProductsPage({ products, error, loading, notice, onAdd, onDelete, onEdit, onRetry }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const visibleProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    const filtered = keyword ? products.filter((product) => product.name.toLocaleLowerCase("vi-VN").includes(keyword)) : [...products];
    return filtered.sort((left, right) => {
      if (sort === "name-asc") return left.name.localeCompare(right.name, "vi-VN");
      if (sort === "name-desc") return right.name.localeCompare(left.name, "vi-VN");
      if (sort === "price-asc") return Number(left.price) - Number(right.price);
      if (sort === "price-desc") return Number(right.price) - Number(left.price);
      return right.id - left.id;
    });
  }, [products, search, sort]);

  return (
    <section className="panel data-panel">
      <div className="panel-header"><div><span className="eyebrow">THỰC ĐƠN</span><h2>Danh sách món</h2><p>{loading ? "Đang cập nhật..." : `${products.length} món đang có trong thực đơn`}</p></div><button className="button primary" onClick={onAdd}><Icon name="plus" size={18} /> Thêm món</button></div>
      <div className="product-filters">
        <label className="search-box"><Icon name="search" size={17} /><input aria-label="Tìm món" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên món..." />{search && <button type="button" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm"><Icon name="close" size={14} /></button>}</label>
        <label><span>Sắp xếp</span><select aria-label="Sắp xếp món" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Mới thêm gần đây</option><option value="name-asc">Tên A–Z</option><option value="name-desc">Tên Z–A</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label>
      </div>
      {notice && <div className="page-notice success product-notice" role="status"><Icon name="check" size={17} />{notice}</div>}
      {loading && <LoadingState label="Đang tải danh sách món..." />}
      {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && products.length === 0 && <EmptyState title="Chưa có món nào" message="Thực đơn sẽ xuất hiện ở đây sau khi bạn thêm món đầu tiên." actionLabel="Thêm món đầu tiên" onAction={onAdd} />}
      {!loading && !error && products.length > 0 && visibleProducts.length === 0 && <EmptyState title="Không tìm thấy món" message="Thử tìm bằng một tên khác hoặc xóa từ khóa tìm kiếm." actionLabel="Xóa tìm kiếm" onAction={() => setSearch("")} />}
      {!loading && !error && visibleProducts.length > 0 && <div className="table-wrap"><table className="data-table"><thead><tr><th>MÓN</th><th>GIÁ BÁN</th><th>TRẠNG THÁI</th><th className="actions-column">THAO TÁC</th></tr></thead><tbody>{visibleProducts.map((product, index) => <tr key={product.id}><td><div className="product-cell"><span className={`mini-product visual-${(index % 3) + 1}`}><Icon name="cup" size={20} /></span><div><strong>{product.name}</strong><span>Mã món #{String(product.id).padStart(3, "0")}</span></div></div></td><td className="price-cell">{Number(product.price).toLocaleString("vi-VN")} ₫</td><td><span className="status-badge available"><span className="status-dot" />Đang bán</span></td><td><div className="row-actions"><button className="icon-button edit-action" onClick={() => onEdit(product)} aria-label={`Sửa ${product.name}`}><Icon name="edit" size={18} /></button><button className="icon-button delete-action" onClick={() => onDelete(product)} aria-label={`Xóa ${product.name}`}><Icon name="trash" size={18} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
  );
}

export default ProductsPage;
