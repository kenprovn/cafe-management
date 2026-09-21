import Icon from "../common/Icon";

function Header({ title, subtitle, user, onMenuClick }) {
  const today = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  return (
    <header className="topbar">
      <div className="topbar-title"><button className="icon-button menu-button" onClick={onMenuClick} aria-label="Mở menu"><Icon name="menu" /></button><div><h1>{title}</h1><p>{subtitle}</p></div></div>
      <div className="topbar-actions"><div className="date-block"><span>HÔM NAY</span><strong>{today}</strong></div><div className="header-user"><span className="avatar small">{user.full_name?.charAt(0).toUpperCase() || "U"}</span><div><strong>{user.full_name}</strong><span>{user.role === "admin" ? "Quản trị viên" : "Nhân viên"}</span></div></div></div>
    </header>
  );
}

export default Header;
