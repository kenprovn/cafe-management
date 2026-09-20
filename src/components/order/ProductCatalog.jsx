import { useMemo, useState } from "react";
import Icon from "../common/Icon";

function ProductCatalog({ products, loading, error, onAdd, onRetry }) {
  const [search, setSearch] = useState("");
  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    if (!keyword) return products;
    return products.filter((product) => product.name.toLocaleLowerCase("vi-VN").includes(keyword));
  }, [products, search]);

  return (
    <section className="pos-catalog">
      <div className="pos-section-header">
        <div><span className="eyebrow">THỰC ĐƠN</span><h2>Chọn món</h2></div>
        <span className="product-count">{filteredProducts.length} món</span>
      </div>
      <label className="search-box">
        <Icon name="search" size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm món trong thực đơn..." aria-label="Tìm món" />
        {search && <button type="button" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm"><Icon name="close" size={15} /></button>}
      </label>

      {loading && <div className="pos-inline-state"><span className="spinner" /><p>Đang tải thực đơn...</p></div>}
      {!loading && error && <div className="pos-inline-state error-state"><span className="state-icon"><Icon name="alert" size={22} /></span><p>{error}</p><button className="button secondary" onClick={onRetry}>Thử lại</button></div>}
      {!loading && !error && filteredProducts.length === 0 && <div className="pos-inline-state"><span className="state-icon"><Icon name="search" size={22} /></span><h3>Không tìm thấy món</h3><p>Thử tìm bằng một tên khác.</p></div>}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="pos-product-grid">
          {filteredProducts.map((product, index) => (
            <button className="pos-product-card" key={product.id} onClick={() => onAdd(product)}>
              <span className={`pos-product-art visual-${(index % 3) + 1}`}><Icon name="cup" size={27} /></span>
              <span className="pos-product-info"><small>CÀ PHÊ</small><strong>{product.name}</strong><b>{Number(product.price).toLocaleString("vi-VN")} ₫</b></span>
              <span className="add-product-icon"><Icon name="plus" size={16} /></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductCatalog;
