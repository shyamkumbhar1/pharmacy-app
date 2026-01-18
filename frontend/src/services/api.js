import axios from 'axios'

// Get API URL from environment variable or use default
const getApiUrl = () => {
  // Always use relative path in production build (proxied through nginx)
  if (import.meta.env.PROD) {
    return '/api'
  }
  // In development, use environment variable or default
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

