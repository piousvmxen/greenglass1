import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import { KeyRound, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

const checkPassword = (pw) => ({
  length: pw.length >= 8,
  uppercase: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
})

const getStrength = (checks) => {
  const passed = Object.values(checks).filter(Boolean).length
  if (passed === 3) return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  if (passed === 2) return { label: 'Medium', color: 'bg-yellow-400', width: 'w-2/3' }
  return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' }
}

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const ar = lang === 'ar'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState([])

  const pwChecks = checkPassword(password)
  const pwStrength = getStrength(pwChecks)
  const allPassed = Object.values(pwChecks).every(Boolean)
  const passwordsMatch = password === confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = []

    if (!allPassed) {
      errs.push(ar ? 'كلمة المرور لا تستوفي المتطلبات' : 'Password does not meet all requirements')
    }
    if (!passwordsMatch) {
      errs.push(ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
    }
    if (errs.length) { setErrors(errs); return }

    setLoading(true)
    setErrors([])
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password })
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      const msgs = data?.errors || (data?.message ? [data.message] : [ar ? 'حدث خطأ' : 'Something went wrong. Please try again.'])
      setErrors(msgs)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1e] px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#111827] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {ar ? 'تم إعادة تعيين كلمة المرور' : 'Password reset successful!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {ar ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.' : 'You can now log in with your new password.'}
          </p>
          <button onClick={() => navigate('/login')} className="w-full btn-primary py-3">
            {ar ? 'تسجيل الدخول' : 'Go to Login'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1e] px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#111827] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="mb-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound size={22} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {ar ? 'إعادة تعيين كلمة المرور' : 'Set a new password'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {ar ? 'اختر كلمة مرور جديدة قوية.' : 'Choose a strong new password for your account.'}
          </p>
        </div>

        {errors.length > 0 && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4 space-y-1">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                <XCircle size={14} className="mt-0.5 shrink-0" /> {err}
              </p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {ar ? 'كلمة المرور الجديدة' : 'New password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors([]) }}
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white pr-10"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
                  </div>
                  <span className={`text-xs font-medium ${pwStrength.color.replace('bg-', 'text-')}`}>{pwStrength.label}</span>
                </div>
              </div>
            )}

            <ul className="mt-2 space-y-0.5">
              {[
                { key: 'length',    en: 'At least 8 characters',      ar: '8 أحرف على الأقل' },
                { key: 'uppercase', en: 'At least 1 uppercase letter', ar: 'حرف كبير واحد على الأقل' },
                { key: 'number',    en: 'At least 1 number',           ar: 'رقم واحد على الأقل' },
              ].map(({ key, en, ar: arText }) => (
                <li key={key} className={`flex items-center gap-1.5 text-xs ${pwChecks[key] ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {pwChecks[key] ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {ar ? arText : en}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {ar ? 'تأكيد كلمة المرور' : 'Confirm new password'}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrors([]) }}
              className={`input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white ${confirmPassword && !passwordsMatch ? 'border-red-400' : ''}`}
              placeholder="••••••••"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-500">
                {ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
              </p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={11} /> {ar ? 'كلمتا المرور متطابقتان' : 'Passwords match'}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 py-3">
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : (ar ? 'حفظ كلمة المرور الجديدة' : 'Save new password')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          <Link to="/login" className="text-primary-600 hover:text-primary-500">
            {ar ? 'العودة لتسجيل الدخول' : 'Back to login'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
