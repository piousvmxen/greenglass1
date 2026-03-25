import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Award, MapPin, Phone, Mail, User, Recycle, Star, Camera, Check, Loader2 } from 'lucide-react'

const glass = {
  panel: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.15)',
  label: 'rgba(255,255,255,0.55)',
  text: 'rgba(255,255,255,0.92)',
  input: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.18)',
  accent: '#4ade80',
  accentGlow: 'rgba(74,222,128,0.35)',
}

function GlassInput({ icon: Icon, label, value, onChange, type = 'text', readOnly = false }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: glass.label }}>
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
        style={{
          background: focused && !readOnly ? 'rgba(74,222,128,0.08)' : glass.input,
          border: `1.5px solid ${focused && !readOnly ? glass.accent : glass.inputBorder}`,
          boxShadow: focused && !readOnly ? `0 0 0 3px ${glass.accentGlow}` : 'none',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Icon size={16} style={{ color: focused && !readOnly ? glass.accent : glass.label, flexShrink: 0 }} />
        <input
          type={type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: glass.text, fontFamily: 'Cairo, sans-serif', cursor: readOnly ? 'default' : 'text' }}
        />
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, value, label, glow }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl"
      style={{
        background: glass.panel,
        border: glass.border,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 24px ${glow}`,
      }}
    >
      <Icon size={20} style={{ color: glass.accent }} />
      <span className="text-2xl font-black" style={{ color: glass.text }}>{value}</span>
      <span className="text-xs font-medium" style={{ color: glass.label }}>{label}</span>
    </div>
  )
}

const Profile = () => {
  const { user, fetchUser } = useAuth()
  const { t, lang } = useLanguage()
  const ar = lang === 'ar'
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', entityType: '' })
  const [stats, setStats] = useState({ points: 0, totalGlassCollected: 0, completedRequests: 0 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        entityType: user.entityType || 'individual',
      })
      setAvatarPreview(user.profilePicture || '')
    }
  }, [user])

  useEffect(() => {
    axios.get('/api/users/stats').then(res => setStats(res.data)).catch(() => {})
  }, [])

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(ar ? 'ar-DZ' : 'en-GB', { month: 'long', year: 'numeric' })
    : ''

  const roleLabel = () => {
    if (user?.role === 'collector') return ar ? 'جامع' : 'Collector'
    if (user?.role === 'admin') return ar ? 'مدير' : 'Admin'
    return ar ? 'مستخدم' : 'User'
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.put('/api/users/profile', form)
      await fetchUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error(ar ? 'فشل حفظ التغييرات' : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error(ar ? 'الحجم الأقصى للصورة 5 ميغابايت' : 'Max image size is 5 MB')
      return
    }
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await axios.post('/api/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAvatarPreview(res.data.profilePicture)
      await fetchUser()
      toast.success(ar ? 'تم تحديث الصورة بنجاح' : 'Profile picture updated')
    } catch {
      toast.error(ar ? 'فشل رفع الصورة' : 'Upload failed')
      setAvatarPreview(user?.profilePicture || '')
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="min-h-screen relative overflow-hidden"
      style={{ fontFamily: 'Cairo, sans-serif' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #0a3d1f 25%, #0f4c2a 50%, #0a3d1f 75%, #052e16 100%)' }}
      />
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Recycle size={20} style={{ color: '#4ade80' }} />
            <span className="font-bold text-sm" style={{ color: '#4ade80' }}>GreenGlass</span>
          </div>
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}
          >
            {ar ? 'الملف الشخصي' : 'My Profile'} ✦
          </span>
        </div>

        {/* Profile Hero Card */}
        <div
          className="relative rounded-3xl p-6 mb-6"
          style={{
            background: glass.panel,
            border: glass.border,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
            style={{ background: 'linear-gradient(90deg, transparent, #4ade80, transparent)' }}
          />

          <div className="flex items-center gap-6 flex-wrap">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-24 h-24 rounded-2xl object-cover shadow-2xl"
                  style={{ boxShadow: '0 8px 32px rgba(74,222,128,0.3)' }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
                    color: '#052e16',
                    boxShadow: '0 8px 32px rgba(74,222,128,0.3)',
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute -bottom-2 flex items-center justify-center w-8 h-8 rounded-xl transition-opacity hover:opacity-90"
                style={{
                  background: 'rgba(74,222,128,0.9)',
                  [ar ? 'left' : 'right']: '-8px',
                }}
                title={ar ? 'تغيير الصورة' : 'Change photo'}
              >
                {avatarLoading
                  ? <Loader2 size={13} className="animate-spin" style={{ color: '#052e16' }} />
                  : <Camera size={13} style={{ color: '#052e16' }} />
                }
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black mb-0.5 truncate" style={{ color: glass.text }}>{user?.name}</h2>
              <p className="text-sm mb-3 truncate" style={{ color: glass.label }}>{user?.email}</p>
              <div className="flex gap-2 flex-wrap">
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
                >
                  {roleLabel()}
                </span>
                {joinedDate && (
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                  >
                    {ar ? `عضو منذ ${joinedDate}` : `Member since ${joinedDate}`}
                  </span>
                )}
              </div>
            </div>

            {/* Points badge */}
            <div className="text-center flex-shrink-0">
              <div
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
                style={{ background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.3)' }}
              >
                <Star size={12} style={{ color: '#4ade80' }} />
                <span className="text-base font-black leading-none mt-0.5" style={{ color: '#4ade80' }}>
                  {stats.points ?? user?.points ?? 0}
                </span>
              </div>
              <span className="text-xs mt-1 block" style={{ color: glass.label }}>{ar ? 'نقطة' : 'pts'}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatBox
            icon={Award}
            value={stats.points ?? user?.points ?? 0}
            label={ar ? 'النقاط' : 'Points'}
            glow="rgba(74,222,128,0.1)"
          />
          <StatBox
            icon={Recycle}
            value={`${stats.totalGlassCollected ?? 0}${ar ? 'كغ' : 'kg'}`}
            label={ar ? 'مُعاد تدويره' : 'Recycled'}
            glow="rgba(59,130,246,0.1)"
          />
          <StatBox
            icon={MapPin}
            value={stats.completedRequests ?? 0}
            label={ar ? 'الطلبات' : 'Requests'}
            glow="rgba(245,158,11,0.1)"
          />
        </div>

        {/* Edit Form Card */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: glass.panel,
            border: glass.border,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.3)',
          }}
        >
          <h3 className="font-bold text-base mb-5" style={{ color: glass.text }}>
            {ar ? 'تعديل المعلومات' : 'Edit Information'}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <GlassInput
              icon={User}
              label={ar ? 'الاسم الكامل' : 'Full Name'}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <GlassInput
              icon={Mail}
              label={ar ? 'البريد الإلكتروني' : 'Email'}
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <GlassInput
              icon={Phone}
              label={ar ? 'رقم الهاتف' : 'Phone'}
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
            <GlassInput
              icon={MapPin}
              label={ar ? 'العنوان' : 'Address'}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>

          {/* Entity Type */}
          <div className="mt-4">
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: glass.label }}>
              {ar ? 'نوع الكيان' : 'Entity Type'}
            </label>
            <select
              value={form.entityType}
              onChange={e => setForm(f => ({ ...f, entityType: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
              style={{
                background: glass.input,
                border: `1.5px solid ${glass.inputBorder}`,
                color: glass.text,
                fontFamily: 'Cairo, sans-serif',
                backdropFilter: 'blur(6px)',
              }}
            >
              <option value="individual" style={{ background: '#14532d' }}>{ar ? 'فرد' : 'Individual'}</option>
              <option value="cafe"       style={{ background: '#14532d' }}>{ar ? 'مقهى' : 'Cafe'}</option>
              <option value="restaurant" style={{ background: '#14532d' }}>{ar ? 'مطعم' : 'Restaurant'}</option>
              <option value="hotel"      style={{ background: '#14532d' }}>{ar ? 'فندق' : 'Hotel'}</option>
              <option value="factory"    style={{ background: '#14532d' }}>{ar ? 'مصنع' : 'Factory'}</option>
              <option value="workshop"   style={{ background: '#14532d' }}>{ar ? 'ورشة' : 'Workshop'}</option>
              <option value="other"      style={{ background: '#14532d' }}>{ar ? 'أخرى' : 'Other'}</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: saved
                ? 'rgba(74,222,128,0.2)'
                : saving
                ? 'rgba(74,222,128,0.4)'
                : 'linear-gradient(135deg, #4ade80, #16a34a)',
              color: saved ? '#4ade80' : '#052e16',
              border: saved ? '1.5px solid #4ade80' : 'none',
              boxShadow: saved || saving ? 'none' : '0 4px 24px rgba(74,222,128,0.4)',
            }}
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> {ar ? 'جاري الحفظ...' : 'Saving...'}</>
            ) : saved ? (
              <><Check size={16} /> {ar ? 'تم الحفظ بنجاح ✓' : 'Saved successfully ✓'}</>
            ) : (
              ar ? 'حفظ التغييرات' : 'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
