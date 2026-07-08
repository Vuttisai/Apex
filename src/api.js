const isDev = window.location.hostname === 'localhost' && window.location.port !== '5000';
const API_URL = isDev ? 'http://localhost:5000/api' : '/api';
const UPLOADS_URL = isDev ? 'http://localhost:5000/uploads' : '/uploads';

// Get token from localStorage
export const getToken = () => localStorage.getItem('apex_token');

// Set token in localStorage
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('apex_token', token);
  } else {
    localStorage.removeItem('apex_token');
  }
};

// Check if user is authenticated
export const isAuthenticated = () => !!getToken();

// Logout
export const logout = () => {
  localStorage.removeItem('apex_token');
  localStorage.removeItem('apex_user');
};

// Helper for making API requests
const makeRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const api = {
  isAuthenticated: () => isAuthenticated(),
  logout: () => logout(),

  // Auth
  auth: {
    login: async (username, password) => {
      const data = await makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('apex_user', JSON.stringify(data.user));
      }
      return data;
    },
    me: () => makeRequest('/auth/me'),
    getUser: () => {
      try {
        const user = localStorage.getItem('apex_user');
        return user ? JSON.parse(user) : null;
      } catch (e) {
        localStorage.removeItem('apex_user');
        return null;
      }
    }
  },

  // Properties
  properties: {
    getAll: () => makeRequest('/properties'),
    getById: (id) => makeRequest(`/properties/${id}`),
    create: (propertyData) => makeRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    }),
    update: (id, propertyData) => makeRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData)
    }),
    delete: (id) => makeRequest(`/properties/${id}`, {
      method: 'DELETE'
    }),
    uploadImages: async (files) => {
      const token = getToken();
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Do not set Content-Type header; fetch sets it automatically with the boundary details
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Image upload failed');
      }

      return response.json();
    }
  },

  // Enquiries
  enquiries: {
    getAll: () => makeRequest('/enquiries'),
    create: (enquiryData) => makeRequest('/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiryData)
    }),
    updateStatus: (id, status) => makeRequest(`/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    delete: (id) => makeRequest(`/enquiries/${id}`, {
      method: 'DELETE'
    })
  },

  // Settings
  settings: {
    get: () => makeRequest('/settings'),
    update: (settingsData) => makeRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    })
  },

  // Image Helper
  getImageUrl: (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
    if (imagePath.startsWith('http')) return imagePath;
    return `${UPLOADS_URL}/${imagePath}`;
  }
};
