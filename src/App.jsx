import { useEffect, useState } from "react";
import "./App.css";
import ConfirmDialog from "./components/common/ConfirmDialog";
import ProductModal from "./components/common/ProductModal";
import { ErrorState, LoadingState } from "./components/common/StateMessage";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import OrderPage from "./pages/OrderPage";
import ProductsPage from "./pages/ProductsPage";
import ReportsPage from "./pages/ReportsPage";
import TablesPage from "./pages/TablesPage";
import {
  checkoutOrder,
  clearStoredToken,
  createOrder,
  createProduct,
  deleteProduct,
  getActiveOrder,
  getCurrentUser,
  getDashboardSummary,
  getInvoice,
  getInvoices,
  getProducts,
  getStoredToken,
  getTables,
  login,
  logout,
  setUnauthorizedHandler,
  storeToken,
  updateOrder,
  updateProduct,
} from "./services/api";

const PAGE_DETAILS = {
  dashboard: { title: "Tổng quan", subtitle: "Theo dõi hoạt động của quán hôm nay" },
  tables: { title: "Quản lý bàn", subtitle: "Theo dõi và cập nhật trạng thái phục vụ" },
  products: { title: "Quản lý món", subtitle: "Quản lý thực đơn và giá bán tại quán" },
  order: { title: "Gọi món", subtitle: "Tạo và cập nhật đơn hàng tại bàn" },
  invoices: { title: "Hóa đơn", subtitle: "Tra cứu lịch sử thanh toán của quán" },
  invoiceDetail: { title: "Chi tiết hóa đơn", subtitle: "Thông tin thanh toán và các món đã phục vụ" },
  employees: { title: "Quản lý nhân viên", subtitle: "Tài khoản, vai trò và trạng thái đội ngũ" },
  reports: { title: "Báo cáo", subtitle: "Phân tích doanh thu và hiệu quả vận hành" },
};

const productNameKey = (value) => value.trim().replace(/\s+/g, " ").normalize("NFC").toLocaleLowerCase("vi-VN");

function App() {
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [tablesError, setTablesError] = useState("");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productDeleteError, setProductDeleteError] = useState("");
  const [productDeleteLoading, setProductDeleteLoading] = useState(false);
  const [productNotice, setProductNotice] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [tablesNotice, setTablesNotice] = useState("");
  const [dashboardSummary, setDashboardSummary] = useState({ today_revenue: 0, paid_orders_today: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [invoiceFilters, setInvoiceFilters] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      setProducts(await getProducts());
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
      setProductsError("Không thể tải danh sách món. Vui lòng kiểm tra máy chủ.");
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchTables = async () => {
    setTablesLoading(true);
    setTablesError("");
    try {
      setTables(await getTables());
    } catch (error) {
      console.error("Lỗi lấy danh sách bàn:", error);
      setTablesError("Không thể tải danh sách bàn. Vui lòng kiểm tra máy chủ.");
    } finally {
      setTablesLoading(false);
    }
  };

  const fetchDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError("");
    try {
      setDashboardSummary(await getDashboardSummary());
    } catch (error) {
      console.error("Lỗi lấy doanh thu:", error);
      setDashboardError(error.message || "Không thể tải doanh thu hôm nay.");
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchInvoiceList = async (filters = invoiceFilters) => {
    setInvoicesLoading(true);
    setInvoicesError("");
    try {
      const result = await getInvoices(filters);
      setInvoices(result.invoices);
      setInvoiceFilters(filters);
    } catch (error) {
      setInvoicesError(error.message);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setCurrentPage("dashboard");
      setLoginError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (!getStoredToken()) {
        setAuthLoading(false);
        return;
      }
      try {
        const result = await getCurrentUser();
        setUser(result.user);
      } catch (error) {
        if (error.status !== 401) setLoginError("Không thể khôi phục phiên đăng nhập.");
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadInitialData = async () => {
      setProductsLoading(true);
      setTablesLoading(true);
      setDashboardLoading(true);
      setDashboardError("");
      const [productResult, tableResult, dashboardResult] = await Promise.allSettled([
        getProducts(),
        getTables(),
        getDashboardSummary(),
      ]);

      if (productResult.status === "fulfilled") {
        setProducts(productResult.value);
      } else {
        console.error("Lỗi lấy sản phẩm:", productResult.reason);
        setProductsError("Không thể tải danh sách món. Vui lòng kiểm tra máy chủ.");
      }

      if (tableResult.status === "fulfilled") {
        setTables(tableResult.value);
      } else {
        console.error("Lỗi lấy danh sách bàn:", tableResult.reason);
        setTablesError("Không thể tải danh sách bàn. Vui lòng kiểm tra máy chủ.");
      }

      if (dashboardResult.status === "fulfilled") {
        setDashboardSummary(dashboardResult.value);
      } else {
        console.error("Lỗi lấy doanh thu:", dashboardResult.reason);
        setDashboardError(dashboardResult.reason.message || "Không thể tải doanh thu hôm nay.");
      }

      setProductsLoading(false);
      setTablesLoading(false);
      setDashboardLoading(false);
    };

    loadInitialData();
  }, [user]);

  const navigateTo = (page) => {
    if (["products", "employees", "reports"].includes(page) && user.role !== "admin") {
      setCurrentPage("dashboard");
      setSidebarOpen(false);
      return;
    }
    setCurrentPage(page);
    setSidebarOpen(false);
    if (page === "invoices") fetchInvoiceList();
  };

  const handleAdd = () => {
    setProductNotice("");
    setEditingId(null);
    setFormData({ name: "", price: "" });
    setFormError("");
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setProductNotice("");
    setEditingId(product.id);
    setFormData({ name: product.name, price: product.price });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;
    setShowForm(false);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!formData.name.trim() || formData.price === "") {
      setFormError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    const price = Number(formData.price);
    if (!Number.isFinite(price) || price <= 0 || price > 99999999.99 || !Number.isInteger(price * 100)) {
      setFormError("Giá bán phải lớn hơn 0 và có tối đa 2 chữ số thập phân.");
      return;
    }
    const normalizedName = formData.name.trim().replace(/\s+/g, " ").normalize("NFC");
    const duplicate = products.some((product) => product.id !== editingId && productNameKey(product.name) === productNameKey(normalizedName));
    if (duplicate) {
      setFormError("Tên món đã tồn tại trong thực đơn.");
      return;
    }

    setFormLoading(true);
    try {
      const isEditing = editingId !== null;
      if (isEditing) await updateProduct(editingId, { name: normalizedName, price });
      else await createProduct({ name: normalizedName, price });
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", price: "" });
      await fetchProducts();
      setProductNotice(isEditing ? "Đã cập nhật món thành công." : "Đã thêm món mới vào thực đơn.");
    } catch (error) {
      console.error("Lỗi:", error);
      setFormError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (product) => {
    setProductDeleteError("");
    setProductNotice("");
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    setProductDeleteLoading(true);
    setProductDeleteError("");
    try {
      await deleteProduct(productToDelete.id);
      await fetchProducts();
      setProductNotice(`Đã xóa ${productToDelete.name} khỏi thực đơn.`);
      setProductToDelete(null);
    } catch (error) {
      console.error("Lỗi:", error);
      setProductDeleteError(error.message);
    } finally {
      setProductDeleteLoading(false);
    }
  };

  const handleOpenTable = async (table) => {
    setSelectedTable(table);
    setActiveOrder(null);
    setOrderError("");
    setTablesNotice("");
    setCurrentPage("order");
    setSidebarOpen(false);

    if (table.status === "Trống") return;

    setOrderLoading(true);
    try {
      const result = await getActiveOrder(table.id);
      setActiveOrder(result.order);
    } catch (error) {
      setOrderError(error.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSaveOrder = async (order, payload) => {
    const result = order
      ? await updateOrder(order.id, payload)
      : await createOrder(selectedTable.id, payload);
    await fetchTables();
    return result.order;
  };

  const handleCheckoutOrder = async (orderId, paymentMethod) => {
    const result = await checkoutOrder(orderId, {
      payment_method: paymentMethod,
    });
    await Promise.all([fetchTables(), fetchDashboard(), fetchInvoiceList({})]);
    setSelectedTable(null);
    setActiveOrder(null);
    setSelectedInvoice(result.invoice);
    setSelectedInvoiceId(result.invoice.invoice_id);
    setCurrentPage("invoiceDetail");
    return result.invoice;
  };

  const handleOpenInvoice = async (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setSelectedInvoice(null);
    setInvoiceLoading(true);
    setInvoiceError("");
    setCurrentPage("invoiceDetail");
    try {
      const result = await getInvoice(invoiceId);
      setSelectedInvoice(result.invoice);
    } catch (error) {
      setInvoiceError(error.message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    if (!loginData.username || !loginData.password) {
      setLoginError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    const credentials = { ...loginData };
    setLoginData({ username: "", password: "" });
    setLoginLoading(true);
    try {
      const result = await login(credentials);
      storeToken(result.token);
      setUser(result.user);
      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setLoginError(error.message || "Không thể kết nối tới server!");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      if (error.status !== 401) console.error("Lỗi đăng xuất:", error);
    } finally {
      clearStoredToken();
      setUser(null);
      setCurrentPage("dashboard");
      setProducts([]);
      setTables([]);
      setInvoices([]);
    }
  };

  if (authLoading) {
    return <main className="auth-restoring"><span className="button-spinner" /><p>Đang khôi phục phiên đăng nhập...</p></main>;
  }

  if (!user) {
    return <LoginPage loginData={loginData} setLoginData={setLoginData} loginError={loginError} loading={loginLoading} onSubmit={handleLogin} />;
  }

  const occupiedTables = tables.filter((table) => table.status === "Đang sử dụng").length;
  const pageDetails = currentPage === "order" && selectedTable
    ? { title: `Gọi món · ${selectedTable.table_number}`, subtitle: "Chọn món và cập nhật đơn hàng tại bàn" }
    : PAGE_DETAILS[currentPage];

  return (
    <div className="app-shell">
      <Sidebar currentPage={currentPage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={navigateTo} onLogout={handleLogout} user={user} />
      <div className="app-content">
        <Header title={pageDetails.title} subtitle={pageDetails.subtitle} user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-content">
          {currentPage === "dashboard" && <DashboardPage products={products} productsError={productsError} productsLoading={productsLoading} dashboardSummary={dashboardSummary} dashboardLoading={dashboardLoading} dashboardError={dashboardError} occupiedTables={occupiedTables} totalTables={tables.length} onNavigate={navigateTo} onRetryProducts={fetchProducts} onRetryDashboard={fetchDashboard} canManageProducts={user.role === "admin"} />}
          {currentPage === "products" && user.role === "admin" && <ProductsPage products={products} error={productsError} loading={productsLoading} notice={productNotice} onAdd={handleAdd} onDelete={handleDelete} onEdit={handleEdit} onRetry={fetchProducts} />}
          {currentPage === "tables" && <TablesPage tables={tables} occupiedTables={occupiedTables} error={tablesError} loading={tablesLoading} notice={tablesNotice} onRetry={fetchTables} onOpenOrder={handleOpenTable} />}
          {currentPage === "order" && selectedTable && orderLoading && <section className="panel"><LoadingState label="Đang tải đơn hàng..." /></section>}
          {currentPage === "order" && selectedTable && !orderLoading && orderError && <section className="panel"><ErrorState message={orderError} onRetry={() => handleOpenTable(selectedTable)} /></section>}
          {currentPage === "order" && selectedTable && !orderLoading && !orderError && <OrderPage key={`${selectedTable.id}-${activeOrder?.id || "new"}`} table={selectedTable} order={activeOrder} user={user} products={products} productsLoading={productsLoading} productsError={productsError} onBack={() => setCurrentPage("tables")} onRetryProducts={fetchProducts} onSave={handleSaveOrder} onCheckout={handleCheckoutOrder} />}
          {currentPage === "invoices" && <InvoicesPage invoices={invoices} loading={invoicesLoading} error={invoicesError} onSearch={fetchInvoiceList} onRetry={() => fetchInvoiceList(invoiceFilters)} onOpen={handleOpenInvoice} />}
          {currentPage === "invoiceDetail" && <InvoiceDetailPage invoice={selectedInvoice} loading={invoiceLoading} error={invoiceError} onBack={() => { setCurrentPage("invoices"); fetchInvoiceList(invoiceFilters); }} onRetry={() => handleOpenInvoice(selectedInvoiceId)} />}
          {currentPage === "employees" && user.role === "admin" && <EmployeesPage currentUser={user} />}
          {currentPage === "reports" && user.role === "admin" && <ReportsPage />}
        </main>
      </div>
      {showForm && <ProductModal editing={editingId !== null} error={formError} formData={formData} loading={formLoading} onChange={(event) => setFormData({ ...formData, [event.target.name]: event.target.value })} onClose={closeForm} onSubmit={handleSubmit} />}
      {productToDelete && <ConfirmDialog title="Xóa món khỏi thực đơn?" message={`Bạn sắp xóa ${productToDelete.name}. Các hóa đơn cũ vẫn giữ nguyên tên và giá món đã bán.`} confirmLabel="Xóa món" tone="danger" loading={productDeleteLoading} error={productDeleteError} onCancel={() => { if (!productDeleteLoading) { setProductToDelete(null); setProductDeleteError(""); } }} onConfirm={confirmDeleteProduct} />}
    </div>
  );
}

export default App;
