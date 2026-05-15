const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (currentUser && currentUser.user_id) {
    headers['x-user-id'] = String(currentUser.user_id);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(function () {
    return {};
  });

  if (!response.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra khi gọi API');
  }

  return data;
}