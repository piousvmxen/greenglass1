import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://greenglass-backend.onrender.com' : '')
axios.defaults.baseURL = API_URL

axios.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasAuth: !!config.headers?.Authorization
    })
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', { status: response.status, url: response.config.url })
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
    })
    return Promise.reject(error)
  }
)

// Extract a user-friendly error message from an axios error
const extractErrorMessage = (error, fallback) => {
  const data = error.response?.data
  if (data?.errors && Array.isArray(data.errors)) return data.errors[0]
  if (data?.message) return data.message
  return fallback
}

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data)
    } catch (error) {
      console.error('❌ Failed to fetch user:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(res.data.user)
      toast.success('تم تسجيل الدخول بنجاح')
      return res.data
    } catch (error) {
      const msg = extractErrorMessage(error, 'فشل تسجيل الدخول')
      toast.error(msg)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData)
      localStorage.setItem('token', res.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(res.data.user)
      toast.success('تم إنشاء الحساب بنجاح')
      return res.data
    } catch (error) {
      // Let the component handle displaying the error
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('تم تسجيل الخروج')
    window.location.href = '/#/'
  }

  const resendVerification = async () => {
    try {
      const res = await axios.post('/api/auth/resend-verification')
      toast.success(res.data.message || 'Verification email sent')
      return res.data
    } catch (error) {
      const msg = extractErrorMessage(error, 'Failed to resend verification email')
      toast.error(msg)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    resendVerification,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
