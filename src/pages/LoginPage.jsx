import Icon from "../components/common/Icon";

function LoginPage({ loginData, setLoginData, loginError, loading, onSubmit }) {
  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-brand"><span className="brand-mark light"><Icon name="cup" size={25} /></span><div><strong>Roast & Co.</strong><span>Coffee Management</span></div></div>
        <div className="showcase-copy"><span className="eyebrow light-text">QUẢN LÝ THÔNG MINH</span><h1>Mỗi tách cà phê,<br />một trải nghiệm trọn vẹn.</h1><p>Vận hành quán của bạn đơn giản, hiệu quả và đầy cảm hứng trong một không gian quản lý duy nhất.</p></div>
        <div className="coffee-illustration"><div className="steam one" /><div className="steam two" /><div className="cup-art"><span /></div><div className="saucer" /></div>
        <p className="showcase-footer">© 2026 Roast & Co. Coffee</p>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-login-brand"><span className="brand-mark"><Icon name="cup" size={23} /></span><strong>Roast & Co.</strong></div>
          <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span><h2>Đăng nhập tài khoản</h2><p className="login-intro">Nhập thông tin của bạn để tiếp tục quản lý cửa hàng.</p>
          <form onSubmit={onSubmit}>
            <div className="field-group"><label htmlFor="username">Tên đăng nhập</label><input id="username" type="text" autoComplete="username" value={loginData.username} onChange={(event) => setLoginData({ ...loginData, username: event.target.value })} placeholder="Nhập tên đăng nhập" /></div>
            <div className="field-group"><label htmlFor="password">Mật khẩu</label><input id="password" type="password" autoComplete="current-password" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} placeholder="Nhập mật khẩu" /></div>
            {loginError && <div className="form-error"><Icon name="alert" size={17} />{loginError}</div>}
            <button className="button primary login-submit" type="submit" disabled={loading}>{loading && <span className="button-spinner" />}{loading ? "Đang đăng nhập..." : "Đăng nhập"}<Icon name="arrow" size={18} /></button>
          </form>
          <div className="demo-account"><span>TÀI KHOẢN DÙNG THỬ</span><div><p><strong>Quản trị</strong> admin / admin123</p><p><strong>Nhân viên</strong> nhanvien / 123456</p></div></div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
