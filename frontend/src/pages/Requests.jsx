import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { Plus, MapPin, Package, CheckCircle, XCircle } from 'lucide-react'

const Requests = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await axios.get('/api/requests', { params })
      setRequests(res.data)
    } catch (error) {
      toast.error(t('error_fetch_requests'))
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId) => {
    try {
      await axios.put(`/api/requests/${requestId}/accept`)
      toast.success(t('success_accept'))
      fetchRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || t('error_accept'))
    }
  }

  const handleComplete = async (requestId) => {
    try {
      await axios.put(`/api/requests/${requestId}/complete`)
      toast.success(t('success_complete'))
      fetchRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || t('error_complete'))
    }
  }

  const handleCancel = async (requestId) => {
    if (!window.confirm(t('confirm_cancel'))) return
    try {
      await axios.put(`/api/requests/${requestId}/cancel`)
      toast.success(t('success_cancel'))
      fetchRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || t('error_cancel'))
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: t('status_pending'),
      accepted: t('status_accepted'),
      'in-progress': t('status_in_progress'),
      completed: t('status_completed'),
      cancelled: t('status_cancelled')
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('nav_requests')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('requests_manage')}</p>
        </div>
        {user?.role === 'user' && (
          <Link to="/create-request" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            {t('new_request')}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'accepted', 'in-progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {status === 'all' ? t('filter_all') : getStatusText(status)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{request.entityName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin size={16} />
                    <span>{request.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <Package size={16} />
                    <span>{request.glassQuantity} {t('kg')} • {request.glassType}</span>
                  </div>
                  {request.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{request.description}</p>
                  )}
                  {request.userId && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {t('from')}: {request.userId.name} ({request.userId.entityType})
                    </p>
                  )}
                  {request.collectorId && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {t('collector')}: {request.collectorId.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                {user?.role === 'collector' && request.status === 'pending' && (
                  <button
                    onClick={() => handleAccept(request._id)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    {t('status_accepted')}
                  </button>
                )}
                {(user?.role === 'collector' || user?.role === 'admin') &&
                  (request.status === 'accepted' || request.status === 'in-progress') && (
                    <button
                      onClick={() => handleComplete(request._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      {t('status_completed')}
                    </button>
                  )}
                {user?.role === 'user' && 
                  request.userId?._id?.toString() === user._id?.toString() && 
                  request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle size={18} />
                      {t('status_cancelled')}
                    </button>
                  )}
                <Link
                  to={`/map?lat=${request.location.lat}&lng=${request.location.lng}`}
                  className="btn-secondary dark:bg-[#1e2a45] dark:text-gray-100 dark:hover:bg-[#2a3b5e] flex items-center gap-2"
                >
                  <MapPin size={18} />
                  {t('view_on_map')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('no_requests')}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter !== 'all' ? t('no_requests_status') : t('no_requests_yet')}
          </p>
          {user?.role === 'user' && (
            <Link to="/create-request" className="btn-primary inline-flex items-center gap-2">
              <Plus size={20} />
              {t('new_request')}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default Requests
