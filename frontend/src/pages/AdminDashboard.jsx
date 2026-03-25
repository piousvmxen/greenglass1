import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Users, Package, TrendingUp, Award, Shield, MessageSquare, Trash2, Edit2 } from 'lucide-react'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users') // 'users', 'requests', 'messages'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, requestsRes, messagesRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/requests'),
        axios.get('/api/admin/messages')
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setRequests(requestsRes.data)
      setMessages(messagesRes.data)
    } catch (error) {
      toast.error('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole })
      toast.success('تم تحديث الدور بنجاح')
      fetchData()
    } catch (error) {
      toast.error('فشل تحديث الدور')
    }
  }

  const togglePremium = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/premium`)
      toast.success('تم تحديث حالة الاشتراك')
      fetchData()
    } catch (error) {
      toast.error('فشل التحديث')
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    try {
      await axios.delete(`/api/admin/users/${userId}`)
      toast.success('تم حذف المستخدم بنجاح')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل حذف المستخدم')
    }
  }

  const deleteRequest = async (requestId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return
    try {
      await axios.delete(`/api/admin/requests/${requestId}`)
      toast.success('تم حذف الطلب بنجاح')
      fetchData()
    } catch (error) {
      toast.error('فشل حذف الطلب')
    }
  }

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`/api/admin/requests/${requestId}`, { status: newStatus })
      toast.success('تم تحديث حالة الطلب بنجاح')
      fetchData()
    } catch (error) {
      toast.error('فشل تحديث الطلب')
    }
  }

  const deleteMessage = async (messageId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return
    try {
      await axios.delete(`/api/admin/messages/${messageId}`)
      toast.success('تم حذف الرسالة بنجاح')
      fetchData()
    } catch (error) {
      toast.error('فشل حذف الرسالة')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="text-primary-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
          <p className="text-gray-600">إدارة النظام والمستخدمين</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            <Users size={40} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">الزجاج المجمع (كغ)</p>
              <p className="text-3xl font-bold">{stats?.totalGlassCollected?.toFixed(1) || 0}</p>
            </div>
            <Package size={40} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">إجمالي الطلبات</p>
              <p className="text-3xl font-bold">{stats?.totalRequests || 0}</p>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">CO₂ المتجنب (كغ)</p>
              <p className="text-3xl font-bold">{stats?.co2Saved?.toFixed(1) || 0}</p>
            </div>
            <Award size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'users'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          <Users size={20} className="inline ml-2" />
          المستخدمون
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'requests'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          <Package size={20} className="inline ml-2" />
          الطلبات
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'messages'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          <MessageSquare size={20} className="inline ml-2" />
          الرسائل
        </button>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">المستخدمون</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">الاسم</th>
                <th className="text-right py-3 px-4">البريد</th>
                <th className="text-right py-3 px-4">الدور</th>
                <th className="text-right py-3 px-4">النقاط</th>
                <th className="text-right py-3 px-4">مميز</th>
                <th className="text-right py-3 px-4">تاريخ التسجيل</th>
                <th className="text-right py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="user">مستخدم</option>
                      <option value="collector">جامع</option>
                      <option value="admin">مدير</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">{user.points}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => togglePremium(user._id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        user.isPremium
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.isPremium ? 'نعم' : 'لا'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="حذف المستخدم"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Requests Table */}
      {activeTab === 'requests' && (
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">الطلبات</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">الكيان</th>
                <th className="text-right py-3 px-4">صاحب الطلب</th>
                <th className="text-right py-3 px-4">الجامع</th>
                <th className="text-right py-3 px-4">الكمية (كغ)</th>
                <th className="text-right py-3 px-4">الحالة</th>
                <th className="text-right py-3 px-4">التاريخ</th>
                <th className="text-right py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{request.entityName}</td>
                  <td className="py-3 px-4">
                    {request.userId?.name || 'غير معروف'}
                  </td>
                  <td className="py-3 px-4">
                    {request.collectorId?.name || '-'}
                  </td>
                  <td className="py-3 px-4">{request.glassQuantity}</td>
                  <td className="py-3 px-4">
                    <select
                      value={request.status}
                      onChange={(e) => updateRequestStatus(request._id, e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="accepted">مقبول</option>
                      <option value="in-progress">قيد التنفيذ</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteRequest(request._id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="حذف الطلب"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Messages Table */}
      {activeTab === 'messages' && (
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">الرسائل</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">المرسل</th>
                <th className="text-right py-3 px-4">المستقبل</th>
                <th className="text-right py-3 px-4">المحتوى</th>
                <th className="text-right py-3 px-4">التاريخ</th>
                <th className="text-right py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{message.senderId?.name || 'غير معروف'}</td>
                  <td className="py-3 px-4">{message.receiverId?.name || 'غير معروف'}</td>
                  <td className="py-3 px-4 max-w-xs truncate">{message.content}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(message.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => deleteMessage(message._id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="حذف الرسالة"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  )
}

export default AdminDashboard
