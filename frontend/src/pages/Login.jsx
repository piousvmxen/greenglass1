import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { LogIn, Eye, EyeOff, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData]       = useState({ email: '', password: '' })
  const [loading, setLoading]         = useState(false)
  const [logoError, setLogoError]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg]       = useState('')

  const { login, user } = useAuth()
  const { t, lang }     = useLanguage()
  const navigate        = useNavigate()
  const ar              = lang === 'ar'

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    const img = new Image()
    img.onerror = () => setLogoError(true)
    img.src = '/logo.jpeg'
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      await login(formData.email, formData.password)
      toast.success(ar ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const data = error.response?.data
      if (data?.errors && Array.isArray(data.errors)) {
        setErrorMsg(data.errors[0])
      } else {
        setErrorMsg(data?.message || (ar ? 'فشل تسجيل الدخول. يرجى المحاولة مجددًا.' : 'Login failed. Please try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1e] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#111827] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 transition-colors duration-300 animate-fade-in-up">
        <div>
          <div className="flex justify-center">
            {!logoError ? (
              <img
                src="/logo.jpeg"
                alt="Green Glass Logo"
                className="w-20 h-20 object-contain rounded-2xl shadow-md hover:scale-105 transition-transform duration-300"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-20 h-20 bg-green-700 rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-3xl">G</span>
              </div>
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('login_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('login_no_account')}{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              {t('login_register_link')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Error message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
              <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('login_email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                dir="ltr"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('login_password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  {ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white pr-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <LogIn size={20} />
                {t('login_btn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
