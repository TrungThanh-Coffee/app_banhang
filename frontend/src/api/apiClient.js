const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

let currentToken = null;

export function setAuthToken(token) {
  currentToken = token;
}

export function clearAuthToken() {
  currentToken = null;
}

function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !isFormData(value)
  );
}

function buildUrl(path) {
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanBaseUrl}${cleanPath}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (response.status === 204) {
    return {};
  }

  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => '');

  if (!text) {
    return {};
  }

  return {
    message: text,
  };
}

export async function apiRequest(path, options = {}) {
  const bodyIsFormData = isFormData(options.body);

  const headers = {
    ...(options.headers || {}),
  };

  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  /**
   * Rất quan trọng:
   * - FormData upload ảnh: KHÔNG set Content-Type.
   * - Fetch/browser sẽ tự set multipart/form-data; boundary=...
   * - Nếu tự set Content-Type thì multer bên backend sẽ không đọc được req.file.
   */
  if (bodyIsFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  let requestBody = options.body;

  /**
   * Request thường:
   * apiRequest('/cart/add', {
   *   method: 'POST',
   *   body: { productId: 1, quantity: 2 }
   * })
   *
   * Phải stringify trước khi gửi.
   */
  if (!bodyIsFormData && isPlainObject(options.body)) {
    requestBody = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: requestBody,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      `Lỗi API ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}