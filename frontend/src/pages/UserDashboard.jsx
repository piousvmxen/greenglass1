import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import {
  Plus, Clock, Award, Leaf, TrendingUp, Package,
  CheckCircle, XCircle, BarChart3, MessageSquare,
  Recycle, Star, BookOpen, ChevronRight, Target, Users
} from 'lucide-react'

const BG    = '#0c2d18'
const CARD  = '#14532d'
const CARD2 = '#1a5c32'
const GREEN = '#4ade80'
const GREEN2 = '#86efac'

const isBusiness = (t) => t && t !== 'individual'

const MILESTONES = [
  { kg: 10,   badge: '🌱', label_ar: 'بداية رائعة',       label_en: 'Great Start' },
  { kg: 50,   badge: '♻️', label_ar: 'مدوّر نشيط',         label_en: 'Active Recycler' },
  { kg: 100,  badge: '🥉', label_ar: 'محترف التدوير',      label_en: 'Pro Recycler' },
  { kg: 500,  badge: '🥈', label_ar: 'بطل التدوير',        label_en: 'Recycling Champion' },
  { kg: 1000, badge: '🏆', label_ar: 'أسطورة التدوير',     label_en: 'Recycling Legend' },
]

const TIPS = [
  { icon: '🚿', ar: 'اشطف الزجاجات قبل التجميع لإزالة الأوساخ والروائح.', en: 'Rinse glass bottles before collection to remove dirt and odors.' },
  { icon: '🏷️', ar: 'لا حاجة لإزالة الملصقات — يتم التعامل معها في المنشأة.', en: 'No need to remove labels — they are handled at the facility.' },
  { icon: '🔒', ar: 'لا تكسر الزجاج — حافظ على سلامتك وسلامة المجمّع.', en: 'Don\'t break glass — keep yourself and the collector safe.' },
  { icon: '📦', ar: 'افصل الزجاج عن بقية النفايات لتسريع عملية الجمع.', en: 'Separate glass from other waste to speed up the collection process.' },
  { icon: '🌿', ar: 'كل كيلو زجاج تجمّعه يساعد في تقليل النفايات في مدينتك.', en: 'Every kg of glass you recycle helps reduce waste in your city.' },
]

const STATUS_COLOR = {
  pending: '#fbbf24', accepted: '#60a5fa',
  'in-progress': '#a78bfa', completed: '#4ade80', cancelled: '#f87171'
}
const STATUS_BG = {
  pending: 'rgba(251,191,36,0.15)', accepted: 'rgba(96,165,250,0.15)',
  'in-progress': 'rgba(167,139,250,0.15)', completed: 'rgba(74,222,128,0.15)', cancelled: 'rgba(248,113,113,0.15)'
}
const STATUS_LABEL = {
  pending: 'في الانتظار', accepted: 'مقبول',
  'in-progress': 'جارٍ', completed: 'مكتمل', cancelled: 'ملغى'
}

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1)  return 'الآن'
  if (m < 60) return `منذ ${m} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} س`
  return `منذ ${Math.floor(h / 24)} يوم`
}

function Card({ children, style = {} }) {
  return <div style={{ background: CARD, borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', ...style }}>{children}</div>
}

function SectionTitle({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: GREEN }}>{icon}</span>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{children}</span>
    </div>
  )
}

function MilestoneBar({ kg }) {
  const next = MILESTONES.find(m => kg < m.kg) || MILESTONES[MILESTONES.length - 1]
  const prev = [...MILESTONES].reverse().find(m => kg >= m.kg)
  const pct  = prev
    ? Math.min(100, ((kg - prev.kg) / ((next.kg - prev.kg) || 1)) * 100)
    : Math.min(100, (kg / next.kg) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{kg} كغ</span>
        <span style={{ color: GREEN2, fontSize: 12 }}>الهدف: {next.kg} كغ</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: GREEN, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

const UserDashboard = () => {
  const { user }    = useAuth()
  const { lang }    = useLanguage()
  const [requests, setRequests] = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const business = isBusiness(user?.entityType)

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

  const cancelRequest = async (id) => {
    setCancelling(id)
    try { await axios.put(`/api/requests/${id}/cancel`); await fetchData() }
    catch (e) { console.error(e) }
    finally { setCancelling(null) }
  }

  const upcoming  = requests.filter(r => ['pending', 'accepted', 'in-progress'].includes(r.status))
  const history   = requests.filter(r => r.status === 'completed')
  const kg        = stats?.totalGlassCollected || 0
  const points    = stats?.points || user?.points || 0
  const completed = stats?.completedRequests || 0
  const total     = stats?.totalRequests || 0

  const earnedMilestones = MILESTONES.filter(m => kg >= m.kg)
  const nextMilestone    = MILESTONES.find(m => kg < m.kg)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="udash-root" style={{ minHeight: 'calc(100vh - 80px)', background: BG, fontFamily: 'Cairo, sans-serif', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @media(max-width:768px){
          .udash-root{padding:14px 14px!important;}
          .udash-stats{flex-direction:column!important;}
          .udash-stats>div{min-width:unset!important;flex:none!important;}
          .udash-cols{flex-direction:column!important;}
          .udash-hide-mobile{display:none!important;}
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>
            {lang === 'ar' ? `مرحباً، ${user?.name} 👋` : `Welcome back, ${user?.name} 👋`}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
            {business
              ? (lang === 'ar' ? 'لوحة تحكم المؤسسة — تابع عمليات التدوير وجدول الاستلام' : 'Business Dashboard — track recycling and pickup schedule')
              : (lang === 'ar' ? 'لوحة التحكم الشخصية — تابع نشاطك ومكافآتك' : 'Personal Dashboard — track your activity and rewards')}
          </p>
        </div>
        {!business && (
          <Link to="/create-request" style={{ background: GREEN, color: BG, borderRadius: 12, padding: '10px 20px', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> {lang === 'ar' ? 'طلب تجميع جديد' : 'New Pickup Request'}
          </Link>
        )}
        {business && (
          <Link to="/create-request" style={{ background: GREEN, color: BG, borderRadius: 12, padding: '10px 20px', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> {lang === 'ar' ? 'جدولة استلام' : 'Schedule Pickup'}
          </Link>
        )}
      </div>

      {/* KPI row */}
      <div className="udash-stats" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ background: CARD, borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 160, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{lang === 'ar' ? '⚖️ إجمالي الكميات' : '⚖️ Total Collected'}</div>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{kg.toFixed(0)} <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>كغ</span></div>
        </div>
        <div style={{ background: CARD, borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 160, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{lang === 'ar' ? '🏆 نقاطك' : '🏆 Your Points'}</div>
          <div style={{ color: GREEN, fontSize: 28, fontWeight: 800, marginTop: 4 }}>{points.toLocaleString()}</div>
        </div>
        <div style={{ background: CARD, borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 160, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{lang === 'ar' ? '✅ مكتملة' : '✅ Completed'}</div>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{completed} <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/ {total}</span></div>
        </div>
        {business && (
          <div style={{ background: CARD, borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 160, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{lang === 'ar' ? '📅 قيد الانتظار' : '📅 Pending'}</div>
            <div style={{ color: '#fbbf24', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{upcoming.length}</div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="udash-cols" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Left column */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

          {/* Upcoming pickups */}
          <Card style={{ padding: '18px 20px' }}>
            <SectionTitle icon={<Clock size={18} />}>{lang === 'ar' ? 'الاستلامات القادمة' : 'Upcoming Pickups'}</SectionTitle>
            {upcoming.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                {lang === 'ar' ? 'لا توجد استلامات قادمة' : 'No upcoming pickups'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {upcoming.map((r, i) => (
                  <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < upcoming.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: STATUS_BG[r.status] || 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={16} color={STATUS_COLOR[r.status] || '#fff'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.entityName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{r.glassQuantity} كغ • {timeAgo(r.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ background: STATUS_BG[r.status], color: STATUS_COLOR[r.status], fontSize: 10, borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{STATUS_LABEL[r.status]}</span>
                      {r.status === 'pending' && (
                        <button onClick={() => cancelRequest(r._id)} disabled={cancelling === r._id}
                          style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                          {cancelling === r._id ? '...' : (lang === 'ar' ? 'إلغاء' : 'Cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              <Link to="/requests" style={{ color: GREEN, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                {lang === 'ar' ? 'عرض كل الطلبات' : 'View all requests'}
                <ChevronRight size={13} style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
              </Link>
            </div>
          </Card>

          {/* Recycling history */}
          <Card style={{ padding: '18px 20px' }}>
            <SectionTitle icon={<Recycle size={18} />}>{lang === 'ar' ? 'سجل التجميع' : 'Recycling History'}</SectionTitle>
            {history.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                {lang === 'ar' ? 'لا توجد عمليات مكتملة بعد' : 'No completed pickups yet'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {history.slice(0, 5).map((r, i) => (
                  <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < Math.min(history.length, 5) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <CheckCircle size={16} color={GREEN} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 13 }}>{r.entityName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{new Date(r.completedDate || r.createdAt).toLocaleDateString('ar-DZ')}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ color: GREEN, fontWeight: 700, fontSize: 13 }}>{r.glassQuantity} كغ</div>
                      {r.pointsAwarded > 0 && <div style={{ color: '#fbbf24', fontSize: 10 }}>+{r.pointsAwarded} نقطة</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Business only: glass volumes by type */}
          {business && (
            <Card style={{ padding: '18px 20px' }}>
              <SectionTitle icon={<BarChart3 size={18} />}>{lang === 'ar' ? 'حجم الزجاج المجمّع حسب النوع' : 'Glass Volumes by Type'}</SectionTitle>
              {(() => {
                const byType = {}
                requests.filter(r => r.status === 'completed').forEach(r => {
                  const t = r.glassType || 'mixed'
                  byType[t] = (byType[t] || 0) + r.glassQuantity
                })
                const total = Object.values(byType).reduce((s, v) => s + v, 0) || 1
                const typeLabels = { bottles: 'زجاجات 🍾', windows: 'نوافذ 🪟', broken: 'مكسور 💎', mixed: 'مختلط ♻️' }
                const typeColors = { bottles: '#60a5fa', windows: '#a78bfa', broken: '#fb923c', mixed: GREEN }
                return Object.entries(byType).length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>لا توجد بيانات بعد</div>
                ) : Object.entries(byType).map(([type, val]) => (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{typeLabels[type] || type}</span>
                      <span style={{ color: typeColors[type] || GREEN, fontWeight: 700, fontSize: 13 }}>{val.toFixed(0)} كغ</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                      <div style={{ width: `${(val / total) * 100}%`, height: '100%', background: typeColors[type] || GREEN, borderRadius: 3 }} />
                    </div>
                  </div>
                ))
              })()}
            </Card>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

          {/* Rewards & Credits */}
          <Card style={{ padding: '18px 20px' }}>
            <SectionTitle icon={<Award size={18} />}>{lang === 'ar' ? 'المكافآت والنقاط' : 'Rewards & Credits'}</SectionTitle>
            <div style={{ textAlign: 'center', padding: '8px 0 14px' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: GREEN }}>{points.toLocaleString()}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{lang === 'ar' ? 'نقطة مكتسبة' : 'points earned'}</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 4 }}>{lang === 'ar' ? '• نقطة واحدة لكل كيلو زجاج تجمّعه' : '• 1 point per kg of glass collected'}</div>
            </div>
            <Link to="/statistics" style={{ display: 'block', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '9px 0', textAlign: 'center', color: GREEN, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              {lang === 'ar' ? 'عرض الإحصائيات الكاملة' : 'View Full Statistics'}
            </Link>
          </Card>

          {/* Milestones */}
          <Card style={{ padding: '18px 20px' }}>
            <SectionTitle icon={<Star size={18} />}>{lang === 'ar' ? 'الإنجازات والأوسمة' : 'Milestones & Badges'}</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {MILESTONES.map(m => {
                const earned = kg >= m.kg
                return (
                  <div key={m.kg} style={{ background: earned ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${earned ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center', flex: '1 1 80px', opacity: earned ? 1 : 0.4 }}>
                    <div style={{ fontSize: 22 }}>{m.badge}</div>
                    <div style={{ color: earned ? GREEN : 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3, fontWeight: earned ? 700 : 400 }}>{lang === 'ar' ? m.label_ar : m.label_en}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{m.kg} كغ</div>
                  </div>
                )
              })}
            </div>
            {nextMilestone && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
                  {lang === 'ar' ? `التالي: ${nextMilestone.label_ar} (${nextMilestone.kg} كغ)` : `Next: ${nextMilestone.label_en} (${nextMilestone.kg} kg)`}
                </div>
                <MilestoneBar kg={kg} />
              </div>
            )}
            {!nextMilestone && (
              <div style={{ textAlign: 'center', color: GREEN, fontWeight: 700, fontSize: 13 }}>🎉 {lang === 'ar' ? 'حققت جميع الإنجازات!' : 'All milestones achieved!'}</div>
            )}
          </Card>

          {/* Individual only: Tips */}
          {!business && (
            <Card style={{ padding: '18px 20px' }}>
              <SectionTitle icon={<BookOpen size={18} />}>{lang === 'ar' ? 'نصائح التدوير' : 'Recycling Tips'}</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TIPS.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < TIPS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }}>{tip.icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.6 }}>{lang === 'ar' ? tip.ar : tip.en}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Business only: Sustainability */}
          {business && (
            <Card style={{ padding: '18px 20px' }}>
              <SectionTitle icon={<Leaf size={18} />}>{lang === 'ar' ? 'التقدم البيئي' : 'Sustainability Progress'}</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: lang === 'ar' ? 'هدف الشهر' : 'Monthly Goal',        current: kg,        target: 200, unit: 'كغ' },
                  { label: lang === 'ar' ? 'عمليات مكتملة' : 'Completed Ops',   current: completed, target: 20,  unit: lang === 'ar' ? 'عملية' : 'ops' },
                ].map(g => (
                  <div key={g.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{g.label}</span>
                      <span style={{ color: GREEN, fontSize: 12, fontWeight: 700 }}>{Math.min(g.current, g.target).toFixed(0)} / {g.target} {g.unit}</span>
                    </div>
                    <div style={{ height: 7, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                      <div style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%`, height: '100%', background: GREEN, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/map" style={{ display: 'block', marginTop: 14, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '9px 0', textAlign: 'center', color: GREEN, textDecoration: 'none', fontSize: 13 }}>
                {lang === 'ar' ? 'عرض موقعنا على الخريطة' : 'View our location on map'}
              </Link>
            </Card>
          )}

          {/* Quick nav */}
          <Card style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { to: '/requests',   icon: <Package size={15} />,     label: lang === 'ar' ? 'كل الطلبات'    : 'All Requests' },
                { to: '/messages',   icon: <MessageSquare size={15} />, label: lang === 'ar' ? 'الرسائل'      : 'Messages' },
                { to: '/statistics', icon: <BarChart3 size={15} />,    label: lang === 'ar' ? 'الإحصائيات'  : 'Statistics' },
                { to: '/map',        icon: <TrendingUp size={15} />,   label: lang === 'ar' ? 'الخريطة'      : 'Map' },
              ].map((l, i, arr) => (
                <Link key={l.to} to={l.to} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.color = GREEN}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: GREEN }}>{l.icon}</span>
                    {l.label}
                  </span>
                  <ChevronRight size={13} style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
