import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { UserPlus, MapPin, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import LocationPicker from '../components/LocationPicker'

/* ─── Password strength ─────────────────────────────────────── */
const checkPassword = (pw) => ({
  length:    pw.length >= 8,
  uppercase: /[A-Z]/.test(pw),
  number:    /[0-9]/.test(pw),
})

const getStrength = (checks) => {
  const passed = Object.values(checks).filter(Boolean).length
  if (passed === 3) return { label: 'Strong', color: 'bg-green-500',  textColor: 'text-green-600',  width: 'w-full' }
  if (passed === 2) return { label: 'Medium', color: 'bg-yellow-400', textColor: 'text-yellow-600', width: 'w-2/3' }
  return               { label: 'Weak',   color: 'bg-red-500',    textColor: 'text-red-600',    width: 'w-1/3' }
}

/* ─── Algerian phone validation ─────────────────────────────── */
const cleanPhone = (val) => val.replace(/\D/g, '').slice(0, 10)

const validateAlgerianPhone = (digits) => {
  if (digits.length === 0) return { valid: false, touched: false }
  if (digits.length < 10)  return { valid: false, short: true }
  return { valid: /^(05|06|07)\d{8}$/.test(digits) }
}

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'user', entityType: 'individual', address: ''
  })
  const [location, setLocation]         = useState({ lat: null, lng: null })
  const [loading, setLoading]           = useState(false)
  const [showMap, setShowMap]           = useState(false)
  const [logoError, setLogoError]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched]           = useState({})
  const [serverErrors, setServerErrors] = useState([])
  const [registered, setRegistered]     = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)

  const { register, user } = useAuth()
  const { t, lang }        = useLanguage()
  const navigate           = useNavigate()
  const ar                 = lang === 'ar'

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    const img = new Image()
    img.onerror = () => setLogoError(true)
    img.src = '/logo.jpeg'
  }, [])

  const pwChecks   = checkPassword(formData.password)
  const pwStrength = getStrength(pwChecks)

  /* phone state */
  const phoneDigits   = cleanPhone(formData.phone)
  const phoneState    = validateAlgerianPhone(phoneDigits)
  const phoneError    = touched.phone && !phoneState.valid
    ? (ar ? 'يجب أن يبدأ رقم الهاتف بـ 05 أو 06 أو 07 ويتكون من 10 أرقام' : 'Phone must start with 05, 06 or 07 and be exactly 10 digits')
    : ''
  const phoneSuccess  = touched.phone && phoneState.valid

  const fieldErrors = {
    name:     touched.name     && !formData.name.trim()                        ? (ar ? 'الاسم مطلوب'                    : 'Name is required')           : '',
    email:    touched.email    && !/\S+@\S+\.\S+/.test(formData.email)         ? (ar ? 'بريد إلكتروني غير صالح'         : 'Enter a valid email address') : '',
    password: touched.password && !Object.values(pwChecks).every(Boolean)      ? (ar ? 'كلمة المرور لا تستوفي المتطلبات' : 'Password does not meet all requirements') : '',
    phone:    phoneError,
  }

  const isFormValid =
    formData.name.trim() &&
    /\S+@\S+\.\S+/.test(formData.email) &&
    Object.values(pwChecks).every(Boolean) &&
    phoneState.valid

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      const digits = cleanPhone(value)
      setFormData(prev => ({ ...prev, phone: digits }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setServerErrors([])
  }

  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }

  const handleLocationConfirm = ({ lat, lng, address }) => {
    setLocation({ lat, lng })
    setFormData(prev => ({ ...prev, address }))
    setShowMap(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true, phone: true })
    if (!isFormValid) return

    setLoading(true)
    setServerErrors([])
    try {
      const result = await register({
        ...formData,
        phone:    phoneDigits,
        location: location.lat && location.lng ? location : {}
      })
      setEmailVerificationSent(!!result?.emailVerificationSent)
      setRegistered(true)
    } catch (error) {
      const data = error.response?.data
      if (data?.errors && Array.isArray(data.errors)) {
        setServerErrors(data.errors)
      } else if (data?.message) {
        setServerErrors([data.message])
      } else {
        setServerErrors([ar ? 'حدث خطأ، يرجى المحاولة لاحقًا' : 'Something went wrong. Please try again.'])
      }
    } finally {
      setLoading(false)
    }
  }

  /* Success screen */
  if (registered) {
    return (
      <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1e] px-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-[#111827] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center animate-scale-in">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {ar ? 'تم إنشاء حسابك!' : 'Account created!'}
          </h2>
          {emailVerificationSent ? (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {ar
                ? 'تم إرسال بريد التحقق إلى عنوانك. يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.'
                : 'A verification email has been sent. Please check your inbox to activate your account.'}
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {ar ? 'يمكنك الآن تسجيل الدخول.' : 'You can now log in.'}
            </p>
          )}
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full btn-primary py-3 text-base"
          >
            {ar ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {showMap && (
        <LocationPicker
          lang={lang}
          onConfirm={handleLocationConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {!logoError ? (
              <img src="/logo.jpeg" alt="Green Glass Logo" className="w-20 h-20 object-contain rounded-2xl shadow-md" onError={() => setLogoError(true)} />
            ) : (
              <div className="w-20 h-20 bg-green-700 rounded-2xl flex items-center justify-center">
                <span className="text-white font-extrabold text-3xl">G</span>
              </div>
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('register_title')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('register_have_account')}{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">{t('register_login_link')}</Link>
          </p>
        </div>

        <form
          className="bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-5 transition-colors duration-300"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Server errors */}
          {serverErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
              {serverErrors.map((err, i) => (
                <p key={i} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                  <XCircle size={15} className="mt-0.5 shrink-0" /> {err}
                </p>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register_name')} *</label>
              <input
                name="name" type="text"
                className={`input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={ar ? 'الاسم الكامل' : 'Full name'}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                  <XCircle size={11} /> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register_email')} *</label>
              <input
                name="email" type="email"
                className={`input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white ${fieldErrors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="example@email.com"
                dir="ltr"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                  <XCircle size={11} /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register_password')} *</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white pr-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
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

              {formData.password && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pwStrength.color} ${pwStrength.width}`} />
                    </div>
                    <span className={`text-xs font-semibold ${pwStrength.textColor}`}>{pwStrength.label}</span>
                  </div>
                </div>
              )}

              <ul className="mt-2 space-y-0.5">
                {[
                  { key: 'length',    en: 'At least 8 characters',      ar: '8 أحرف على الأقل' },
                  { key: 'uppercase', en: 'At least 1 uppercase letter', ar: 'حرف كبير واحد على الأقل' },
                  { key: 'number',    en: 'At least 1 number',           ar: 'رقم واحد على الأقل' },
                ].map(({ key, en, ar: arText }) => (
                  <li key={key} className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${pwChecks[key] ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {pwChecks[key] ? <CheckCircle size={11} /> : <XCircle size={11} />}
                    {ar ? arText : en}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone — Algeria only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('register_phone')} * <span className="text-xs text-gray-400 font-normal">{ar ? '(الجزائر)' : '(Algeria)'}</span>
              </label>
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                className={`input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                  phoneError  ? 'border-red-400'   :
                  phoneSuccess ? 'border-green-400' : ''
                }`}
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="05XXXXXXXX"
                maxLength={10}
                dir="ltr"
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-500 flex items-start gap-1 animate-fade-in">
                  <XCircle size={11} className="mt-0.5 shrink-0" />
                  {phoneError}
                </p>
              )}
              {phoneSuccess && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-fade-in">
                  <CheckCircle size={11} />
                  {ar ? 'رقم الهاتف صالح' : 'Valid phone number'}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register_role')}</label>
              <select
                name="role"
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">{t('register_role_user')}</option>
                <option value="collector">{t('register_role_collector')}</option>
              </select>
            </div>

            {/* Entity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {ar ? 'نوع الكيان' : 'Entity Type'}
              </label>
              <select
                name="entityType"
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={formData.entityType}
                onChange={handleChange}
              >
                <option value="individual">{ar ? 'فرد'     : 'Individual'}</option>
                <option value="cafe">      {ar ? 'مقهى'    : 'Cafe'}</option>
                <option value="restaurant">{ar ? 'مطعم'    : 'Restaurant'}</option>
                <option value="hotel">     {ar ? 'فندق'    : 'Hotel'}</option>
                <option value="factory">   {ar ? 'مصنع'    : 'Factory'}</option>
                <option value="workshop">  {ar ? 'ورشة'    : 'Workshop'}</option>
                <option value="other">     {ar ? 'أخرى'    : 'Other'}</option>
              </select>
            </div>
          </div>

          {/* Address via map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {ar ? 'العنوان' : 'Address'}
            </label>
            <div className="flex gap-2">
              <input
                name="address"
                type="text"
                readOnly
                placeholder={ar ? 'انقر على زر الخريطة لتحديد العنوان' : 'Click Map to select your address'}
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-white flex-1 cursor-default opacity-70"
                value={formData.address}
              />
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold text-sm transition-all whitespace-nowrap"
              >
                <MapPin size={15} />
                {ar ? 'الخريطة' : 'Map'}
              </button>
            </div>
            {location.lat && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1 animate-fade-in">
                <CheckCircle size={11} /> {ar ? 'تم تحديد الموقع' : 'Location confirmed'} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base mt-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <UserPlus size={20} />
                {t('register_btn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
