const API_BASE = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  let result = {};
  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
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
