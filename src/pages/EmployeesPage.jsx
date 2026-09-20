import { useEffect, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Icon from "../components/common/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/common/StateMessage";
import EmployeeModal from "../components/employee/EmployeeModal";
import { createUser, getUsers, resetUserPassword, updateUser, updateUserStatus } from "../services/api";

const formatDate = (value) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));

function EmployeesPage({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const loadEmployees = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const result = await getUsers(nextFilters);
      setEmployees(result.users);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getUsers({ search: "", role: "", status: "" })
      .then((result) => { if (active) setEmployees(result.users); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submitFilters = (event) => {
    event.preventDefault();
    loadEmployees(filters);
  };

  const submitEmployee = async (payload) => {
    setSaving(true);
    setModalError("");
    try {
      if (modal.mode === "create") await createUser(payload);
      if (modal.mode === "edit") await updateUser(modal.employee.id, payload);
      if (modal.mode === "password") await resetUserPassword(modal.employee.id, payload.password);
      setNotice(modal.mode === "create" ? "Đã tạo tài khoản nhân viên." : modal.mode === "password" ? "Đã đặt lại mật khẩu và thu hồi các phiên cũ." : "Đã cập nhật thông tin nhân viên.");
      setModal(null);
      await loadEmployees(filters);
    } catch (saveError) {
      setModalError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async () => {
    const target = confirmation;
    setSaving(true);
    try {
      await updateUserStatus(target.employee.id, target.nextStatus);
      setNotice(target.nextStatus === "ACTIVE" ? "Đã kích hoạt lại tài khoản." : "Đã vô hiệu hóa tài khoản và thu hồi toàn bộ phiên đăng nhập.");
      setConfirmation(null);
      await loadEmployees(filters);
    } catch (statusError) {
      setConfirmation(null);
      setError(statusError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel data-panel employees-page">
      <div className="panel-header"><div><span className="eyebrow">ĐỘI NGŨ ROAST & CO.</span><h2>Quản lý nhân viên</h2><p>{loading ? "Đang cập nhật..." : `${employees.length} tài khoản phù hợp`}</p></div><button className="button primary" onClick={() => { setModalError(""); setModal({ mode: "create" }); }}><Icon name="userPlus" size={18} /> Thêm nhân viên</button></div>
      <form className="employee-filters" onSubmit={submitFilters}>
        <label className="search-box"><Icon name="search" size={17} /><input aria-label="Tìm nhân viên" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tìm ID, tên đăng nhập hoặc họ tên..." /></label>
        <select aria-label="Lọc vai trò" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}><option value="">Mọi vai trò</option><option value="admin">Quản trị viên</option><option value="staff">Nhân viên</option></select>
        <select aria-label="Lọc trạng thái" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Mọi trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="DISABLED">Đã vô hiệu hóa</option></select>
        <button className="button secondary" type="submit"><Icon name="filter" size={16} /> Lọc</button>
      </form>
      {notice && <div className="order-feedback success employee-notice"><Icon name="check" size={17} />{notice}</div>}
      {loading && <LoadingState label="Đang tải danh sách nhân viên..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => loadEmployees(filters)} />}
      {!loading && !error && employees.length === 0 && <EmptyState title="Không tìm thấy nhân viên" message="Thử thay đổi từ khóa hoặc bộ lọc để xem kết quả khác." />}
      {!loading && !error && employees.length > 0 && <div className="table-wrap"><table className="data-table employee-table"><thead><tr><th>ID</th><th>NHÂN VIÊN</th><th>VAI TRÒ</th><th>NGÀY TẠO</th><th>TRẠNG THÁI</th><th className="actions-column">THAO TÁC</th></tr></thead><tbody>{employees.map((employee) => {
        const isSelf = employee.id === currentUser.id;
        const nextStatus = employee.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
        return <tr key={employee.id} className={employee.status === "DISABLED" ? "disabled-row" : ""}><td>#{String(employee.id).padStart(3, "0")}</td><td><div className="employee-cell"><span className="employee-avatar">{employee.full_name.charAt(0).toUpperCase()}</span><div><strong>{employee.full_name}{isSelf && <small>Bạn</small>}</strong><span>@{employee.username}</span></div></div></td><td><span className={`role-badge ${employee.role}`}><Icon name={employee.role === "admin" ? "shield" : "users"} size={14} />{employee.role === "admin" ? "Quản trị viên" : "Nhân viên"}</span></td><td>{formatDate(employee.created_at)}</td><td><span className={`status-badge ${employee.status === "ACTIVE" ? "available" : "disabled"}`}><span className="status-dot" />{employee.status === "ACTIVE" ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span></td><td><div className="row-actions"><button className="icon-button edit-action" onClick={() => { setModalError(""); setModal({ mode: "edit", employee }); }} aria-label={`Sửa ${employee.full_name}`}><Icon name="edit" size={17} /></button><button className="icon-button key-action" onClick={() => { setModalError(""); setModal({ mode: "password", employee }); }} aria-label={`Đặt lại mật khẩu ${employee.full_name}`}><Icon name="key" size={17} /></button><button className={`icon-button ${nextStatus === "DISABLED" ? "delete-action" : "enable-action"}`} disabled={isSelf && nextStatus === "DISABLED"} title={isSelf && nextStatus === "DISABLED" ? "Không thể tự vô hiệu hóa" : ""} onClick={() => setConfirmation({ employee, nextStatus })} aria-label={`${nextStatus === "DISABLED" ? "Vô hiệu hóa" : "Kích hoạt"} ${employee.full_name}`}><Icon name={nextStatus === "DISABLED" ? "lock" : "unlock"} size={17} /></button></div></td></tr>;
      })}</tbody></table></div>}
      {modal && <EmployeeModal key={`${modal.mode}-${modal.employee?.id || "new"}`} mode={modal.mode} employee={modal.employee} error={modalError} loading={saving} onClose={() => !saving && setModal(null)} onSubmit={submitEmployee} />}
      {confirmation && <ConfirmDialog title={confirmation.nextStatus === "DISABLED" ? "Vô hiệu hóa tài khoản?" : "Kích hoạt lại tài khoản?"} message={confirmation.nextStatus === "DISABLED" ? `Tất cả phiên đăng nhập của ${confirmation.employee.full_name} sẽ bị thu hồi ngay lập tức. Dữ liệu lịch sử vẫn được giữ nguyên.` : `${confirmation.employee.full_name} sẽ có thể đăng nhập lại vào hệ thống.`} confirmLabel={confirmation.nextStatus === "DISABLED" ? "Vô hiệu hóa" : "Kích hoạt"} tone={confirmation.nextStatus === "DISABLED" ? "danger" : "success"} loading={saving} onCancel={() => !saving && setConfirmation(null)} onConfirm={changeStatus} />}
    </section>
  );
}

export default EmployeesPage;
