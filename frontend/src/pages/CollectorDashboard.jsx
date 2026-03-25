import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import {
  CheckCircle, Clock, MapPin, Package, Truck,
  BarChart3, MessageSquare, RefreshCw, AlertCircle,
  Check, ChevronRight, Leaf, TrendingUp
} from 'lucide-react'

const BG       = '#0c2d18'
const CARD     = '#14532d'
const GREEN    = '#4ade80'
const GREEN2   = '#86efac'

const ENTITY_LABELS = {
  individual: 'فرد', cafe: 'مقهى', restaurant: 'مطعم',
  hotel: 'فندق', factory: 'مصنع', workshop: 'ورشة', other: 'أخرى'
}
const STATUS_COLOR = {
  pending:     '#fbbf24',
  accepted:    '#60a5fa',
  'in-progress': '#a78bfa',
  completed:   '#4ade80',
  cancelled:   '#f87171',
}
const STATUS_LABEL = {
  pending: 'في الانتظار', accepted: 'مقبول',
  'in-progress': 'جارٍ', completed: 'مكتمل', cancelled: 'ملغى'
}
const GLASS_TYPE_LABEL = { bottles: 'زجاجات', windows: 'نوافذ', broken: 'مكسور', mixed: 'مختلط' }

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1)  return 'الآن'
  if (m < 60) return `منذ ${m} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} س`
  return `منذ ${Math.floor(h / 24)} يوم`
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: CARD, borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: GREEN }}>{icon}</span>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{children}</span>
    </div>
  )
}

const CollectorDashboard = () => {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [requests, setRequests]   = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [tab, setTab]             = useState('available') // available | mine | history

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        axios.get('/api/requests'),
        axios.get('/api/users/stats'),
      ])
      setRequests(rRes.data)
      setStats(sRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const accept = async (id) => {
    setAccepting(id)
    try {
      await axios.put(`/api/requests/${id}/accept`, {})
      await fetchData()
    } catch (e) { console.error(e) }
    finally { setAccepting(null) }
  }

  const complete = async (id) => {
    setCompleting(id)
    try {
      await axios.put(`/api/requests/${id}/complete`, {})
      await fetchData()
    } catch (e) { console.error(e) }
    finally { setCompleting(null) }
  }

  const available = requests.filter(r => r.status === 'pending')
  const mine      = requests.filter(r => (r.status === 'accepted' || r.status === 'in-progress') && r.collectorId && (r.collectorId._id === user?._id || r.collectorId === user?._id))
  const history   = requests.filter(r => r.status === 'completed' && r.collectorId && (r.collectorId._id === user?._id || r.collectorId === user?._id))

  const totalCollected = history.reduce((s, r) => s + (r.glassQuantity || 0), 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div dir="rtl" className="cdash-root" style={{ minHeight: 'calc(100vh - 80px)', background: BG, fontFamily: 'Cairo, sans-serif', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @media(max-width:768px){
          .cdash-root{padding:14px 14px!important;}
          .cdash-stats{flex-direction:column!important;}
          .cdash-stats>div{min-width:unset!important;flex:none!important;}
          .cdash-cols{flex-direction:column!important;}
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={22} color={GREEN} />
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>
              {lang === 'ar' ? `مرحباً، ${user?.name}` : `Welcome, ${user?.name}`}
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
            {lang === 'ar' ? 'لوحة تحكم المجمّع — اعرض الطلبات وأكمل التجميع' : 'Collector Dashboard — view requests and confirm pickups'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
            <RefreshCw size={14} /> {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
          <Link to="/map" style={{ background: GREEN, color: BG, borderRadius: 10, padding: '8px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} /> {lang === 'ar' ? 'خريطة المسار' : 'Route Map'}
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="cdash-stats" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { icon: <Package size={20} />, label: lang === 'ar' ? 'طلبات متاحة' : 'Available', value: available.length, color: '#fbbf24' },
          { icon: <Truck size={20} />,   label: lang === 'ar' ? 'طلباتي الجارية' : 'My Active', value: mine.length,      color: '#60a5fa' },
          { icon: <CheckCircle size={20} />, label: lang === 'ar' ? 'مكتملة' : 'Completed',  value: history.length,   color: GREEN },
          { icon: <TrendingUp size={20} />,  label: lang === 'ar' ? 'إجمالي كغ جمعت' : 'Total kg', value: `${totalCollected.toFixed(0)} كغ`, color: GREEN2 },
        ].map((s) => (
          <div key={s.label} style={{ background: CARD, borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 160, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ color: s.color, opacity: 0.9 }}>{s.icon}</div>
            <div>
              <div style={{ color: '#fff', fontSize: 26, fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
        {[
          { key: 'available', label: lang === 'ar' ? `الطلبات المتاحة (${available.length})` : `Available (${available.length})` },
          { key: 'mine',      label: lang === 'ar' ? `طلباتي (${mine.length})` : `My Pickups (${mine.length})` },
          { key: 'history',   label: lang === 'ar' ? `السجل (${history.length})` : `History (${history.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              background: tab === t.key ? GREEN : 'transparent',
              color:      tab === t.key ? BG : 'rgba(255,255,255,0.55)',
              transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {available.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '24px 0', fontSize: 14 }}>
                {lang === 'ar' ? 'لا توجد طلبات متاحة حالياً' : 'No available requests right now'}
              </div>
            </Card>
          ) : available.map(r => (
            <Card key={r._id} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{r.entityName}</span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 10, borderRadius: 6, padding: '2px 7px' }}>{ENTITY_LABELS[r.entityType] || r.entityType}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>
                    <MapPin size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{r.address}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    <span>⚖️ {r.glassQuantity} كغ</span>
                    <span>🔷 {GLASS_TYPE_LABEL[r.glassType] || r.glassType}</span>
                    <span>🕐 {timeAgo(r.createdAt)}</span>
                  </div>
                  {r.description && (
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, maxWidth: 360 }}>{r.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                  <div style={{ background: 'rgba(74,222,128,0.15)', borderRadius: 8, padding: '4px 12px', color: GREEN, fontSize: 13, fontWeight: 700 }}>
                    +{Math.floor(r.glassQuantity)} نقطة
                  </div>
                  <button
                    onClick={() => accept(r._id)}
                    disabled={accepting === r._id}
                    style={{ background: GREEN, color: BG, border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: 6, opacity: accepting === r._id ? 0.6 : 1 }}>
                    <Check size={14} />
                    {accepting === r._id ? '...' : (lang === 'ar' ? 'قبول الطلب' : 'Accept')}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mine.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '24px 0', fontSize: 14 }}>
                {lang === 'ar' ? 'لا توجد طلبات جارية حالياً' : 'No active pickups'}
              </div>
            </Card>
          ) : mine.map(r => (
            <Card key={r._id} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{r.entityName}</span>
                    <span style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa', fontSize: 10, borderRadius: 6, padding: '2px 8px' }}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>
                    <MapPin size={12} />
                    <span>{r.address}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    <span>⚖️ {r.glassQuantity} كغ</span>
                    <span>🔷 {GLASS_TYPE_LABEL[r.glassType] || r.glassType}</span>
                    {r.scheduledDate && <span>📅 {new Date(r.scheduledDate).toLocaleDateString('ar-DZ')}</span>}
                  </div>
                  {r.userId?.phone && (
                    <div style={{ color: GREEN2, fontSize: 12, marginTop: 6 }}>📞 {r.userId.phone}</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <Link to="/map" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} /> {lang === 'ar' ? 'عرض الموقع' : 'View on map'}
                  </Link>
                  <button
                    onClick={() => complete(r._id)}
                    disabled={completing === r._id}
                    style={{ background: GREEN, color: BG, border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: 5, opacity: completing === r._id ? 0.6 : 1 }}>
                    <CheckCircle size={13} />
                    {completing === r._id ? '...' : (lang === 'ar' ? 'تأكيد الاستلام' : 'Confirm pickup')}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '24px 0', fontSize: 14 }}>
                {lang === 'ar' ? 'لا توجد عمليات تجميع مكتملة بعد' : 'No completed pickups yet'}
              </div>
            </Card>
          ) : history.map(r => (
            <Card key={r._id} style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={15} color={GREEN} />
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{r.entityName}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                    {r.address} • {r.glassQuantity} كغ • {r.completedDate ? new Date(r.completedDate).toLocaleDateString('ar-DZ') : ''}
                  </div>
                </div>
                <div style={{ background: 'rgba(74,222,128,0.12)', borderRadius: 8, padding: '4px 12px', color: GREEN, fontSize: 13, fontWeight: 700 }}>
                  {r.glassQuantity} كغ
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom links */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
        {[
          { to: '/messages',   icon: <MessageSquare size={16} />, label: lang === 'ar' ? 'الرسائل'     : 'Messages' },
          { to: '/statistics', icon: <BarChart3 size={16} />,     label: lang === 'ar' ? 'الإحصائيات' : 'Statistics' },
          { to: '/profile',    icon: <Leaf size={16} />,          label: lang === 'ar' ? 'الملف الشخصي' : 'Profile' },
        ].map(l => (
          <Link key={l.to} to={l.to} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 18px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
            onMouseEnter={e => e.currentTarget.style.color = GREEN}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <span style={{ color: GREEN }}>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default CollectorDashboard
