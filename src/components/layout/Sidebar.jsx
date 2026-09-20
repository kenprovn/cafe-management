import Icon from "../common/Icon";

const navItems = [
  { id: "dashboard", label: "Tổng quan", icon: "dashboard" },
  { id: "tables", label: "Quản lý bàn", icon: "tables" },
  { id: "products", label: "Quản lý món", icon: "products" },
];

const comingSoonItems = [
  { label: "Hóa đơn", icon: "receipt" },
  { label: "Nhân viên", icon: "users" },
];

function Sidebar({ currentPage, isOpen, onClose, onNavigate, onLogout, user }) {
  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? "visible" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Icon name="cup" size={25} /></span><div><strong>Roast & Co.</strong><span>Coffee Management</span></div></div>
        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          <span className="nav-label">QUẢN LÝ</span>
          {navItems.map((item) => <button key={item.id} className={`nav-item ${currentPage === item.id || (currentPage === "order" && item.id === "tables") ? "active" : ""}`} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
          <span className="nav-label secondary-label">SẮP RA MẮT</span>
          {comingSoonItems.map((item) => <button key={item.label} className="nav-item disabled" disabled title="Tính năng đang phát triển"><Icon name={item.icon} /><span>{item.label}</span><small>Sớm</small></button>)}
        </nav>
        <div className="sidebar-footer"><div className="sidebar-user"><span className="avatar">{user.full_name?.charAt(0).toUpperCase() || "U"}</span><div><strong>{user.full_name}</strong><span>{user.role === "admin" ? "Quản trị viên" : "Nhân viên"}</span></div></div><button className="logout-button" onClick={onLogout} aria-label="Đăng xuất"><Icon name="logout" size={19} /></button></div>
      </aside>
    </>
  );
}

export default Sidebar;
