const API_BASE = "http://localhost:5000/api";
const TOKEN_KEY = "roast-co-session";

let unauthorizedHandler = null;

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const storeToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);
export const setUnauthorizedHandler = (handler) => { unauthorizedHandler = handler; };

async function request(path, options = {}, { authenticated = true } = {}) {
  const headers = new Headers(options.headers || {});
  if (authenticated) {
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let result = {};
  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      clearStoredToken();
      unauthorizedHandler?.();
    }
    const error = new Error(result.message || "Có lỗi xảy ra khi kết nối máy chủ");
    error.status = response.status;
    error.code = result.code;
    throw error;
  }
  return result;
}

const jsonOptions = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const login = (credentials) => request("/login", jsonOptions("POST", credentials), { authenticated: false });
export const getCurrentUser = () => request("/auth/me");
export const logout = () => request("/auth/logout", { method: "POST" });

export const getProducts = () => request("/products");
export const createProduct = (payload) => request("/products", jsonOptions("POST", payload));
export const updateProduct = (id, payload) => request(`/products/${id}`, jsonOptions("PUT", payload));
export const deleteProduct = (id) => request(`/products/${id}`, { method: "DELETE" });

export const getTables = () => request("/tables");
export const updateTable = (id, payload) => request(`/tables/${id}`, jsonOptions("PUT", payload));
export const getActiveOrder = (tableId) => request(`/tables/${tableId}/active-order`);
export const createOrder = (tableId, payload) => request(`/tables/${tableId}/orders`, jsonOptions("POST", payload));
export const updateOrder = (orderId, payload) => request(`/orders/${orderId}`, jsonOptions("PUT", payload));
export const completeOrder = (orderId) => request(`/orders/${orderId}/complete`, { method: "PATCH" });
export const checkoutOrder = (orderId, payload) => request(`/orders/${orderId}/checkout`, jsonOptions("POST", payload));

export const getInvoices = ({ search = "", dateFrom = "", dateTo = "" } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const query = params.toString();
  return request(`/invoices${query ? `?${query}` : ""}`);
};
export const getInvoice = (invoiceId) => request(`/invoices/${invoiceId}`);
export const getDashboardSummary = () => request("/dashboard/summary");

export const getReportOverview = ({ dateFrom, dateTo }) => {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  return request(`/reports/overview?${params.toString()}`);
};

export const getUsers = ({ search = "", role = "", status = "" } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  const query = params.toString();
  return request(`/users${query ? `?${query}` : ""}`);
};
export const createUser = (payload) => request("/users", jsonOptions("POST", payload));
export const updateUser = (id, payload) => request(`/users/${id}`, jsonOptions("PUT", payload));
export const resetUserPassword = (id, password) => request(`/users/${id}/password`, jsonOptions("PATCH", { password }));
export const updateUserStatus = (id, status) => request(`/users/${id}/status`, jsonOptions("PATCH", { status }));
