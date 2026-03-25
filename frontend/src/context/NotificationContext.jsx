import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'
import io from 'socket.io-client'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    const newSocket = io({
      auth: { token },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('🔔 Notification socket connected')
      newSocket.emit('join-user', user._id)
    })

    newSocket.on('new-notification', (data) => {
      console.log('🔔 New notification received:', data)
      fetchNotifications()
      fetchUnreadCount()
    })

    newSocket.on('disconnect', () => {
      console.log('🔔 Notification socket disconnected')
    })

    setSocket(newSocket)

    return () => {
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [user])

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const res = await axios.get('/api/notifications')
      setNotifications(res.data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    try {
      const res = await axios.get('/api/notifications/unread-count')
      setUnreadCount(res.data.count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      )
      fetchUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      fetchUnreadCount()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user])

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
