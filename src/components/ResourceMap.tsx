import { useState, useCallback, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps'
import { createClient } from '@supabase/supabase-js'
import type { Resource, ResourceType } from '@/types'
import ResourceCard from './ResourceCard'
import FilterBar from './FilterBar'

const TEXAS_CENTER = { lat: 31.0, lng: -99.0 }
const GOOGLE_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY

// Site theme colors applied to resource types in order
const THEME_COLORS = [
  '#00909d', // teal
  '#ffc60b', // yellow
  '#ef3f6b', // hot pink
  '#6e98b9', // blue
  '#006b7a', // dark teal
  '#f37f8e', // light pink
  '#bad0ec', // light blue
]

function getTypeColor(types: import('@/types').ResourceType[], slug: string | undefined): string {
  if (!slug) return THEME_COLORS[0]
  const idx = types.findIndex(t => t.slug === slug)
  return THEME_COLORS[(idx >= 0 ? idx : 0) % THEME_COLORS.length]
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
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

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

  const filtered = selectedType
    ? resources.filter(r => r.resource_type?.slug === selectedType)
    : resources

  const handleSearch = useCallback(async (query: string) => {
    setLocationError(null)
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + ', TX')}&key=${GOOGLE_KEY}`
      )
      const data = await res.json()
      if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location
        map?.panTo({ lat, lng })
        map?.setZoom(11)
      } else {
        setLocationError('Location not found. Try a Texas city or zip code.')
      }
    } catch {
      setLocationError('Search failed. Please try again.')
    }
  }, [map])

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
        setLocating(false)
      },
      () => {
        setLocationError('Unable to get your location. Please check your browser permissions.')
        setLocating(false)
      }
    )
  }, [map])

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        resourceTypes={resourceTypes}
        selectedType={selectedType}
        onSelect={setSelectedType}
        onSearch={handleSearch}
        onLocate={handleLocate}
        locating={locating}
      />

      {locationError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-600">
          {locationError}
        </div>
      )}

      <div className="relative flex-1">
        <Map
          defaultCenter={TEXAS_CENTER}
          defaultZoom={6}
          mapId="resource-map"
          gestureHandling="greedy"
          className="w-full h-full"
        >
          {filtered.map(resource => (
            <AdvancedMarker
              key={resource.id}
              position={{ lat: resource.latitude, lng: resource.longitude }}
              onClick={() => setSelectedResource(resource)}
              title={resource.name}
            >
              <Pin
                background={getTypeColor(resourceTypes, resource.resource_type?.slug)}
                borderColor="white"
                glyphColor="white"
                scale={selectedResource?.id === resource.id ? 1.3 : 1}
              />
            </AdvancedMarker>
          ))}
        </Map>

        {selectedResource && (
          <ResourceCard
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
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
