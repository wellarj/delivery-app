import axios from 'axios';

// Base URL points to the directory, not the file directly, to avoid redirect issues on some servers
const API_URL = 'https://www.araujodev.com.br/api-delivery/';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    // Always append index.php to the URL
    if (!config.url) {
        config.url = 'index.php';
    } else if (!config.url.startsWith('index.php')) {
        // If url is set but doesn't start with index.php, we might need to adjust logic
        // But for this app, we mostly pass params to the root. 
        // We will force url to be index.php for all standard requests defined in pages
        config.url = 'index.php';
    }
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
    } 
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (!window.location.hash.includes('#/login')) {
         // Handle redirect if needed
      }
    }
    return Promise.reject(error);
  }
);