import { useEffect, useState } from 'react'
import type { Resource, PlaceDetails } from '@/types'

type Props = {
  resource: Resource
  onClose: () => void
}

const PLACES_KEY = import.meta.env.PUBLIC_GOOGLE_PLACES_API_KEY

export default function ResourceCard({ resource, onClose }: Props) {
  const [details, setDetails] = useState<PlaceDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setDetails(null)
    fetch(`https://places.googleapis.com/v1/places/${resource.place_id}`, {
      headers: {
        'X-Goog-Api-Key': PLACES_KEY,
        'X-Goog-FieldMask':
          'displayName,formattedAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,rating,userRatingCount,accessibilityOptions,googleMapsUri',
      },
    })
      .then(r => r.json())
      .then(data => {
        setDetails({
          name: data.displayName?.text ?? null,
          formatted_address: data.formattedAddress ?? null,
          phone: data.nationalPhoneNumber ?? null,
          website: data.websiteUri ?? null,
          hours: data.regularOpeningHours?.weekdayDescriptions ?? null,
          open_now: data.regularOpeningHours?.openNow ?? null,
          rating: data.rating ?? null,
          review_count: data.userRatingCount ?? null,
          google_maps_uri: data.googleMapsUri ?? null,
          wheelchair_accessible: data.accessibilityOptions?.wheelchairAccessibleEntrance ?? null,
        })
      })
      .finally(() => setLoading(false))
  }, [resource.place_id])

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className="fixed inset-0 bg-black/20 z-20 md:hidden"
        onClick={onClose}
      />

      {/* Card — bottom drawer on mobile, floating panel on desktop */}
      <div className={`
        fixed z-30 bg-white shadow-xl overflow-hidden
        bottom-0 left-0 right-0 rounded-t-2xl max-h-[75vh]
        md:absolute md:bottom-auto md:top-4 md:right-4 md:left-auto
        md:w-80 md:rounded-xl md:max-h-[85vh]
      `}>
        {/* Handle (mobile only) */}
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div
          className="px-4 py-3 text-white"
          style={{ backgroundColor: resource.resource_type?.color ?? '#6366f1' }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium opacity-80 mb-0.5">
                {resource.resource_type?.icon} {resource.resource_type?.name}
              </p>
              <h2 className="font-bold text-base leading-tight">{resource.name}</h2>
              {resource.city && (
                <p className="text-sm opacity-80 mt-0.5">{resource.city}, TX</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white opacity-70 hover:opacity-100 text-xl leading-none ml-3 shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[55vh] md:max-h-[70vh]">
          {loading && (
            <p className="text-sm text-gray-400">Loading details...</p>
          )}

          {!loading && details && (
            <>
              {details.open_now !== null && (
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    details.open_now
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {details.open_now ? '● Open now' : '● Closed now'}
                  </span>
                </div>
              )}

              {details.rating && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Rating</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-sm">
                      {'★'.repeat(Math.round(details.rating))}{'☆'.repeat(5 - Math.round(details.rating))}
                    </span>
                    <span className="text-sm text-gray-700 font-medium">{details.rating.toFixed(1)}</span>
                    {details.review_count && (
                      <span className="text-xs text-gray-400">({details.review_count.toLocaleString()} reviews)</span>
                    )}
                  </div>
                </div>
              )}

              {details.formatted_address && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
                  <p className="text-sm text-gray-700">{details.formatted_address}</p>
                </div>
              )}

              {resource.hotline && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">24/7 Hotline</p>
                  <a href={`tel:${resource.hotline}`} className="text-sm font-bold text-red-600 hover:underline">
                    {resource.hotline}
                  </a>
                </div>
              )}

              {details.phone && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                  <a href={`tel:${details.phone}`} className="text-sm text-blue-600 hover:underline">
                    {details.phone}
                  </a>
                </div>
              )}

              {details.hours && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Hours</p>
                  <ul className="text-sm text-gray-700 space-y-0.5">
                    {details.hours.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}

              {details.wheelchair_accessible && (
                <p className="text-xs text-blue-600 font-medium">♿ Wheelchair accessible entrance</p>
              )}

              {resource.serves_minors && (
                <p className="text-xs text-green-600 font-medium">✓ Serves minors</p>
              )}

              {resource.services?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {resource.services.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {resource.languages?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {resource.languages.map(l => (
                      <span key={l} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {resource.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Notes</p>
                  <p className="text-sm text-gray-600">{resource.notes}</p>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {details.google_maps_uri && (
                  <a
                    href={details.google_maps_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg py-2 transition-colors"
                  >
                    📍 Directions
                  </a>
                )}
                {details.website && (
                  <a
                    href={details.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg py-2 transition-colors"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
