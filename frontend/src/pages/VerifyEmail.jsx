import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const VerifyEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { user, resendVerification } = useAuth()
  const ar = lang === 'ar'

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage(ar ? 'رابط غير صالح' : 'Invalid verification link'); return }

    axios.get(`/api/auth/verify-email/${token}`)
      .then(res => {
        setStatus('success')
        setMessage(res.data.message || (ar ? 'تم التحقق بنجاح!' : 'Email verified successfully!'))
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message || (ar ? 'رابط التحقق غير صالح أو انتهت صلاحيته.' : 'This verification link is invalid or has expired.'))
      })
  }, [token])

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await axios.post('/api/auth/resend-verification')
      setResendDone(true)
    } catch (err) {
      alert(err.response?.data?.message || (ar ? 'حدث خطأ' : 'Something went wrong'))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1e] px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#111827] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">

        {status === 'loading' && (
          <>
            <Loader2 size={40} className="animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {ar ? 'جارٍ التحقق من بريدك...' : 'Verifying your email...'}
            </h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {ar ? 'تم التحقق من البريد الإلكتروني!' : 'Email verified!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{message}</p>
            <button onClick={() => navigate('/dashboard')} className="w-full btn-primary py-3">
              {ar ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {ar ? 'فشل التحقق' : 'Verification failed'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{message}</p>

            {user && !user.emailVerified && (
              resendDone ? (
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  {ar ? 'تم إعادة إرسال رسالة التحقق. تحقق من بريدك.' : 'Verification email resent. Check your inbox.'}
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="w-full mb-3 py-3 rounded-xl border-2 border-green-500 text-green-600 dark:text-green-400 font-semibold text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  {resendLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {ar ? 'إعادة إرسال رسالة التحقق' : 'Resend verification email'}
                </button>
              )
            )}

            <Link to="/login" className="block w-full text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors">
              {ar ? 'العودة لتسجيل الدخول' : 'Back to login'}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
