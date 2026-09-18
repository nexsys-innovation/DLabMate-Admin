import { clearQueryCache } from "./hooks/useCachedQuery";
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';
export const apiUrl = (path) => `${API_BASE_URL}${path}`;
export const adminHeaders = (json = true) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(localStorage.getItem('adminToken') ? { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } : {}),
});

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), { ...options, headers: { ...adminHeaders(options.body !== undefined), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('adminToken'); clearQueryCache();
    window.dispatchEvent(new Event('dlabmate:admin-session-expired'));
  }
  if (!response.ok || !data.success) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
};
