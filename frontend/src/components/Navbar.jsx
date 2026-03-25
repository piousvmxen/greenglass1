import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { Menu, X, LogOut, User, Map, MessageSquare, BarChart3, Shield, Bell, Check, Trash2, Moon, Sun, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import LogoutButton from './LogoutButton'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const { theme, toggleTheme } = useTheme()
  const { lang, t, toggleLang } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const notificationRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const ar = lang === 'ar'

  useEffect(() => {
    const img = new Image()
    img.onerror = () => setLogoError(true)
    img.src = '/logo.jpeg'
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    setMobileMenuOpen(false)
    logout()
  }

  const handleContactClick = (e) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollToContact: true } })
    }
    setMobileMenuOpen(false)
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id)
    setNotificationDropdownOpen(false)
    if (notification.relatedRequestId) {
      navigate('/requests')
    } else if (notification.relatedMessageId) {
      navigate('/messages')
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diff = now - notificationDate
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return ar ? 'الآن' : 'just now'
    if (minutes < 60) return ar ? `منذ ${minutes} دقيقة` : `${minutes}m ago`
    if (hours < 24) return ar ? `منذ ${hours} ساعة` : `${hours}h ago`
    if (days < 7) return ar ? `منذ ${days} يوم` : `${days}d ago`
    return notificationDate.toLocaleDateString(ar ? 'ar-EG' : 'en-US')
  }

  const navLinkClass = "text-gray-700 hover:text-green-700 transition-colors duration-200 dark:text-gray-300 dark:hover:text-green-400 font-medium"

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 font-['Cairo'] dark:bg-gray-900/90 dark:border-b dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              {logoError ? (
                <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-base">G</div>
              ) : (
                <img src="/logo.jpeg" alt="Green Glass" className="h-9 w-9 rounded-full object-cover" onError={() => setLogoError(true)} />
              )}
              <span className="text-xl font-bold text-green-800 tracking-tight dark:text-green-400">GREEN GLASS</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">

              {/* Home — only for guests */}
              {!user && (
                <Link to="/" className={navLinkClass}>{t('nav_home')}</Link>
              )}

              {/* Contact — only for guests */}
              {!user && (
                <button onClick={handleContactClick} className={navLinkClass + ' bg-transparent border-0 cursor-pointer'}>
                  {t('nav_contact')}
                </button>
              )}

              {user ? (
                <>
                  {/* Profile — replaces Home for logged-in users */}
                  <Link to="/profile" className={navLinkClass + ' flex items-center gap-1'}>
                    <User size={17} />
                    {user.name}
                  </Link>

                  <Link to="/dashboard" className={navLinkClass}>{t('nav_dashboard')}</Link>
                  <Link to="/map" className={navLinkClass + ' flex items-center gap-1'}>
                    <Map size={17} />
                    {t('nav_map')}
                  </Link>
                  <Link to="/requests" className={navLinkClass}>{t('nav_requests')}</Link>
                  <Link to="/messages" className={navLinkClass + ' flex items-center gap-1'}>
                    <MessageSquare size={17} />
                    {t('nav_messages')}
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/statistics" className={navLinkClass + ' flex items-center gap-1'}>
                      <BarChart3 size={17} />
                      {t('nav_statistics')}
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className={navLinkClass + ' flex items-center gap-1'}>
                      <Shield size={17} />
                      {t('nav_admin')}
                    </Link>
                  )}

                  {/* Notification Bell */}
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                      className={navLinkClass + ' relative flex items-center gap-1'}
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto dark:bg-gray-800 dark:border-gray-700 animate-slide-down">
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center dark:border-gray-700">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{t('nav_notifications')}</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => { markAllAsRead(); setNotificationDropdownOpen(false) }}
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                            >
                              <Check size={14} />
                              {t('notif_mark_all')}
                            </button>
                          )}
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center">
                              <Bell className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={28} />
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('notif_empty')}</p>
                            </div>
                          ) : (
                            notifications.slice(0, 10).map((notification) => (
                              <div
                                key={notification._id}
                                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTime(notification.createdAt)}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id) }}
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 10 && (
                          <div className="p-3 border-t border-gray-200 text-center dark:border-gray-700">
                            <Link
                              to="/notifications"
                              onClick={() => setNotificationDropdownOpen(false)}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                            >
                              {t('nav_notifications')}
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleLang}
                      className="px-2 py-1 text-xs font-bold border rounded-md border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {lang === 'ar' ? 'EN' : 'AR'}
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
                    </button>
                  </div>

                  <LogoutButton
                    onClick={() => setShowLogoutConfirm(true)}
                    label={t('nav_logout')}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleLang}
                      className="px-2 py-1 text-xs font-bold border rounded-md border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {lang === 'ar' ? 'EN' : 'AR'}
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
                    </button>
                  </div>
                  <Link to="/login" className="text-green-700 font-medium hover:text-green-900 transition-colors dark:text-green-400 dark:hover:text-green-300">
                    {t('nav_login')}
                  </Link>
                  <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-medium transition-all hover:shadow-md hover:shadow-green-600/20 active:scale-95">
                    {t('nav_register')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 dark:bg-gray-900/95 border-t border-gray-100 dark:border-gray-800 animate-slide-down">
              <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={toggleLang}
                  className="flex-1 py-2.5 text-sm font-bold border rounded-xl border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {lang === 'ar' ? 'English' : 'العربية'}
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {theme === 'light' ? <><Moon size={16} /> <span>Dark</span></> : <><Sun size={16} /> <span>Light</span></>}
                </button>
              </div>

              <div className="flex flex-col pt-1">
                {(user ? [
                  { to: '/dashboard',     label: t('nav_dashboard'),    show: true },
                  { to: '/map',           label: t('nav_map'),           show: true },
                  { to: '/requests',      label: t('nav_requests'),      show: true },
                  { to: '/messages',      label: t('nav_messages'),      show: true },
                  { to: '/notifications', label: t('nav_notifications'), show: true, badge: unreadCount },
                  { to: '/statistics',    label: t('nav_statistics'),    show: user.role === 'admin' },
                  { to: '/admin',         label: t('nav_admin'),         show: user.role === 'admin' },
                  { to: '/profile',       label: t('nav_profile'),       show: true },
                ] : [
                  { to: '/',        label: t('nav_home'),     show: true },
                  { to: '/login',    label: t('nav_login'),    show: true },
                  { to: '/register', label: t('nav_register'), show: true },
                ]).filter(l => l.show).map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-green-700 dark:hover:text-green-400 transition-colors border-b border-gray-50 dark:border-gray-800/50 font-medium"
                  >
                    <span>{link.label}</span>
                    {link.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                  </Link>
                ))}

                {!user && (
                  <button
                    onClick={handleContactClick}
                    className="flex items-center px-4 py-3.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-green-700 dark:hover:text-green-400 transition-colors border-b border-gray-50 dark:border-gray-800/50 font-medium w-full text-start"
                  >
                    {t('nav_contact')}
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true) }}
                    className="flex items-center gap-2 px-4 py-3.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors w-full mt-1"
                  >
                    <LogOut size={18} />
                    {t('nav_logout')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false) }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {ar ? 'تسجيل الخروج' : 'Log Out'}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {ar ? 'هل أنت متأكد أنك تريد تسجيل الخروج؟' : 'Are you sure you want to log out?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                {ar ? 'تسجيل الخروج' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
