import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import { Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { lang } = useLanguage()
  const ar = lang === 'ar'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError(ar ? 'يرجى إدخال بريدك الإلكتروني' : 'Please enter your email address')
      return
    }
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      const msg = data?.errors?.[0] || data?.message
      setError(msg || (ar ? 'حدث خطأ. يرجى المحاولة مجددًا.' : 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1e] px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#111827] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">

        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft size={15} />
          {ar ? 'العودة لتسجيل الدخول' : 'Back to login'}
        </Link>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {ar ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {ar
                ? 'إذا كان البريد الإلكتروني مسجلًا لدينا، ستصل رسالة تحتوي على رابط إعادة تعيين كلمة المرور خلال دقائق.'
                : 'If an account with that email exists, you\'ll receive a password reset link within a few minutes. Check your spam folder if you don\'t see it.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Mail size={22} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {ar ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {ar
                  ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.'
                  : 'Enter your email address and we\'ll send you a link to reset your password.'}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ar ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  ar ? 'إرسال رابط الاسترداد' : 'Send reset link'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
