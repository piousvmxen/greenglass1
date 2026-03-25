import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Crosshair, RefreshCw, Layers, MapPin, Package, CheckCircle, Clock, Loader, Check, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── palette ──────────────────────────────────────────────── */
const BG    = '#0c2d18'
const CARD  = '#14532d'
const GREEN = '#4ade80'

const STATUS_COLOR = {
  pending:      '#fbbf24',
  accepted:     '#60a5fa',
  'in-progress': '#a78bfa',
  completed:    '#4ade80',
  cancelled:    '#f87171',
}
const STATUS_LABEL_AR = {
  pending: 'في الانتظار', accepted: 'مقبول',
  'in-progress': 'جارٍ',  completed: 'مكتمل', cancelled: 'ملغى',
}
const GLASS_TYPE_AR = { bottles: 'زجاجات', windows: 'نوافذ', broken: 'مكسور', mixed: 'مختلط' }

/* ─── SVG marker for Leaflet ────────────────────────────────── */
const markerSVG = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22s14-12.67 14-22C28 6.27 21.73 0 14 0z"
      fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="14" cy="14" r="5" fill="#fff"/>
  </svg>`

const makeIcon = (L, color) =>
  L.divIcon({
    html: markerSVG(color),
    className: '',
    iconSize:   [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  })

/* ─── Component ─────────────────────────────────────────────── */
const MapView = () => {
  const { user }  = useAuth()
  const { lang }  = useLanguage()
  const ar = lang === 'ar'

  const mapDiv  = useRef(null)
  const mapRef  = useRef(null)
  const leaflet = useRef(null)

  const [requests,  setRequests]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [locating,  setLocating]  = useState(false)
  const [filter,    setFilter]    = useState('all')
  const [accepting, setAccepting] = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const markersRef = useRef([])
  const myMarker   = useRef(null)

  /* ── bootstrap Leaflet ── */
  useEffect(() => {
    if (!mapDiv.current) return

    // Destroy any stale map already bound to this DOM node (HMR safety)
    if (mapDiv.current._leaflet_id) {
      try { mapRef.current && mapRef.current.remove() } catch (_) {}
      mapDiv.current._leaflet_id = undefined
    }

    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    if (!document.querySelector('link[href*="leaflet"]')) document.head.appendChild(link)

    let destroyed = false

    import('leaflet').then((mod) => {
      if (destroyed || !mapDiv.current) return
      const L = mod.default || mod
      leaflet.current = L

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Guard against already-initialized container
      if (mapDiv.current._leaflet_id) return

      const map = L.map(mapDiv.current, { zoomControl: false }).setView([35.1992, -0.6303], 13)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      fetchRequests(L, map)
    })

    return () => {
      destroyed = true
      try { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } } catch (_) {}
    }
  }, [])

  /* ── fetch & draw markers ── */
  const fetchRequests = async (L, map) => {
    setLoading(true)
    try {
      const res = await axios.get('/api/requests')
      const geo = res.data.filter(r => r.location?.lat && r.location?.lng)
      setRequests(geo)
      drawMarkers(L || leaflet.current, map || mapRef.current, geo, filter)
    } catch {
      toast.error(ar ? 'فشل تحميل الطلبات' : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const drawMarkers = (L, map, data, activeFilter) => {
    if (!L || !map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const visible = activeFilter === 'all' ? data : data.filter(r => r.status === activeFilter)

    visible.forEach(req => {
      const color  = STATUS_COLOR[req.status] || '#6b7280'
      const icon   = makeIcon(L, color)
      const marker = L.marker([req.location.lat, req.location.lng], { icon })
        .addTo(map)
        .on('click', () => setSelected(req))
      markersRef.current.push(marker)
    })
  }

  /* redraw when filter changes */
  useEffect(() => {
    if (leaflet.current && mapRef.current && requests.length > 0) {
      drawMarkers(leaflet.current, mapRef.current, requests, filter)
      setSelected(null)
    }
  }, [filter, requests])

  /* ── my location ── */
  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(ar ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation not supported')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const L   = leaflet.current
        const map = mapRef.current
        if (!L || !map) return

        map.setView([lat, lng], 16, { animate: true })

        if (myMarker.current) myMarker.current.remove()
        const pulseIcon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#4ade80;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(74,222,128,0.25)"></div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        })
        myMarker.current = L.marker([lat, lng], { icon: pulseIcon })
          .addTo(map)
          .bindPopup(ar ? '📍 موقعك الحالي' : '📍 Your Location')
          .openPopup()
        setLocating(false)
      },
      () => {
        toast.error(ar ? 'فشل الحصول على الموقع' : 'Failed to get location')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  /* ── accept request (collectors only) ── */
  const acceptRequest = async (id) => {
    setAccepting(id)
    try {
      await axios.put(`/api/requests/${id}/accept`, {})
      toast.success(ar ? 'تم قبول الطلب!' : 'Request accepted!')
      setSelected(null)
      fetchRequests(leaflet.current, mapRef.current)
    } catch {
      toast.error(ar ? 'فشل قبول الطلب' : 'Failed to accept')
    } finally {
      setAccepting(null)
    }
  }

  const FILTERS = [
    { key: 'all',          label: ar ? 'الكل' : 'All' },
    { key: 'pending',      label: ar ? 'في الانتظار' : 'Pending' },
    { key: 'accepted',     label: ar ? 'مقبول' : 'Accepted' },
    { key: 'in-progress',  label: ar ? 'جارٍ' : 'In Progress' },
    { key: 'completed',    label: ar ? 'مكتمل' : 'Completed' },
  ]

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ fontFamily: 'Cairo, sans-serif', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', background: BG, overflow: 'hidden' }}>

      {/* ── top toolbar ── */}
      <div style={{ background: CARD, borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <MapPin size={18} color={GREEN} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{ar ? 'خريطة نقاط التجميع' : 'Collection Points Map'}</span>
          {loading && <Loader size={14} color={GREEN} style={{ animation: 'spin 0.8s linear infinite' }} />}
          {!loading && <span style={{ background: 'rgba(74,222,128,0.15)', color: GREEN, fontSize: 11, borderRadius: 6, padding: '2px 8px' }}>{visible.length} {ar ? 'نقطة' : 'points'}</span>}
        </div>

        {/* Filter dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setFilterOpen(!filterOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'Cairo, sans-serif' }}>
            <Layers size={13} />
            {FILTERS.find(f => f.key === filter)?.label}
            <ChevronDown size={12} style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
          {filterOpen && (
            <div style={{ position: 'absolute', top: '110%', [ar ? 'right' : 'left']: 0, background: '#1a5c32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', zIndex: 1000, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => { setFilter(f.key); setFilterOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: filter === f.key ? 'rgba(74,222,128,0.15)' : 'transparent', color: filter === f.key ? GREEN : 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'Cairo, sans-serif', textAlign: ar ? 'right' : 'left' }}>
                  {f.key !== 'all' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[f.key], flexShrink: 0 }} />}
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => fetchRequests(leaflet.current, mapRef.current)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'Cairo, sans-serif' }}>
          <RefreshCw size={13} /> {ar ? 'تحديث' : 'Refresh'}
        </button>

        <button onClick={goToMyLocation} disabled={locating}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, border: 'none', borderRadius: 10, padding: '7px 16px', color: BG, fontWeight: 700, cursor: locating ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'Cairo, sans-serif', opacity: locating ? 0.7 : 1 }}>
          {locating ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Crosshair size={13} />}
          {ar ? 'موقعي' : 'My Location'}
        </button>
      </div>

      {/* ── map + sidebar ── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* Map canvas */}
        <div ref={mapDiv} style={{ flex: 1, height: '100%' }} />

        {/* Legend (bottom-left overlay) */}
        <div style={{ position: 'absolute', bottom: 24, [ar ? 'right' : 'left']: 16, background: 'rgba(12,45,24,0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', zIndex: 500 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{ar ? 'دليل الألوان' : 'Legend'}</div>
          {Object.entries(STATUS_COLOR).filter(([k]) => k !== 'cancelled').map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{STATUS_LABEL_AR[status]}</span>
            </div>
          ))}
        </div>

        {/* Request detail sidebar */}
        {selected && (
          <div style={{ position: 'absolute', top: 16, [ar ? 'left' : 'right']: 16, width: 300, background: 'rgba(12,45,24,0.96)', backdropFilter: 'blur(10px)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 16, padding: '18px 18px 16px', zIndex: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {/* Close */}
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 12, [ar ? 'left' : 'right']: 12, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, width: 26, height: 26, color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: '26px', textAlign: 'center' }}>
              ×
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLOR[selected.status], flexShrink: 0 }} />
              <span style={{ color: STATUS_COLOR[selected.status], fontSize: 11, fontWeight: 600 }}>{STATUS_LABEL_AR[selected.status]}</span>
            </div>

            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{selected.entityName}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <MapPin size={13} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}>{selected.address}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Package size={13} color={GREEN} style={{ flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{selected.glassQuantity} كغ — {GLASS_TYPE_AR[selected.glassType] || selected.glassType}</span>
              </div>
              {selected.userId?.phone && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: GREEN, fontSize: 12 }}>📞 {selected.userId.phone}</span>
                </div>
              )}
              {selected.scheduledDate && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Clock size={13} color={GREEN} style={{ flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{new Date(selected.scheduledDate).toLocaleDateString('ar-DZ')}</span>
                </div>
              )}
              {selected.description && (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{selected.description}</p>
              )}
            </div>

            {/* Points badge */}
            <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, padding: '6px 10px', marginBottom: 12, textAlign: 'center' }}>
              <span style={{ color: GREEN, fontSize: 12, fontWeight: 700 }}>+{Math.floor(selected.glassQuantity)} {ar ? 'نقطة عند الاستلام' : 'pts on completion'}</span>
            </div>

            {/* Collector: accept pending */}
            {user?.role === 'collector' && selected.status === 'pending' && (
              <button onClick={() => acceptRequest(selected._id)} disabled={accepting === selected._id}
                style={{ width: '100%', background: GREEN, border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: accepting === selected._id ? 0.7 : 1 }}>
                {accepting === selected._id ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={14} />}
                {ar ? 'قبول هذا الطلب' : 'Accept Request'}
              </button>
            )}

            {/* Map directions link */}
            <a href={`https://www.openstreetmap.org/directions?from=&to=${selected.location.lat},${selected.location.lng}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 8, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = GREEN}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>
              {ar ? '🗺️ عرض الاتجاهات في OpenStreetMap' : '🗺️ Get directions in OpenStreetMap'}
            </a>
          </div>
        )}

        {/* Empty state overlay */}
        {!loading && visible.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(12,45,24,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px 32px', textAlign: 'center', zIndex: 500 }}>
            <Package size={32} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 10px' }} />
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{ar ? 'لا توجد طلبات على الخريطة' : 'No requests on the map'}</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .leaflet-container { font-family: Cairo, sans-serif; background: #0c2d18; }
        .leaflet-popup-content-wrapper { background: #14532d; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .leaflet-popup-tip { background: #14532d; }
        .leaflet-popup-close-button { color: rgba(255,255,255,0.6) !important; }
        .leaflet-control-zoom a { background: #14532d !important; color: #4ade80 !important; border-color: rgba(255,255,255,0.1) !important; }
        .leaflet-control-attribution { background: rgba(12,45,24,0.8) !important; color: rgba(255,255,255,0.3) !important; font-size: 9px; }
        .leaflet-control-attribution a { color: rgba(74,222,128,0.6) !important; }
      `}</style>
    </div>
  )
}

export default MapView
