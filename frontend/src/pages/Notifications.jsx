import { useState, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'
import { Check, Trash2, Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'

const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications()
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const ar = lang === 'ar'

  useEffect(() => {
    fetchNotifications()
  }, [])

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id)
    if (notification.relatedRequestId) navigate('/requests')
    else if (notification.relatedMessageId) navigate('/messages')
  }

  const formatTime = (date) => {
    const now = new Date()
    const d = new Date(date)
    const diff = now - d
    const minutes = Math.floor(diff / 60000)
    const hours   = Math.floor(diff / 3600000)
    const days    = Math.floor(diff / 86400000)
    if (minutes < 1)  return ar ? 'الآن' : 'just now'
    if (minutes < 60) return ar ? `منذ ${minutes} دقيقة` : `${minutes}m ago`
    if (hours < 24)   return ar ? `منذ ${hours} ساعة` : `${hours}h ago`
    if (days < 7)     return ar ? `منذ ${days} يوم` : `${days}d ago`
    return d.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getNotificationIcon = (type) => {
    const icons = {
      new_request:       '📋',
      request_accepted:  '✅',
      request_completed: '🎉',
      new_message:       '💬',
      request_cancelled: '❌',
    }
    return icons[type] || '🔔'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Bell className="text-primary-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {ar ? 'الإشعارات' : 'Notifications'}
              </h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {unreadCount} {ar ? 'غير مقروء' : 'unread'}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead()
                  toast.success(ar ? 'تم تعليم جميع الإشعارات كمقروء' : 'All marked as read')
                }}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <CheckCheck size={16} />
                {ar ? 'تعليم الكل كمقروء' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'all',    label: ar ? `الكل (${notifications.length})` : `All (${notifications.length})` },
              { key: 'unread', label: ar ? `غير المقروء (${unreadCount})`    : `Unread (${unreadCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 font-medium transition-colors text-sm ${
                  filter === tab.key
                    ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="text-gray-400 dark:text-gray-500" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {filter === 'unread'
                    ? (ar ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications')
                    : (ar ? 'لا توجد إشعارات بعد' : 'No notifications yet')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {ar ? 'ستظهر إشعاراتك هنا عند وصولها' : "Your notifications will appear here when they arrive"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                    !notification.isRead
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatTime(notification.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification._id)
                              toast.success(ar ? 'تم حذف الإشعار' : 'Notification deleted')
                            }}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
