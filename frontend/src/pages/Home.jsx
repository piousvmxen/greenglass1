import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import {
  Map, Users, Award, BarChart3, Leaf, Recycle, Globe,
  ArrowRight, Mail, Phone, MapPin, Send,
  Facebook, Instagram, Linkedin, Twitter,
  CheckCircle, XCircle, Loader
} from 'lucide-react'

/* ─── Animated Counter ───────────────────────────────────────── */
function CountUp({ target, suffix = '', duration = 1400, running }) {
  const [count, setCount] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!running) return
    const start = performance.now()
    const animate = (now) => {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, target, duration])

  const display = count >= 1000 ? (count >= 1000000 ? `${Math.floor(count / 1000000)}M` : `${Math.floor(count / 1000)}k`) : count.toString()

  return <>{display}{suffix}</>
}

/* ─── Stakeholder Card Configs ───────────────────────────────── */
const STAKEHOLDERS = [
  {
    key:     'individuals',
    icon:    <Users className="h-6 w-6" />,
    hoverBg:    'rgba(22,163,74,0.12)',
    hoverBorder:'rgba(22,163,74,0.4)',
    hoverIcon:  'rgba(22,163,74,0.2)',
    hoverColor: '#16a34a',
    mt: false,
  },
  {
    key:     'hotels',
    icon:    (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    hoverBg:    'rgba(217,119,6,0.12)',
    hoverBorder:'rgba(217,119,6,0.4)',
    hoverIcon:  'rgba(217,119,6,0.2)',
    hoverColor: '#d97706',
    mt: true,
  },
  {
    key:     'collectors',
    icon:    <Recycle className="h-6 w-6" />,
    hoverBg:    'rgba(37,99,235,0.12)',
    hoverBorder:'rgba(37,99,235,0.4)',
    hoverIcon:  'rgba(37,99,235,0.2)',
    hoverColor: '#2563eb',
    mt: false,
  },
  {
    key:     'factories',
    icon:    (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    hoverBg:    'rgba(124,58,237,0.12)',
    hoverBorder:'rgba(124,58,237,0.4)',
    hoverIcon:  'rgba(124,58,237,0.2)',
    hoverColor: '#7c3aed',
    mt: true,
  },
]

/* ─── Contact form validation ────────────────────────────────── */
const validateContact = (form) => {
  const errors = {}
  if (!form.name.trim())                         errors.name    = true
  if (!/\S+@\S+\.\S+/.test(form.email))         errors.email   = true
  if (form.message.trim().length < 10)           errors.message = true
  return errors
}

/* ─── Component ─────────────────────────────────────────────── */
const Home = () => {
  const { user }        = useAuth()
  const { t, lang }     = useLanguage()
  const { theme }       = useTheme()
  const location        = useLocation()
  const ar              = lang === 'ar'

  /* Contact form */
  const [contactForm, setContactForm]       = useState({ name: '', email: '', message: '' })
  const [contactErrors, setContactErrors]   = useState({})
  const [contactTouched, setContactTouched] = useState({})
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSent, setContactSent]       = useState(false)

  /* Animated counters */
  const [countersRunning, setCountersRunning] = useState(false)
  const statsRef = useRef(null)

  /* Hover states for stakeholder cards */
  const [hoveredCard, setHoveredCard] = useState(null)

  /* Scroll reveal observer */
  const revealRef = useRef(null)

  /* ── Scroll to contact if navigated with state ── */
  useEffect(() => {
    if (location.state?.scrollToContact) {
      const el = document.getElementById('contact')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }
  }, [location.state])

  /* ── IntersectionObserver: trigger counters once ── */
  useEffect(() => {
    if (!statsRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersRunning(true)
          obs.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  /* ── IntersectionObserver: scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  /* ── Contact form handlers ── */
  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value })
    setContactErrors(prev => ({ ...prev, [e.target.name]: false }))
  }

  const handleContactBlur = (e) => {
    setContactTouched(prev => ({ ...prev, [e.target.name]: true }))
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    const allTouched = { name: true, email: true, message: true }
    setContactTouched(allTouched)
    const errors = validateContact(contactForm)
    setContactErrors(errors)
    if (Object.keys(errors).length) return

    setContactSubmitting(true)
    try {
      await new Promise(res => setTimeout(res, 900)) // simulate send
      setContactSent(true)
      setContactForm({ name: '', email: '', message: '' })
      setContactTouched({})
      toast.success(ar ? 'تم إرسال رسالتك بنجاح!' : 'Message sent successfully!')
      setTimeout(() => setContactSent(false), 5000)
    } catch {
      toast.error(ar ? 'فشل إرسال الرسالة. حاول مرة أخرى.' : 'Failed to send. Please try again.')
    } finally {
      setContactSubmitting(false)
    }
  }

  const inputErrClass = (field) =>
    contactTouched[field] && contactErrors[field]
      ? 'border-red-400 focus:ring-red-300'
      : ''

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-[#0a0f1e] text-gray-800 dark:text-gray-200 font-['Cairo'] overflow-x-hidden transition-colors duration-300">

      {/* ══ Hero Section ═══════════════════════════════════════ */}
      <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 z-0">
          <img src="/ecocity-hero.png" alt={t('home_hero_title1')} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-800/60"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="max-w-2xl text-white animate-fade-in-up">
            <span className="inline-block py-1 px-3 rounded-full bg-green-500/30 border border-green-400/50 text-green-100 text-sm font-semibold mb-6 backdrop-blur-sm">
              {t('home_badge')}
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t('home_hero_title1')}<br />
              <span className="text-green-300">{t('home_hero_title2')}</span>
            </h1>
            <p className="text-xl text-green-50 mb-10 leading-relaxed max-w-xl">
              {t('home_hero_desc')}
            </p>
            {!user && (
              <div className="flex flex-wrap gap-4 delay-200 animate-fade-in-up">
                <Link
                  to="/register"
                  className="bg-white text-green-800 hover:bg-green-50 px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
                >
                  {t('home_start_now')}
                  <ArrowRight className={`h-5 w-5 ${ar ? 'rotate-180' : ''}`} />
                </Link>
                <Link
                  to="/login"
                  className="bg-green-700/50 hover:bg-green-700/70 border border-green-400/50 text-white px-8 py-4 rounded-full font-bold text-lg transition-all backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  {t('home_login')}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-[60px] lg:h-[120px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.9,122.9,190.49,112.5,235.25,104.72,279.79,83.9,321.39,56.44Z"
              className="fill-gray-50 dark:fill-[#111827] transition-colors duration-300" />
          </svg>
        </div>
      </section>

      {/* ══ Features Section ═══════════════════════════════════ */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-[#111827] transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16 reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('home_features_title')}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('home_features_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Map className="h-8 w-8 text-green-600" />,   bg: 'bg-green-50 dark:bg-green-900/20',   title: t('feat_map_title'),    desc: t('feat_map_desc') },
              { icon: <Recycle className="h-8 w-8 text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-900/20',    title: t('feat_collect_title'),desc: t('feat_collect_desc') },
              { icon: <Award className="h-8 w-8 text-yellow-600" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20',title: t('feat_reward_title'), desc: t('feat_reward_desc') },
              { icon: <BarChart3 className="h-8 w-8 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20', title: t('feat_stats_title'), desc: t('feat_stats_desc') },
            ].map((feat, i) => (
              <div key={i} className={`reveal bg-white dark:bg-[#0d1424] rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-800 group hover:-translate-y-1`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-16 h-16 ${feat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feat.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Stakeholders Section ═══════════════════════════════ */}
      <section id="audience" className="py-24 bg-white dark:bg-[#0d1424] relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-green-50 dark:bg-green-900/10 opacity-50 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-blue-50 dark:bg-blue-900/10 opacity-50 blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
            <div className="md:w-1/2 reveal">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {t('home_audience_title1')} <br />
                <span className="text-green-600">{t('home_audience_title2')}</span> {t('home_audience_title3')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{t('home_audience_desc')}</p>
            </div>

            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              {STAKEHOLDERS.map((card) => {
                const hovered = hoveredCard === card.key
                return (
                  <div
                    key={card.key}
                    className={`rounded-2xl p-6 flex flex-col items-center text-center cursor-default ${card.mt ? 'mt-8' : ''} reveal`}
                    style={{
                      background: hovered ? card.hoverBg : undefined,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: hovered ? card.hoverBorder : 'transparent',
                      backgroundColor: hovered ? card.hoverBg : (theme === 'dark' ? '#0d1424' : 'rgb(249,250,251)'),
                      transform: hovered ? 'translateY(-4px)' : 'none',
                      boxShadow: hovered ? `0 8px 24px ${card.hoverBg}` : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={() => setHoveredCard(card.key)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{
                        background: hovered ? card.hoverIcon : 'white',
                        boxShadow: hovered ? `0 0 0 3px ${card.hoverBorder}` : '0 1px 4px rgba(0,0,0,0.08)',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <span style={{ color: hovered ? card.hoverColor : '#16a34a', transition: 'color 0.25s ease' }}>
                        {card.icon}
                      </span>
                    </div>
                    <h4
                      className="font-bold mb-1 transition-colors duration-200"
                      style={{ color: hovered ? card.hoverColor : undefined }}
                    >
                      {t(`aud_${card.key === 'hotels' ? 'hotels' : card.key}`)}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t(`aud_${card.key === 'hotels' ? 'hotels' : card.key}_sub`)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ Stats / Environmental Goals ════════════════════════ */}
      <section id="impact" ref={statsRef} className="py-20 bg-green-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <Globe className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home_stats_title')}</h2>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">{t('home_stats_subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { target: 50,      suffix: '+', label: t('stats_tons') },
              { target: 5000,    suffix: '',  label: t('stats_users'),  display5k: true },
              { target: 200,     suffix: '',  label: t('stats_cafes') },
              { target: 10000000,suffix: '',  label: t('stats_points'), display10m: true },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-2">{t('stats_goal')}</div>
                <div className="text-4xl md:text-5xl font-extrabold text-green-300 mb-2">
                  <CountUp
                    target={stat.target}
                    suffix={stat.suffix}
                    running={countersRunning}
                    duration={1200 + i * 100}
                  />
                </div>
                <div className="text-green-50 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA Section ════════════════════════════════════════ */}
      {!user && (
        <section className="py-24 bg-gray-50 dark:bg-[#111827] transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="reveal bg-white dark:bg-[#0d1424] rounded-3xl p-8 md:p-16 text-center shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors duration-300">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-50 dark:bg-green-900/10 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
              <Leaf className="h-16 w-16 text-green-600 mx-auto mb-6 relative z-10" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 relative z-10">{t('home_cta_title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">{t('home_cta_desc')}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-lg hover:shadow-green-600/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  {t('home_cta_btn')}
                  <ArrowRight className={`h-5 w-5 ${ar ? 'rotate-180' : ''}`} />
                </Link>
                <Link
                  to="/login"
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center hover:scale-105 active:scale-95"
                >
                  {t('nav_login')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ Contact Section ════════════════════════════════════ */}
      {!user && (
        <section id="contact" className="py-24 bg-white dark:bg-[#0a0f1e] transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-2xl mx-auto mb-16 reveal">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('contact_title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{t('contact_subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Contact Info */}
              <div className="space-y-8 reveal">
                <div>
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-500 mb-1">
                    <Leaf className="h-5 w-5" />
                    <span className="font-bold text-xl">GREEN GLASS</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t('contact_brand_desc')}</p>
                </div>

                <div className="space-y-5">
                  <a href="mailto:omaredz68@gmail.com" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors flex-shrink-0">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{t('contact_email_label')}</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors">omaredz68@gmail.com</div>
                    </div>
                  </a>

                  <a href="https://wa.me/213655773240" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors flex-shrink-0">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{t('contact_phone_label')}</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors" dir="ltr">+213 655 773 240</div>
                    </div>
                  </a>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{t('contact_location_label')}</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium">{ar ? 'سيدي بلعباس، الجزائر' : 'Sidi Bel Abbes, Algeria'}</div>
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div>
                  <p className="text-sm text-gray-400 mb-4">{t('contact_social')}</p>
                  <div className="flex gap-3">
                    {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                      <a key={i} href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-500 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:scale-110 active:scale-95">
                        <Icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-gray-50 dark:bg-[#111827] rounded-3xl p-8 border border-gray-100 dark:border-gray-800 transition-colors duration-300 reveal">
                {contactSent ? (
                  <div className="text-center py-12 animate-scale-in">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('contact_sent_title')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t('contact_sent_desc')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5" noValidate>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('contact_form_title')}</h3>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('contact_name')}</label>
                      <input
                        name="name" type="text"
                        required
                        value={contactForm.name}
                        onChange={handleContactChange}
                        onBlur={handleContactBlur}
                        placeholder={t('contact_name_ph')}
                        className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 ${inputErrClass('name') || 'border-gray-200 dark:border-gray-700'}`}
                      />
                      {contactTouched.name && contactErrors.name && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                          <XCircle size={11} /> {ar ? 'الاسم مطلوب' : 'Name is required'}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('contact_email')}</label>
                      <input
                        name="email" type="email"
                        required
                        value={contactForm.email}
                        onChange={handleContactChange}
                        onBlur={handleContactBlur}
                        placeholder="example@email.com"
                        className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 ${inputErrClass('email') || 'border-gray-200 dark:border-gray-700'}`}
                        dir="ltr"
                      />
                      {contactTouched.email && contactErrors.email && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                          <XCircle size={11} /> {ar ? 'بريد إلكتروني غير صالح' : 'Enter a valid email'}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('contact_message')}</label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        value={contactForm.message}
                        onChange={handleContactChange}
                        onBlur={handleContactBlur}
                        placeholder={t('contact_message_ph')}
                        className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-none ${inputErrClass('message') || 'border-gray-200 dark:border-gray-700'}`}
                      />
                      {contactTouched.message && contactErrors.message && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                          <XCircle size={11} /> {ar ? 'الرسالة قصيرة جداً (10 أحرف على الأقل)' : 'Message is too short (min 10 characters)'}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-md hover:shadow-green-600/25 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {contactSubmitting ? (
                        <><Loader className="animate-spin h-5 w-5" /> {ar ? 'جارٍ الإرسال...' : 'Sending...'}</>
                      ) : (
                        <><Send className="h-5 w-5" /> {t('contact_send_btn')}</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ Footer ═════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Leaf className="h-5 w-5 text-green-500" />
            <span className="text-white font-bold">GREEN GLASS</span>
          </div>
          <p className="text-sm">{ar ? '© 2025 جرين جلاس. جميع الحقوق محفوظة.' : '© 2025 Green Glass. All rights reserved.'}</p>
        </div>
      </footer>

    </div>
  )
}

export default Home
