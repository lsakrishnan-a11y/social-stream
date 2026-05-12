const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardStats: () => req('/dashboard/stats'),
  getRecentApplications: () => req('/dashboard/recent-applications'),
  getServiceStats: () => req('/dashboard/service-stats'),
  getMonthlyStats: () => req('/dashboard/monthly-stats'),

  // Citizens
  getCitizens: (params = {}) => req('/citizens?' + new URLSearchParams(params)),
  getCitizen: (id) => req(`/citizens/${id}`),
  createCitizen: (data) => req('/citizens', { method: 'POST', body: JSON.stringify(data) }),
  updateCitizen: (id, data) => req(`/citizens/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCitizen: (id) => req(`/citizens/${id}`, { method: 'DELETE' }),

  // Applications
  getApplications: (params = {}) => req('/applications?' + new URLSearchParams(params)),
  getApplication: (id) => req(`/applications/${id}`),
  createApplication: (data) => req('/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, data) => req(`/applications/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  recordPayment: (id, data) => req(`/applications/${id}/payment`, { method: 'PUT', body: JSON.stringify(data) }),

  // Services
  getServices: (params = {}) => req('/services?' + new URLSearchParams(params)),
  createService: (data) => req('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => req(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => req(`/services/${id}`, { method: 'DELETE' }),

  // Operators
  getOperators: (params = {}) => req('/operators?' + new URLSearchParams(params)),
  getOperator: (id) => req(`/operators/${id}`),
  createOperator: (data) => req('/operators', { method: 'POST', body: JSON.stringify(data) }),
  updateOperator: (id, data) => req(`/operators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (params = {}) => req('/notifications?' + new URLSearchParams(params)),
  markNotificationRead: (id) => req(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => req('/notifications/read-all', { method: 'PUT' }),
  clearReadNotifications: () => req('/notifications/clear', { method: 'DELETE' }),

  // Reports & Automation
  getDailyReports: () => req('/reports/daily'),
  getAutomationRules: () => req('/reports/automation-rules'),
  toggleAutomationRule: (id) => req(`/reports/automation-rules/${id}/toggle`, { method: 'PUT' }),
  getActivityLog: (params = {}) => req('/reports/activity-log?' + new URLSearchParams(params)),
  getReportSummary: () => req('/reports/summary'),
  bulkUpdateStatus: (data) => req('/reports/bulk/status', { method: 'PUT', body: JSON.stringify(data) }),
  exportApplicationsCSV: (params = {}) => `${BASE}/reports/export/applications?` + new URLSearchParams(params),
};
