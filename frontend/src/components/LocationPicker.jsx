import { useEffect, useRef, useState } from 'react'
import { MapPin, Crosshair, Check, X, Loader } from 'lucide-react'

const LocationPicker = ({ onConfirm, onClose, lang }) => {
  const mapDivRef     = useRef(null)   // DOM element for Leaflet to mount into
  const mapInstanceRef = useRef(null)  // Leaflet map instance
  const leafletRef    = useRef(null)   // Leaflet module
  const markerRef     = useRef(null)
  const [coords, setCoords]     = useState(null)
  const [address, setAddress]   = useState('')
  const [locating, setLocating] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const ar = lang === 'ar'

  useEffect(() => {
    let destroyed = false

    // Inject Leaflet CSS once
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((mod) => {
      if (destroyed || !mapDivRef.current) return

      const L = mod.default || mod
      leafletRef.current = L

      // Fix default icon path issue in bundlers
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Guard: clear any stale map already bound to this DOM node (HMR / StrictMode)
      if (mapDivRef.current._leaflet_id) {
        try {
          if (mapInstanceRef.current) mapInstanceRef.current.remove()
        } catch (_) {}
        delete mapDivRef.current._leaflet_id
      }

      const map = L.map(mapDivRef.current, { zoomControl: true }).setView([35.19, -0.63], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      map.on('click', (e) => {
        placeMarker(L, map, e.latlng.lat, e.latlng.lng)
      })
    })

    return () => {
      destroyed = true
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      } catch (_) {}
    }
  }, [])

  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${lang === 'ar' ? 'ar' : 'en'}`
      )
      const data = await res.json()
      setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setGeocoding(false)
    }
  }

  const placeMarker = (L, map, lat, lng) => {
    if (markerRef.current) markerRef.current.remove()
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', (e) => {
      const p = e.target.getLatLng()
      setCoords({ lat: p.lat, lng: p.lng })
      reverseGeocode(p.lat, p.lng)
    })
    markerRef.current = marker
    setCoords({ lat, lng })
    reverseGeocode(lat, lng)
  }

  const locateSelf = () => {
    if (!navigator.geolocation) {
      alert(ar ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const L   = leafletRef.current
        const map = mapInstanceRef.current
        if (L && map) {
          map.setView([lat, lng], 16, { animate: true })
          placeMarker(L, map, lat, lng)
        }
        setLocating(false)
      },
      () => {
        alert(ar ? 'فشل الحصول على الموقع. يرجى السماح للمتصفح.' : 'Failed to get location. Please allow browser access.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const confirm = () => {
    if (!coords) {
      alert(ar ? 'الرجاء تحديد موقع على الخريطة أولاً' : 'Please select a location on the map first')
      return
    }
    onConfirm({ lat: coords.lat, lng: coords.lng, address })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        dir={ar ? 'rtl' : 'ltr'}
        style={{ background: '#0c2d18', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 20, width: '100%', maxWidth: 680, overflow: 'hidden', fontFamily: 'Cairo, sans-serif', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'scaleIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="#4ade80" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{ar ? 'تحديد الموقع على الخريطة' : 'Pick Location on Map'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Locate button */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button
            onClick={locateSelf}
            disabled={locating}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#14532d', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '9px 18px', color: '#4ade80', fontWeight: 700, fontSize: 13, cursor: locating ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif', opacity: locating ? 0.7 : 1, transition: 'opacity 0.2s' }}
          >
            {locating ? <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Crosshair size={15} />}
            {ar ? 'تحديد موقعي الحالي' : 'Determine Current Location'}
          </button>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 6 }}>
            {ar ? 'أو انقر مباشرةً على الخريطة لتحديد الموقع' : 'Or click directly on the map to pick a location'}
          </p>
        </div>

        {/* Map */}
        <div ref={mapDivRef} style={{ flex: 1, minHeight: 340, position: 'relative' }} />

        {/* Address preview + actions */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ background: '#14532d', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <MapPin size={14} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              {geocoding ? (
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{ar ? 'جارٍ تحديد العنوان...' : 'Fetching address...'}</span>
              ) : address ? (
                <span style={{ color: '#fff', fontSize: 13, lineHeight: 1.5 }}>{address}</span>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{ar ? 'لم يتم تحديد موقع بعد' : 'No location selected yet'}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: 13, transition: 'background 0.2s' }}>
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={confirm}
              disabled={!coords || geocoding}
              style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: coords ? '#4ade80' : 'rgba(74,222,128,0.3)', color: coords ? '#0c2d18' : 'rgba(255,255,255,0.3)', fontWeight: 800, cursor: coords ? 'pointer' : 'not-allowed', fontFamily: 'Cairo, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s, color 0.2s' }}
            >
              <Check size={15} />
              {ar ? 'تأكيد الموقع' : 'Confirm Location'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

export default LocationPicker
