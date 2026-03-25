import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { Send, MessageSquare, Headphones, Shield } from 'lucide-react'

const Messages = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [isSupportMessage, setIsSupportMessage] = useState(false)
  const messagesEndRef = useRef(null)

  const selectedConversationRef = useRef(null)
  selectedConversationRef.current = selectedConversation

  useEffect(() => {
    if (!user) return

    const newSocket = io({
      auth: {
        token: localStorage.getItem('token')
      }
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      if (user._id) {
        newSocket.emit('join-user', user._id)
      }
    })

    newSocket.on('receive-message', (data) => {
      const conv = selectedConversationRef.current
      if (conv) {
        const senderId = typeof data.senderId === 'object' ? data.senderId._id || data.senderId : data.senderId
        const receiverId = typeof data.receiverId === 'object' ? data.receiverId._id || data.receiverId : data.receiverId
        const convId = conv._id.toString()
        
        if (senderId?.toString() === convId || receiverId?.toString() === convId) {
          setMessages(prev => {
            if (prev.some(msg => msg._id === data._id)) return prev
            return [...prev, data]
          })
        }
      }
    })

    newSocket.on('new-message', (data) => {
      const senderId = typeof data.senderId === 'object' ? data.senderId._id || data.senderId : data.senderId
      const receiverId = typeof data.receiverId === 'object' ? data.receiverId._id || data.receiverId : data.receiverId
      const isInvolved = senderId?.toString() === user._id?.toString() || receiverId?.toString() === user._id?.toString()
      
      if (isInvolved) {
        fetchConversations()
        
        const conv = selectedConversationRef.current
        if (conv) {
          const convId = conv._id.toString()
          if (senderId?.toString() === convId || receiverId?.toString() === convId) {
            setMessages(prev => {
              if (prev.some(msg => msg._id === data._id)) return prev
              return [...prev, data]
            })
          }
        }
      }
    })

    setSocket(newSocket)

    return () => newSocket.close()
  }, [user])

  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchAdmin()
    }
  }, [user])

  const fetchAdmin = async () => {
    try {
      const res = await axios.get('/api/messages/admin')
      setAdminUser(res.data)
    } catch (error) {
      console.error('Error fetching admin:', error)
    }
  }

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/messages/conversations')
      setConversations(res.data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error(t('error_fetch_conversations'))
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const res = await axios.get('/api/messages', { params: { userId } })
      // Filter messages to show only relevant ones
      let filteredMessages = res.data
      
      // If current user is admin and viewing support messages, show all support messages with this user
      if (user?.role === 'admin' && selectedConversation?.role !== 'admin') {
        // Show messages where this user sent support messages to any admin
        filteredMessages = res.data.filter(msg => {
          const isSupportMsg = msg.content?.startsWith('[دعم]')
          const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId
          const receiverId = typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId
          
          // Show if it's a support message from this user, or any message in this conversation
          return (isSupportMsg && senderId?.toString() === userId?.toString()) ||
                 (senderId?.toString() === userId?.toString() || receiverId?.toString() === userId?.toString())
        })
      }
      
      setMessages(filteredMessages)
    } catch (error) {
      toast.error(t('error_fetch_messages'))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    // If support message, use admin as receiver
    const receiverId = isSupportMessage && adminUser ? adminUser._id : selectedConversation?._id
    if (!receiverId) {
      toast.error(t('error_select_conversation'))
      return
    }

    try {
      const res = await axios.post('/api/messages', {
        receiverId,
        content: newMessage,
        isSupport: isSupportMessage
      })
      setMessages(prev => [...prev, res.data])
      setNewMessage('')
      setIsSupportMessage(false)
      
      // If it was a support message, refresh conversations
      if (isSupportMessage) {
        fetchConversations()
        // Select admin conversation
        if (adminUser) {
          setSelectedConversation(adminUser)
        }
      }
      
      if (socket) {
        socket.emit('send-message', {
          roomId: receiverId,
          message: res.data
        })
      }
    } catch (error) {
      toast.error(t('error_send_message'))
    }
  }

  const handleContactSupport = () => {
    if (adminUser) {
      setSelectedConversation(adminUser)
      setIsSupportMessage(true)
      fetchMessages(adminUser._id)
    } else {
      toast.error(t('error_admin_not_found'))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('nav_messages')}</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="card h-[600px] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('conversations')}</h2>
            {user?.role !== 'admin' && adminUser && (
              <button
                onClick={handleContactSupport}
                className="btn-primary text-sm flex items-center gap-1 px-3 py-1"
                title={t('contact_support')}
              >
                <Headphones size={16} />
                {t('support')}
              </button>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-right p-3 rounded-lg transition-colors ${
                    selectedConversation?._id === conv._id
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {conv.role === 'admin' && <Shield size={16} className="text-primary-600 dark:text-primary-400" />}
                    <span className="font-semibold">{conv.name || t('user')}</span>
                  </div>
                  <div className="text-sm opacity-70">
                    {conv.role === 'admin' ? t('admin_support') :
                     conv.entityType ? t(`entity_${conv.entityType}`) : t('undefined')}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('no_conversations')}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="md:col-span-2 card flex flex-col" style={{ height: '600px' }}>
          {selectedConversation ? (
            <>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  {selectedConversation.role === 'admin' && <Shield size={20} className="text-primary-600 dark:text-primary-400" />}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedConversation.name}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedConversation.role === 'admin' ? t('admin_support_desc') : selectedConversation.email}
                </p>
                {isSupportMessage && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{t('support_message')}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length > 0 ? (
                  messages.map((message) => {
                    const senderId = typeof message.senderId === 'object' 
                      ? message.senderId._id || message.senderId 
                      : message.senderId
                    const isOwnMessage = senderId.toString() === user._id.toString()
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {new Date(message.createdAt).toLocaleString(t('locale'))}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <p>{t('no_messages_yet')}</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('write_message')}
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Send size={18} />
                  {t('send')}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>{t('select_conversation')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages
