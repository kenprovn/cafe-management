import Icon from "../common/Icon";

const navItems = [
  { id: "dashboard", label: "Tổng quan", icon: "dashboard", roles: ["admin", "staff"] },
  { id: "tables", label: "Quản lý bàn", icon: "tables", roles: ["admin", "staff"] },
  { id: "products", label: "Quản lý món", icon: "products", roles: ["admin"] },
  { id: "invoices", label: "Hóa đơn", icon: "receipt", roles: ["admin", "staff"] },
  { id: "employees", label: "Nhân viên", icon: "users", roles: ["admin"] },
  { id: "reports", label: "Báo cáo", icon: "report", roles: ["admin"] },
];

function Sidebar({ currentPage, isOpen, onClose, onNavigate, onLogout, user }) {
  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? "visible" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Icon name="cup" size={25} /></span><div><strong>Roast & Co.</strong><span>Coffee Management</span></div></div>
        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          <span className="nav-label">QUẢN LÝ</span>
          {navItems.filter((item) => item.roles.includes(user.role)).map((item) => <button key={item.id} className={`nav-item ${currentPage === item.id || (currentPage === "order" && item.id === "tables") || (currentPage === "invoiceDetail" && item.id === "invoices") ? "active" : ""}`} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
        </nav>
        <div className="sidebar-footer"><div className="sidebar-user"><span className="avatar">{user.full_name?.charAt(0).toUpperCase() || "U"}</span><div><strong>{user.full_name}</strong><span>{user.role === "admin" ? "Quản trị viên" : "Nhân viên"}</span></div></div><button className="logout-button" onClick={onLogout} aria-label="Đăng xuất"><Icon name="logout" size={19} /></button></div>
      </aside>
    </>
  );
}

export default Sidebar;
