import { useState, useCallback, useEffect, useMemo } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps'
import { createClient } from '@supabase/supabase-js'
import type { Resource, ResourceType } from '@/types'
import ResourceCard from './ResourceCard'
import FilterBar from './FilterBar'
import type { Lang } from './FilterBar'
import { MARKER_COLORS, MARKER_COLOR_BY_SLUG } from '@/lib/constants'

const US_CENTER = { lat: 39.5, lng: -98.35 }
const GOOGLE_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY
const SAVED_KEY = 'swf-saved-resources'

// Full state name → 2-letter abbreviation
const STATE_ABBREVS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC', 'Puerto Rico': 'PR',
}

function getTypeColor(types: ResourceType[], slug: string | undefined): string {
  if (!slug) return MARKER_COLORS[0]
  if (MARKER_COLOR_BY_SLUG[slug]) return MARKER_COLOR_BY_SLUG[slug]
  const idx = types.findIndex(t => t.slug === slug)
  return MARKER_COLORS[(idx >= 0 ? idx : 0) % MARKER_COLORS.length]
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)

function MapInner() {
  const map = useMap()
  const [resources, setResources] = useState<Resource[]>([])
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([])
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>(MARKER_COLORS[0])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(SAVED_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [lang, setLang] = useState<Lang>('en')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [welcomeQuery, setWelcomeQuery] = useState('')
  const [welcomeError, setWelcomeError] = useState<string | null>(null)
  const [welcomeLocating, setWelcomeLocating] = useState(false)

  // National vs state drill-down
  const [view, setView] = useState<'national' | 'state'>('national')
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const [{ data: types }, { data: recs }] = await Promise.all([
        supabase.from('resource_types').select('*').order('name'),
        supabase
          .from('resources')
          .select('*, resource_type:resource_types(*)')
          .eq('is_active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null),
      ])
      if (types) setResourceTypes(types)
      if (recs) setResources(recs as Resource[])
    }
    fetchData()
  }, [])

  // Set of state abbreviations that have resources
  const statesWithResources = useMemo(
    () => new Set(resources.map(r => r.state).filter(Boolean) as string[]),
    [resources]
  )

  // Load GeoJSON + set up click/hover listeners once (when map is ready and in national view)
  useEffect(() => {
    if (!map || view !== 'national') return

    map.data.loadGeoJson(
      'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
    )

    const clickListener = map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
      const stateName = e.feature.getProperty('name') as string
      const abbrev = STATE_ABBREVS[stateName]
      if (!abbrev) return

      const bounds = new google.maps.LatLngBounds()
      const geometry = e.feature.getGeometry()
      if (geometry) {
        geometry.forEachLatLng((latlng: google.maps.LatLng) => bounds.extend(latlng))
        map.fitBounds(bounds, 40)
      }

      setSelectedState(abbrev)
      setSelectedStateName(stateName)
      setTimeout(() => setView('state'), 600)
    })

    const hoverListener = map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
      const stateName = e.feature.getProperty('name') as string
      const abbrev = STATE_ABBREVS[stateName]
      if (abbrev && statesWithResources.has(abbrev)) {
        map.data.overrideStyle(e.feature, {
          fillOpacity: 0.9,
          strokeWeight: 2.5,
          strokeColor: '#006b7a',
        })
      }
    })

    const mouseoutListener = map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
      map.data.revertStyle(e.feature)
    })

    return () => {
      google.maps.event.removeListener(clickListener)
      google.maps.event.removeListener(hoverListener)
      google.maps.event.removeListener(mouseoutListener)
      map.data.forEach(feature => map.data.remove(feature))
    }
  }, [map, view])

  // Update state polygon styles whenever resources load or view changes
  useEffect(() => {
    if (!map || view !== 'national') return

    map.data.setStyle((feature) => {
      const stateName = feature.getProperty('name') as string
      const abbrev = STATE_ABBREVS[stateName]
      const hasResources = abbrev ? statesWithResources.has(abbrev) : false
      return {
        fillColor: hasResources ? '#00909d' : '#c8d8dc',
        fillOpacity: hasResources ? 0.7 : 0.5,
        strokeColor: hasResources ? '#006b7a' : '#9ca3af',
        strokeWeight: 1.5,
      }
    })
  }, [map, view, statesWithResources])

  // Markers only shown in state view, filtered by state + active filters
  const filtered = useMemo(() => {
    if (view === 'national') return []
    return resources.filter(r => {
      if (r.state !== selectedState) return false
      if (showSavedOnly && !savedIds.has(r.id)) return false
      if (selectedType && r.resource_type?.slug !== selectedType) return false
      return true
    })
  }, [view, resources, selectedState, showSavedOnly, savedIds, selectedType])

  // Nearest resources sorted by distance from user
  const nearestResources = useMemo(() => {
    if (!userLocation || view === 'national') return []
    return [...filtered]
      .filter(r => r.latitude && r.longitude)
      .map(r => ({ ...r, distance: haversineDistance(userLocation.lat, userLocation.lng, r.latitude, r.longitude) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
  }, [filtered, userLocation, view])

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(SAVED_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    setLocationError(null)
    try {
      const suffix = selectedStateName ? `, ${selectedStateName}` : ''
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + suffix)}&key=${GOOGLE_KEY}`
      )
      const data = await res.json()
      if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location
        const resultTypes: string[] = data.results[0].types ?? []
        let zoom = 11
        if (resultTypes.includes('postal_code')) zoom = 13
        else if (resultTypes.includes('locality') || resultTypes.includes('sublocality')) zoom = 12
        else if (resultTypes.includes('administrative_area_level_2')) zoom = 9
        map?.panTo({ lat, lng })
        map?.setZoom(zoom)
        setUserLocation({ lat, lng })
      } else {
        setLocationError('Location not found. Try a city or zip code.')
      }
    } catch {
      setLocationError('Search failed. Please try again.')
    }
  }, [map, selectedStateName])

  const handleLocate = useCallback(() => {
    setLocationError(null)
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map?.panTo({ lat: latitude, lng: longitude })
        map?.setZoom(12)
        setUserLocation({ lat: latitude, lng: longitude })
        setLocating(false)
      },
      () => {
        setLocationError('Unable to get your location. Please check your browser permissions.')
        setLocating(false)
      }
    )
  }, [map])

  const handleBack = useCallback(() => {
    setView('national')
    setSelectedState(null)
    setSelectedStateName(null)
    setSelectedResource(null)
    setSelectedType(null)
    setShowSavedOnly(false)
    map?.setCenter(US_CENTER)
    map?.setZoom(4)
  }, [map])

  const clickToExplore = lang === 'en'
    ? 'Click a highlighted state to explore resources'
    : 'Haz clic en un estado resaltado para explorar recursos'

  async function handleWelcomeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!welcomeQuery.trim()) return
    setWelcomeError(null)
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(welcomeQuery.trim())}&key=${GOOGLE_KEY}`
      )
      const data = await res.json()
      if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location
        const resultTypes: string[] = data.results[0].types ?? []
        const stateComp = data.results[0].address_components?.find(
          (c: { types: string[] }) => c.types.includes('administrative_area_level_1')
        )

        // Determine zoom based on result precision
        let zoom = 11
        if (resultTypes.includes('postal_code')) zoom = 13
        else if (resultTypes.includes('locality') || resultTypes.includes('sublocality')) zoom = 12
        else if (resultTypes.includes('administrative_area_level_2')) zoom = 9
        else if (resultTypes.includes('administrative_area_level_1')) zoom = 7

        map?.panTo({ lat, lng })
        map?.setZoom(zoom)
        setUserLocation({ lat, lng })

        if (stateComp) {
          const abbrev = stateComp.short_name as string
          const fullName = stateComp.long_name as string
          setSelectedState(abbrev)
          setSelectedStateName(fullName)
          setTimeout(() => setView('state'), 400)
        }
        setShowWelcome(false)
      } else {
        setWelcomeError(lang === 'en' ? 'Location not found. Try a city, state, or zip code.' : 'Ubicación no encontrada. Intenta con una ciudad, estado o código postal.')
      }
    } catch {
      setWelcomeError(lang === 'en' ? 'Search failed. Please try again.' : 'Búsqueda fallida. Por favor intenta de nuevo.')
    }
  }

  function handleWelcomeLocate() {
    setWelcomeError(null)
    if (!navigator.geolocation) {
      setWelcomeError(lang === 'en' ? 'Geolocation not supported by your browser.' : 'Tu navegador no admite geolocalización.')
      return
    }
    setWelcomeLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        map?.setZoom(11)
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setWelcomeLocating(false)
        setShowWelcome(false)
      },
      () => {
        setWelcomeError(lang === 'en' ? 'Unable to get your location.' : 'No se pudo obtener tu ubicación.')
        setWelcomeLocating(false)
      }
    )
  }

  const C_PRIMARY = '#00909d'
  const C_PRIMARY_DARK = '#006b7a'

  return (
    <div className="flex flex-col md:flex-row h-full relative">

      {/* Welcome overlay */}
      {showWelcome && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 mx-4 w-full max-w-md text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: '#e6f4f5' }}>
              📍
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {lang === 'en' ? 'Find Resources Near You' : 'Encuentra Recursos Cerca de Ti'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {lang === 'en'
                ? 'Enter your city, state, or zip code to find survivor support services in your area.'
                : 'Ingresa tu ciudad, estado o código postal para encontrar servicios de apoyo en tu área.'}
            </p>
            <form onSubmit={handleWelcomeSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={welcomeQuery}
                onChange={e => setWelcomeQuery(e.target.value)}
                placeholder={lang === 'en' ? 'City, state, or zip code...' : 'Ciudad, estado o código postal...'}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500"
                autoFocus
              />
              {welcomeError && (
                <p className="text-xs text-red-500 text-left">{welcomeError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 text-white text-sm font-bold rounded-xl transition-colors"
                style={{ backgroundColor: C_PRIMARY }}
              >
                {lang === 'en' ? 'Find Resources' : 'Buscar Recursos'}
              </button>
              <button
                type="button"
                onClick={handleWelcomeLocate}
                disabled={welcomeLocating}
                className="w-full py-3 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                style={{ backgroundColor: C_PRIMARY_DARK }}
              >
                {welcomeLocating
                  ? (lang === 'en' ? 'Locating...' : 'Localizando...')
                  : (lang === 'en' ? '📍 Use My Location' : '📍 Usar Mi Ubicación')}
              </button>
            </form>
            <button
              onClick={() => setShowWelcome(false)}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {lang === 'en' ? 'Skip and browse the full map' : 'Omitir y ver el mapa completo'}
            </button>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto"
              >
                🌐 {lang === 'en' ? 'Ver en Español' : 'View in English'}
              </button>
            </div>
          </div>
        </div>
      )}
      <FilterBar
        view={view}
        selectedStateName={selectedStateName}
        onBack={handleBack}
        resourceTypes={resourceTypes}
        selectedType={selectedType}
        onSelect={(slug) => { setSelectedType(slug); setShowSavedOnly(false) }}
        onSearch={handleSearch}
        onLocate={handleLocate}
        locating={locating}
        locationError={locationError}
        showSavedOnly={showSavedOnly}
        savedCount={savedIds.size}
        onToggleSavedOnly={() => { setShowSavedOnly(p => !p); setSelectedType(null) }}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'en' ? 'es' : 'en')}
        nearestResources={nearestResources}
        onSelectNearest={(r) => {
          const color = getTypeColor(resourceTypes, r.resource_type?.slug)
          setSelectedResource(r)
          setSelectedColor(color)
          map?.panTo({ lat: r.latitude, lng: r.longitude })
          map?.setZoom(14)
        }}
      />

      <div className="relative flex-1">
        <Map
          defaultCenter={US_CENTER}
          defaultZoom={4}
          mapId="resource-map"
          gestureHandling="greedy"
          className="w-full h-full"
        >
          {filtered.map(resource => {
            const isSaved = savedIds.has(resource.id)
            const color = getTypeColor(resourceTypes, resource.resource_type?.slug)
            return (
              <AdvancedMarker
                key={resource.id}
                position={{ lat: resource.latitude, lng: resource.longitude }}
                onClick={() => {
                  setSelectedResource(resource)
                  setSelectedColor(color)
                }}
                title={resource.name}
              >
                <Pin
                  background={color}
                  borderColor={isSaved ? '#ffc60b' : 'white'}
                  glyphColor="white"
                  glyph={isSaved ? '★' : undefined}
                  scale={selectedResource?.id === resource.id ? 1.3 : 1}
                />
              </AdvancedMarker>
            )
          })}
        </Map>

        {view === 'national' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-md text-sm text-gray-600 pointer-events-none whitespace-nowrap">
            {clickToExplore}
          </div>
        )}

        {/* Mobile nearest strip */}
        {view === 'state' && nearestResources.length > 0 && (
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-10">
            <div className="flex gap-3 overflow-x-auto px-3 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 scrollbar-hide">
              {nearestResources.map((r, i) => {
                const color = getTypeColor(resourceTypes, r.resource_type?.slug)
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedResource(r)
                      setSelectedColor(color)
                      map?.panTo({ lat: r.latitude, lng: r.longitude })
                      map?.setZoom(14)
                    }}
                    className="flex-none w-44 bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-left"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                      <span className="text-xs" style={{ color }}>{r.resource_type?.icon}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{r.distance.toFixed(1)} mi away</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedResource && (
          <ResourceCard
            resource={selectedResource}
            color={selectedColor}
            isSaved={savedIds.has(selectedResource.id)}
            onToggleSave={() => toggleSave(selectedResource.id)}
            onClose={() => setSelectedResource(null)}
            lang={lang}
          />
        )}
      </div>
    </div>
  )
}

export default function ResourceMap() {
  return (
    <APIProvider apiKey={GOOGLE_KEY}>
      <MapInner />
    </APIProvider>
  )
}
