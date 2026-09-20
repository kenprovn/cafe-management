import { useState } from "react";
import Icon from "../common/Icon";

function EmployeeModal({ mode, employee, error, loading, onClose, onSubmit }) {
  const [form, setForm] = useState({
    username: employee?.username || "",
    full_name: employee?.full_name || "",
    role: employee?.role || "staff",
    password: "",
  });

  const titles = {
    create: ["THÊM NHÂN VIÊN", "Tạo tài khoản nhân viên"],
    edit: ["CHỈNH SỬA", "Cập nhật nhân viên"],
    password: ["BẢO MẬT", "Đặt lại mật khẩu"],
  };

  const submit = (event) => {
    event.preventDefault();
    const payload = mode === "password"
      ? { password: form.password }
      : mode === "edit"
        ? { full_name: form.full_name, role: form.role }
        : { username: form.username, full_name: form.full_name, role: form.role, password: form.password };
    setForm((current) => ({ ...current, password: "" }));
    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section className="modal employee-modal" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title">
        <div className="modal-header">
          <div><span className="eyebrow">{titles[mode][0]}</span><h2 id="employee-modal-title">{titles[mode][1]}</h2><p>{mode === "password" ? `Tạo mật khẩu mới cho ${employee.full_name}.` : "Thông tin tài khoản dùng để đăng nhập hệ thống."}</p></div>
          <button className="icon-button" type="button" onClick={onClose} disabled={loading} aria-label="Đóng"><Icon name="close" /></button>
        </div>
        <form onSubmit={submit}>
          {mode === "create" && <div className="field-group"><label htmlFor="employee-username">Tên đăng nhập</label><input id="employee-username" autoFocus value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="off" placeholder="Ví dụ: nguyenvana" maxLength="50" /></div>}
          {mode !== "password" && <div className="field-group"><label htmlFor="employee-full-name">Họ và tên</label><input id="employee-full-name" autoFocus={mode === "edit"} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Nhập họ và tên" maxLength="100" /></div>}
          {mode !== "password" && <div className="field-group"><label htmlFor="employee-role">Vai trò</label><select id="employee-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="staff">Nhân viên</option><option value="admin">Quản trị viên</option></select></div>}
          {(mode === "create" || mode === "password") && <div className="field-group"><label htmlFor="employee-password">{mode === "password" ? "Mật khẩu mới" : "Mật khẩu ban đầu"}</label><input id="employee-password" autoFocus={mode === "password"} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" minLength="8" maxLength="128" /></div>}
          {error && <div className="form-error"><Icon name="alert" size={17} />{error}</div>}
          <div className="modal-actions"><button className="button ghost" type="button" onClick={onClose} disabled={loading}>Hủy</button><button className="button primary" type="submit" disabled={loading}>{loading && <span className="button-spinner" />}{loading ? "Đang lưu..." : mode === "create" ? "Tạo tài khoản" : mode === "password" ? "Đặt lại mật khẩu" : "Lưu thay đổi"}</button></div>
        </form>
      </section>
    </div>
  );
}

export default EmployeeModal;
