const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(url, options = {}) {
  const fullUrl = `${API_BASE}${url}`;
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  };

  const response = await fetch(fullUrl, config);

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  get(url, options = {}) {
    return request(url, { method: 'GET', ...options });
  },
  post(url, data, options = {}) {
    return request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(data),
      ...options,
    });
  },
  put(url, data, options = {}) {
    return request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(data),
      ...options,
    });
  },
  patch(url, data, options = {}) {
    return request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(data),
      ...options,
    });
  },
  del(url, options = {}) {
    return request(url, { method: 'DELETE', ...options });
  },
  delete(url, options = {}) {
    return request(url, { method: 'DELETE', ...options });
  },
  upload(url, formData, options = {}) {
    return request(url, {
      method: 'POST',
      body: formData,
      ...options,
    });
  },
  async downloadFile(url, fallbackFilename) {
    const fullUrl = `${API_BASE}${url}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    let filename = fallbackFilename || 'document.pdf';
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};

export default api;
