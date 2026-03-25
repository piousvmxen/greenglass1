import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { MapPin, Package, AlertCircle } from 'lucide-react'
import LocationPicker from '../components/LocationPicker'

const CreateRequest = () => {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const ar = lang === 'ar'

  const [formData, setFormData] = useState({
    entityName: '',
    entityType: 'individual',
    address: '',
    glassQuantity: '',
    glassType: 'mixed',
    description: ''
  })
  const [location, setLocation] = useState({ lat: null, lng: null })
  const [loading,  setLoading]  = useState(false)
  const [showMap,  setShowMap]  = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLocationConfirm = ({ lat, lng, address }) => {
    setLocation({ lat, lng })
    setFormData(prev => ({ ...prev, address }))
    setShowMap(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!location.lat || !location.lng) {
      toast.error(ar ? 'يرجى تحديد الموقع على الخريطة أولاً' : 'Please pick your location on the map first')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/requests', {
        ...formData,
        glassQuantity: parseFloat(formData.glassQuantity),
        location
      })
      toast.success(ar ? 'تم إنشاء الطلب بنجاح' : 'Request created successfully')
      navigate('/requests')
    } catch (error) {
      toast.error(error.response?.data?.message || (ar ? 'فشل إنشاء الطلب' : 'Failed to create request'))
    } finally {
      setLoading(false)
    }
  }

  if (user?.role === 'collector') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen dark:bg-gray-900">
        <div className="card text-center py-12 dark:bg-gray-800 dark:border-gray-700">
          <AlertCircle size={64} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">غير مسموح لك بإنشاء طلبات</h2>
          <p className="text-gray-600 mb-6 dark:text-gray-400">
            كجامع، يمكنك فقط قبول طلبات الجمع الموجودة. لا يمكنك إنشاء طلبات جديدة.
          </p>
          <button onClick={() => navigate('/requests')} className="btn-primary">
            عرض الطلبات المتاحة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen dark:bg-gray-900">
      {showMap && (
        <LocationPicker
          lang={lang}
          onConfirm={handleLocationConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">{t('create_title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('create_subtitle')}</p>
      </div>

      <form className="card space-y-6 dark:bg-gray-800 dark:border-gray-700" onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('create_entity_name')} *
            </label>
            <input
              name="entityName"
              type="text"
              required
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder="مثال: مقهى الأندلس"
              value={formData.entityName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('create_entity_type')} *
            </label>
            <select
              name="entityType"
              required
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={formData.entityType}
              onChange={handleChange}
            >
              <option value="individual">{ar ? 'فرد' : 'Individual'}</option>
              <option value="cafe">{ar ? 'مقهى' : 'Cafe'}</option>
              <option value="restaurant">{ar ? 'مطعم' : 'Restaurant'}</option>
              <option value="hotel">{ar ? 'فندق' : 'Hotel'}</option>
              <option value="factory">{ar ? 'مصنع' : 'Factory'}</option>
              <option value="workshop">{ar ? 'ورشة' : 'Workshop'}</option>
              <option value="other">{ar ? 'أخرى' : 'Other'}</option>
            </select>
          </div>
        </div>

        {/* Address — filled via map picker only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            {t('create_address')} *
          </label>
          <div className="flex gap-2">
            <input
              name="address"
              type="text"
              readOnly
              required
              placeholder={ar ? 'انقر على زر الخريطة لتحديد موقعك' : 'Click the Map button to pick your location'}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 flex-1 cursor-default"
              style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
              value={formData.address}
            />
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors whitespace-nowrap"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              <MapPin size={15} />
              {ar ? 'الخريطة' : 'Map'}
            </button>
          </div>
          {location.lat && location.lng && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
              ✓ {ar ? 'تم تحديد الموقع بنجاح' : 'Location confirmed'} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('create_quantity')} *
            </label>
            <input
              name="glassQuantity"
              type="number"
              required
              min="0"
              step="0.1"
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder="0.0"
              value={formData.glassQuantity}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('create_glass_type')} *
            </label>
            <select
              name="glassType"
              required
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={formData.glassType}
              onChange={handleChange}
            >
              <option value="bottles">{ar ? 'زجاجات' : 'Bottles'}</option>
              <option value="windows">{ar ? 'نوافذ' : 'Windows'}</option>
              <option value="broken">{ar ? 'زجاج مكسور' : 'Broken glass'}</option>
              <option value="mixed">{ar ? 'مختلط' : 'Mixed'}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            {t('create_description')}
          </label>
          <textarea
            name="description"
            rows="4"
            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            placeholder={ar ? 'أي معلومات إضافية عن الزجاج...' : 'Any additional info about the glass...'}
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !location.lat || !location.lng}
          className="w-full btn-primary flex items-center justify-center gap-2"
          title={!location.lat ? (ar ? 'يرجى تحديد الموقع أولاً' : 'Please pick a location first') : ''}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Package size={20} />
              {t('create_submit')}
            </>
          )}
        </button>

        {!location.lat && !location.lng && (
          <p className="text-center text-xs text-amber-500 dark:text-amber-400 -mt-2">
            ⚠ {ar ? 'يجب تحديد الموقع على الخريطة قبل الإرسال' : 'Location must be set via the map before submitting'}
          </p>
        )}
      </form>
    </div>
  )
}

export default CreateRequest
