import "./App.css";
import ProductCatalog from "./components/order/ProductCatalog";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";

const products = [
  { id: 1, name: "Cà phê đen", price: 25000, image_url: "/images/products/ca-phe-den.jpg" },
  { id: 2, name: "Cà phê sữa", price: 30000, image_url: "/images/products/ca-phe-sua.jpg" },
  { id: 3, name: "Bạc xỉu", price: 35000, image_url: "/images/products/bac-xiu.jpg" },
  { id: 999, name: "Kiểm tra ảnh lỗi", price: 0, image_url: "/images/products/khong-ton-tai.jpg" },
];

function ImageVerification() {
  return (
    <main className="main-content" style={{ padding: 24 }}>
      <h1>Kiểm tra ảnh sản phẩm</h1>
      <DashboardPage products={products} productsError="" productsLoading={false} dashboardSummary={{ today_revenue: 0, paid_orders_today: 0 }} dashboardLoading={false} dashboardError="" occupiedTables={0} totalTables={10} onNavigate={() => {}} onRetryProducts={() => {}} onRetryDashboard={() => {}} canManageProducts />
      <ProductsPage products={products} error="" loading={false} notice="" onAdd={() => {}} onDelete={() => {}} onEdit={() => {}} onRetry={() => {}} />
      <ProductCatalog products={products} loading={false} error="" onAdd={() => {}} onRetry={() => {}} />
    </main>
  );
}

export default ImageVerification;
