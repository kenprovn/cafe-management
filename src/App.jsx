import { useEffect, useState } from "react";
import "./App.css";

const PRODUCT_API = "http://localhost:5000/api/products";
const TABLE_API = "http://localhost:5000/api/tables";
const LOGIN_API = "http://localhost:5000/api/login";

function App() {
  // =========================
  // STATE
  // =========================
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [user, setUser] = useState(null);

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
  });

  // =========================
  // LẤY DANH SÁCH MÓN
  // =========================
  const fetchProducts = async () => {
    try {
      const response = await fetch(PRODUCT_API);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách món");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
    }
  };

  // =========================
  // LẤY DANH SÁCH BÀN
  // =========================
  const fetchTables = async () => {
    try {
      const response = await fetch(TABLE_API);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách bàn");
      }

      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách bàn:", error);
    }
  };

  // =========================
  // LOAD DỮ LIỆU
  // =========================
  useEffect(() => {
    fetchProducts();
    fetchTables();
  }, []);

  // =========================
  // XỬ LÝ INPUT MÓN
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // THÊM MÓN
  // =========================
  const handleAdd = () => {
    setEditingId(null);

    setFormData({
      name: "",
      price: "",
    });

    setShowForm(true);
  };

  // =========================
  // SỬA MÓN
  // =========================
  const handleEdit = (product) => {
    setEditingId(product.id);

    setFormData({
      name: product.name,
      price: product.price,
    });

    setShowForm(true);
  };

  // =========================
  // THÊM / SỬA MÓN
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.price === "") {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const price = Number(formData.price);

    if (Number.isNaN(price) || price < 0) {
      alert("Giá không hợp lệ!");
      return;
    }

    try {
      let response;

      if (editingId !== null) {
        response = await fetch(`${PRODUCT_API}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            price: price,
          }),
        });
      } else {
        response = await fetch(PRODUCT_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            price: price,
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Có lỗi xảy ra!");
        return;
      }

      alert(
        editingId !== null
          ? "Cập nhật món thành công!"
          : "Thêm món thành công!",
      );

      setShowForm(false);
      setEditingId(null);

      setFormData({
        name: "",
        price: "",
      });

      fetchProducts();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể kết nối tới server!");
    }
  };

  // =========================
  // XÓA MÓN
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa món này không?");

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${PRODUCT_API}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Xóa thất bại!");
        return;
      }

      alert("Xóa món thành công!");

      fetchProducts();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể kết nối tới server!");
    }
  };

  // =========================
  // ĐỔI TRẠNG THÁI BÀN
  // =========================
  const handleToggleTable = async (table) => {
    const newStatus = table.status === "Trống" ? "Đang sử dụng" : "Trống";

    try {
      const response = await fetch(`${TABLE_API}/${table.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Không thể cập nhật bàn!");
        return;
      }

      fetchTables();
    } catch (error) {
      console.error("Lỗi cập nhật bàn:", error);
      alert("Không thể kết nối tới server!");
    }
  };

  // =========================
  // ĐĂNG NHẬP
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginError("");

    if (!loginData.username || !loginData.password) {
      setLoginError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const response = await fetch(LOGIN_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginError(result.message || "Đăng nhập thất bại!");
        return;
      }

      setUser(result.user);

      setLoginData({
        username: "",
        password: "",
      });

      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setLoginError("Không thể kết nối tới server!");
    }
  };

  // =========================
  // ĐĂNG XUẤT
  // =========================
  const handleLogout = () => {
    setUser(null);
    setCurrentPage("dashboard");
  };

  // =========================
  // THỐNG KÊ BÀN
  // =========================
  const occupiedTables = tables.filter(
    (table) => table.status === "Đang sử dụng",
  ).length;

  const totalTables = tables.length;

  // =========================
  // LOGIN SCREEN
  // QUAN TRỌNG: NẰM TRƯỚC return()
  // =========================
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-box">
          <div className="login-logo">☕</div>

          <h1>Coffee Manager</h1>

          <p>Đăng nhập hệ thống quản lý</p>

          <form onSubmit={handleLogin}>
            <label>Tên đăng nhập</label>

            <input
              type="text"
              value={loginData.username}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  username: e.target.value,
                })
              }
              placeholder="Nhập tên đăng nhập"
            />

            <label>Mật khẩu</label>

            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value,
                })
              }
              placeholder="Nhập mật khẩu"
            />

            {loginError && <p className="login-error">{loginError}</p>}

            <button type="submit">Đăng nhập</button>
          </form>

          <div className="demo-account">
            <p>Tài khoản demo:</p>
            <p>Admin: admin / admin123</p>
            <p>Nhân viên: nhanvien / 123456</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN APP
  // =========================
  return (
    <div className="app">
      {/* =========================
          SIDEBAR
      ========================= */}
      <aside className="sidebar">
        <div className="logo">
          ☕ Coffee
          <br />
          Manager
        </div>

        <div className="user-info">
          <strong>{user.full_name}</strong>

          <span>{user.role === "admin" ? "Quản trị viên" : "Nhân viên"}</span>
        </div>

        <nav>
          <a
            className={currentPage === "dashboard" ? "active" : ""}
            onClick={() => setCurrentPage("dashboard")}
          >
            Dashboard
          </a>

          <a
            className={currentPage === "tables" ? "active" : ""}
            onClick={() => setCurrentPage("tables")}
          >
            Quản lý bàn
          </a>

          <a
            className={currentPage === "products" ? "active" : ""}
            onClick={() => setCurrentPage("products")}
          >
            Quản lý món
          </a>

          <a>Hóa đơn</a>

          <a>Nhân viên</a>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}
      <main className="main">
        {/* =========================
            DASHBOARD
        ========================= */}
        {currentPage === "dashboard" && (
          <>
            <header className="header">
              <h1>Dashboard</h1>

              <p>Quản lý quán cà phê</p>
            </header>

            <section className="stats">
              <div className="card">
                <span>💰</span>

                <div>
                  <p>Doanh thu hôm nay</p>

                  <h2>2.500.000 VNĐ</h2>
                </div>
              </div>

              <div className="card">
                <span>🧾</span>

                <div>
                  <p>Số món</p>

                  <h2>{products.length}</h2>
                </div>
              </div>

              <div className="card">
                <span>🪑</span>

                <div>
                  <p>Bàn đang sử dụng</p>

                  <h2>
                    {occupiedTables} / {totalTables}
                  </h2>
                </div>
              </div>
            </section>

            <section className="products-section">
              <div className="section-header">
                <h2>Món nổi bật</h2>

                <button onClick={() => setCurrentPage("products")}>
                  Xem quản lý món
                </button>
              </div>

              <div className="product-grid">
                {products.slice(0, 3).map((product) => (
                  <div className="product-card" key={product.id}>
                    <div className="product-icon">☕</div>

                    <h3>{product.name}</h3>

                    <p>{Number(product.price).toLocaleString("vi-VN")} VNĐ</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* =========================
            QUẢN LÝ BÀN
        ========================= */}
        {currentPage === "tables" && (
          <>
            <header className="header">
              <h1>Quản lý bàn</h1>

              <p>Quản lý trạng thái các bàn trong quán</p>
            </header>

            <section className="tables-section">
              <div className="table-summary">
                <div className="summary-item">
                  <span>🪑</span>

                  <div>
                    <p>Tổng số bàn</p>

                    <h3>{totalTables}</h3>
                  </div>
                </div>

                <div className="summary-item">
                  <span>✅</span>

                  <div>
                    <p>Bàn trống</p>

                    <h3>{totalTables - occupiedTables}</h3>
                  </div>
                </div>

                <div className="summary-item">
                  <span>🔴</span>

                  <div>
                    <p>Đang sử dụng</p>

                    <h3>{occupiedTables}</h3>
                  </div>
                </div>
              </div>

              <div className="table-grid">
                {tables.map((table) => {
                  const isEmpty = table.status === "Trống";

                  return (
                    <div
                      className={`table-card ${isEmpty ? "empty" : "busy"}`}
                      key={table.id}
                    >
                      <div className="table-icon">🪑</div>

                      <h3>{table.table_number}</h3>

                      <span className="table-status">{table.status}</span>

                      <button
                        className="table-button"
                        onClick={() => handleToggleTable(table)}
                      >
                        {isEmpty ? "Bàn đang trống" : "Bàn đang sử dụng"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* =========================
            QUẢN LÝ MÓN
        ========================= */}
        {currentPage === "products" && (
          <>
            <header className="header">
              <h1>Quản lý món</h1>

              <p>Thêm, sửa và xóa món trong quán</p>
            </header>

            <section className="products-section">
              <div className="section-header">
                <h2>Danh sách món</h2>

                <button onClick={handleAdd}>+ Thêm món</button>
              </div>

              <div className="product-grid">
                {products.map((product) => (
                  <div className="product-card" key={product.id}>
                    <div className="product-icon">☕</div>

                    <h3>{product.name}</h3>

                    <p>{Number(product.price).toLocaleString("vi-VN")} VNĐ</p>

                    <div className="product-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(product)}
                      >
                        ✏️ Sửa
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(product.id)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* =========================
            FORM THÊM / SỬA
        ========================= */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>{editingId !== null ? "Sửa món" : "Thêm món"}</h2>

              <form onSubmit={handleSubmit}>
                <label>Tên món</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập tên món"
                />

                <label>Giá</label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Nhập giá"
                  min="0"
                />

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowForm(false)}
                  >
                    Hủy
                  </button>

                  <button type="submit" className="save-btn">
                    {editingId !== null ? "Cập nhật" : "Thêm món"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
