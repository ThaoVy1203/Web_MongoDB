import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/v1";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("wops_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh-token");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      const savedRefresh = localStorage.getItem("wops_refresh_token");
      if (savedRefresh) {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post(`${API_BASE}/auth/refresh-token`, { refresh_token: savedRefresh })
              .then((r) => r.data)
              .finally(() => {
                refreshPromise = null;
              });
          }
          const refreshed = await refreshPromise;
          if (refreshed?.access_token) {
            localStorage.setItem("wops_access_token", refreshed.access_token);
            if (refreshed.refresh_token) {
              localStorage.setItem("wops_refresh_token", refreshed.refresh_token);
            }
            originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;
            return apiClient(originalRequest);
          }
        } catch {
          localStorage.removeItem("wops_access_token");
          localStorage.removeItem("wops_refresh_token");
          localStorage.removeItem("wops_user");
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (data) => apiClient.post("/auth/login", data).then((r) => r.data),
  register: (data) => apiClient.post("/auth/register", data).then((r) => r.data),
  refreshToken: (refresh_token) =>
    apiClient.post("/auth/refresh-token", { refresh_token }).then((r) => r.data),
  me: () => apiClient.get("/auth/me").then((r) => r.data),
  logout: () => apiClient.post("/auth/logout").then((r) => r.data),
};

export const recordsApi = {
  list: (params) => apiClient.get("/records", { params }).then((r) => r.data),
  lookup: (q) => apiClient.get("/records/lookup", { params: { q } }).then((r) => r.data),
  batchCheck: (serials) => apiClient.post("/records/batch-check", { serials }).then((r) => r.data),
  detail: (id) => apiClient.get(`/records/${id}`).then((r) => r.data),
  create: (data) => apiClient.post("/records", data).then((r) => r.data),
  renew: (id, data) => apiClient.post(`/records/${id}/renew`, data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/records/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/records/${id}`).then((r) => r.data),
};

export const ticketsApi = {
  list: (params) => apiClient.get("/tickets", { params }).then((r) => r.data),
  detail: (id) => apiClient.get(`/tickets/${encodeURIComponent(id)}`).then((r) => r.data),
  create: (data) => apiClient.post("/tickets", data).then((r) => r.data),
  updateStatus: (id, data) => apiClient.patch(`/tickets/${id}/status`, data).then((r) => r.data),
  assign: (id, data) => apiClient.patch(`/tickets/${id}/assign`, data).then((r) => r.data),
  addPart: (id, data) => apiClient.post(`/tickets/${id}/parts`, data).then((r) => r.data),
  reject: (id, data) => apiClient.post(`/tickets/${id}/reject`, data).then((r) => r.data),
  confirmReceipt: (id, data = {}) =>
    apiClient.post(`/tickets/${id}/confirm-receipt`, data).then((r) => r.data),
  addMessage: (id, data) => apiClient.post(`/tickets/${id}/messages`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/tickets/${id}`).then((r) => r.data),
};

export const customersApi = {
  list: (params) => apiClient.get("/customers", { params }).then((r) => r.data),
  detail: (id) => apiClient.get(`/customers/${encodeURIComponent(id)}`).then((r) => r.data),
  create: (data) => apiClient.post("/customers", data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/customers/${id}`, data).then((r) => r.data),
  toggleLock: (id) => apiClient.patch(`/customers/${id}/toggle-lock`).then((r) => r.data),
  addNote: (id, data) => apiClient.post(`/customers/${id}/notes`, data).then((r) => r.data),
};

export const productsApi = {
  list: (params) => apiClient.get("/products", { params }).then((r) => r.data),
  create: (data) => apiClient.post("/products", data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/products/${id}`).then((r) => r.data),
};

export const analyticsApi = {
  overview: (range = "all") => apiClient.get("/analytics/overview", { params: { range } }).then((r) => r.data),
  reports: (params) => apiClient.get("/analytics/reports", { params }).then((r) => r.data),
  suggestBranch: (data) => apiClient.post("/ai/suggest-branch", data).then((r) => r.data),
  expiringAdvisor: (data = {}) => apiClient.post("/ai/expiring-advisor", data).then((r) => r.data),
  deviceInsights: (data) => apiClient.post("/ai/device-insights", data).then((r) => r.data),
  exportUrl: (type) => `${API_BASE}/analytics/export/${type}`,
};
