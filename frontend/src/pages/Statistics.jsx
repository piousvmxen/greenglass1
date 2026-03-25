import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import { 
  Package, 
  Leaf, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock,
  Award,
  Recycle
} from 'lucide-react'

const Statistics = () => {
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const res = await axios.get('/api/users/environmental-stats')
      setStats(res.data)
    } catch (error) {
      toast.error(t('error_fetch_stats'))
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Calculate additional metrics
  const completionRate = stats?.totalRequests > 0 
    ? ((stats.completedRequests / stats.totalRequests) * 100).toFixed(1)
    : 0
  
  const avgGlassPerRequest = stats?.completedRequests > 0
    ? (stats.totalGlassCollected / stats.completedRequests).toFixed(1)
    : 0

  // CO2 equivalent calculations (1 kg glass recycled ≈ 0.3 kg CO2 saved)
  const equivalentTrees = stats?.co2Saved > 0
    ? Math.round(stats.co2Saved / 20) // 1 tree ≈ 20 kg CO2/year
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Recycle className="text-primary-600 dark:text-primary-400" size={40} />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('environmental_stats')}</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('stats_desc')}
        </p>
        {stats?.lastUpdated && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {t('last_updated')}: {new Date(stats.lastUpdated).toLocaleDateString(t('locale'), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>

      {/* Main Environmental Impact Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Glass Collected */}
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white transform hover:scale-105 transition-transform border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-2">{t('glass_recycled')}</p>
              <p className="text-4xl font-bold mb-1">
                {stats?.totalGlassCollected?.toFixed(1) || 0}
              </p>
              <p className="text-green-100 text-sm">{t('kg')}</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <Package size={48} className="opacity-90" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-green-100 text-xs">
              {t('avg_per_request')}: {avgGlassPerRequest} {t('kg')}
            </p>
          </div>
        </div>

        {/* CO2 Saved */}
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-transform border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">{t('co2_saved_title')}</p>
              <p className="text-4xl font-bold mb-1">
                {stats?.co2Saved?.toFixed(1) || 0}
              </p>
              <p className="text-blue-100 text-sm">{t('kg')}</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <Leaf size={48} className="opacity-90" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-blue-100 text-xs">
              {t('equivalent_trees_prefix')} {equivalentTrees} {t('equivalent_trees_suffix')}
            </p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-transform border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-2">{t('completion_rate')}</p>
              <p className="text-4xl font-bold mb-1">
                {completionRate}%
              </p>
              <p className="text-purple-100 text-sm">
                {stats?.completedRequests || 0} {t('from')} {stats?.totalRequests || 0} {t('requests_label')}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <TrendingUp size={48} className="opacity-90" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Requests */}
        <div className="card border-l-4 border-blue-500 dark:bg-[#111827] dark:border-l-blue-600">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dash_requests')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalRequests || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Requests */}
        <div className="card border-l-4 border-green-500 dark:bg-[#111827] dark:border-l-green-600">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dash_completed')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.completedRequests || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Active Collectors */}
        <div className="card border-l-4 border-orange-500 dark:bg-[#111827] dark:border-l-orange-600">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3">
              <Users className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('active_collectors')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activeCollectors || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="card border-l-4 border-purple-500 dark:bg-[#111827] dark:border-l-purple-600">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
              <Award className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('active_users')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activeUsers || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact Information */}
      <div className="card bg-gradient-to-r from-primary-50 to-green-50 dark:from-primary-900/20 dark:to-green-900/20 border-2 border-primary-200 dark:border-primary-900">
        <div className="flex items-start gap-4">
          <div className="bg-primary-100 dark:bg-primary-900/50 rounded-full p-3 flex-shrink-0">
            <Leaf className="text-primary-600 dark:text-primary-400" size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('our_environmental_impact')}
            </h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                <span>
                  {t('impact_glass_recycled', { quantity: stats?.totalGlassCollected?.toFixed(0) || 0 })}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                <span>
                  {t('impact_co2_saved', { quantity: stats?.co2Saved?.toFixed(0) || 0 })}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                <span>
                  {t('impact_energy_saved')}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                <span>
                  {t('impact_waste_reduced')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('join_us_journey')}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/create-request"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Package size={20} />
            {t('new_request')}
          </Link>
          <Link
            to="/map"
            className="btn-secondary dark:bg-[#1e2a45] dark:text-gray-100 dark:hover:bg-[#2a3b5e] inline-flex items-center gap-2"
          >
            <TrendingUp size={20} />
            {t('nav_map')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Statistics
