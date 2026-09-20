import { useEffect, useState } from "react";
import "./App.css";
import ProductModal from "./components/common/ProductModal";
import { ErrorState, LoadingState } from "./components/common/StateMessage";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import OrderPage from "./pages/OrderPage";
import ProductsPage from "./pages/ProductsPage";
import TablesPage from "./pages/TablesPage";
import { completeOrder, createOrder, getActiveOrder, updateOrder } from "./services/api";

const PRODUCT_API = "http://localhost:5000/api/products";
const TABLE_API = "http://localhost:5000/api/tables";
const LOGIN_API = "http://localhost:5000/api/login";

const PAGE_DETAILS = {
  dashboard: { title: "Tổng quan", subtitle: "Theo dõi hoạt động của quán hôm nay" },
  tables: { title: "Quản lý bàn", subtitle: "Theo dõi và cập nhật trạng thái phục vụ" },
  products: { title: "Quản lý món", subtitle: "Quản lý thực đơn và giá bán tại quán" },
  order: { title: "Gọi món", subtitle: "Tạo và cập nhật đơn hàng tại bàn" },
};

function App() {
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [user, setUser] = useState(null);
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
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [tablesNotice, setTablesNotice] = useState("");

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const response = await fetch(PRODUCT_API);
      if (!response.ok) throw new Error("Không thể lấy danh sách món");
      setProducts(await response.json());
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
      const response = await fetch(TABLE_API);
      if (!response.ok) throw new Error("Không thể lấy danh sách bàn");
      setTables(await response.json());
    } catch (error) {
      console.error("Lỗi lấy danh sách bàn:", error);
      setTablesError("Không thể tải danh sách bàn. Vui lòng kiểm tra máy chủ.");
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const [productResult, tableResult] = await Promise.allSettled([
        fetch(PRODUCT_API).then((response) => {
          if (!response.ok) throw new Error("Không thể lấy danh sách món");
          return response.json();
        }),
        fetch(TABLE_API).then((response) => {
          if (!response.ok) throw new Error("Không thể lấy danh sách bàn");
          return response.json();
        }),
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

      setProductsLoading(false);
      setTablesLoading(false);
    };

    loadInitialData();
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: "", price: "" });
    setFormError("");
    setShowForm(true);
  };

  const handleEdit = (product) => {
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
    if (Number.isNaN(price) || price < 0) {
      setFormError("Giá món không hợp lệ.");
      return;
    }

    setFormLoading(true);
    try {
      const isEditing = editingId !== null;
      const response = await fetch(isEditing ? `${PRODUCT_API}/${editingId}` : PRODUCT_API, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim(), price }),
      });
      const result = await response.json();
      if (!response.ok) {
        setFormError(result.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", price: "" });
      await fetchProducts();
    } catch (error) {
      console.error("Lỗi:", error);
      setFormError("Không thể kết nối tới máy chủ.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa món này không?")) return;
    try {
      const response = await fetch(`${PRODUCT_API}/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Xóa thất bại!");
        return;
      }
      await fetchProducts();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể kết nối tới server!");
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
      : await createOrder(selectedTable.id, { ...payload, user_id: user.id });
    await fetchTables();
    return result.order;
  };

  const handleCompleteOrder = async (orderId) => {
    await completeOrder(orderId);
    await fetchTables();
    setTablesNotice(`Đã hoàn tất đơn hàng và trả ${selectedTable.table_number}.`);
    setSelectedTable(null);
    setActiveOrder(null);
    setCurrentPage("tables");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    if (!loginData.username || !loginData.password) {
      setLoginError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setLoginLoading(true);
    try {
      const response = await fetch(LOGIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const result = await response.json();
      if (!response.ok) {
        setLoginError(result.message || "Đăng nhập thất bại!");
        return;
      }
      setUser(result.user);
      setLoginData({ username: "", password: "" });
      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setLoginError("Không thể kết nối tới server!");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!user) {
    return <LoginPage loginData={loginData} setLoginData={setLoginData} loginError={loginError} loading={loginLoading} onSubmit={handleLogin} />;
  }

  const occupiedTables = tables.filter((table) => table.status === "Đang sử dụng").length;
  const pageDetails = currentPage === "order" && selectedTable
    ? { title: `Gọi món · ${selectedTable.table_number}`, subtitle: "Chọn món và cập nhật đơn hàng tại bàn" }
    : PAGE_DETAILS[currentPage];

  return (
    <div className="app-shell">
      <Sidebar currentPage={currentPage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={navigateTo} onLogout={() => { setUser(null); setCurrentPage("dashboard"); }} user={user} />
      <div className="app-content">
        <Header title={pageDetails.title} subtitle={pageDetails.subtitle} user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-content">
          {currentPage === "dashboard" && <DashboardPage products={products} productsError={productsError} productsLoading={productsLoading} occupiedTables={occupiedTables} totalTables={tables.length} onNavigate={navigateTo} onRetryProducts={fetchProducts} />}
          {currentPage === "products" && <ProductsPage products={products} error={productsError} loading={productsLoading} onAdd={handleAdd} onDelete={handleDelete} onEdit={handleEdit} onRetry={fetchProducts} />}
          {currentPage === "tables" && <TablesPage tables={tables} occupiedTables={occupiedTables} error={tablesError} loading={tablesLoading} notice={tablesNotice} onRetry={fetchTables} onOpenOrder={handleOpenTable} />}
          {currentPage === "order" && selectedTable && orderLoading && <section className="panel"><LoadingState label="Đang tải đơn hàng..." /></section>}
          {currentPage === "order" && selectedTable && !orderLoading && orderError && <section className="panel"><ErrorState message={orderError} onRetry={() => handleOpenTable(selectedTable)} /></section>}
          {currentPage === "order" && selectedTable && !orderLoading && !orderError && <OrderPage key={`${selectedTable.id}-${activeOrder?.id || "new"}`} table={selectedTable} order={activeOrder} products={products} productsLoading={productsLoading} productsError={productsError} onBack={() => setCurrentPage("tables")} onRetryProducts={fetchProducts} onSave={handleSaveOrder} onComplete={handleCompleteOrder} />}
        </main>
      </div>
      {showForm && <ProductModal editing={editingId !== null} error={formError} formData={formData} loading={formLoading} onChange={(event) => setFormData({ ...formData, [event.target.name]: event.target.value })} onClose={closeForm} onSubmit={handleSubmit} />}
    </div>
  );
}

export default App;
