import { useEffect, useState } from 'react'
import type { Resource, PlaceDetails } from '@/types'
import type { Lang } from './FilterBar'

const TRANSLATIONS = {
  en: {
    loading: 'Loading details...',
    openNow: '● Open now',
    closedNow: '● Closed now',
    rating: 'Rating',
    reviews: 'reviews',
    address: 'Address',
    hotline: '24/7 Hotline',
    phone: 'Phone',
    hours: 'Hours',
    wheelchair: '♿ Wheelchair accessible entrance',
    servesMinors: '✓ Serves minors',
    services: 'Services',
    languages: 'Languages',
    notes: 'Notes',
    directions: '📍 Directions',
    visitWebsite: 'Visit Website →',
    noDetails: 'No additional details available.',
    removeSaved: 'Remove from saved',
    saveResource: 'Save this resource',
  },
  es: {
    loading: 'Cargando detalles...',
    openNow: '● Abierto ahora',
    closedNow: '● Cerrado ahora',
    rating: 'Calificación',
    reviews: 'reseñas',
    address: 'Dirección',
    hotline: 'Línea de crisis 24/7',
    phone: 'Teléfono',
    hours: 'Horario',
    wheelchair: '♿ Entrada accesible para sillas de ruedas',
    servesMinors: '✓ Atiende a menores',
    services: 'Servicios',
    languages: 'Idiomas',
    notes: 'Notas',
    directions: '📍 Cómo llegar',
    visitWebsite: 'Visitar Sitio Web →',
    noDetails: 'No hay detalles adicionales disponibles.',
    removeSaved: 'Quitar de guardados',
    saveResource: 'Guardar este recurso',
  },
}

type Props = {
  resource: Resource
  color: string
  isSaved: boolean
  onToggleSave: () => void
  onClose: () => void
  lang: Lang
}

const PLACES_KEY = import.meta.env.PUBLIC_GOOGLE_PLACES_API_KEY

export default function ResourceCard({ resource, color, isSaved, onToggleSave, onClose, lang }: Props) {
  const [details, setDetails] = useState<PlaceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const t = TRANSLATIONS[lang]

  useEffect(() => {
    if (!resource.place_id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setDetails(null)
    fetch(`https://places.googleapis.com/v1/places/${resource.place_id}`, {
      headers: {
        'X-Goog-Api-Key': PLACES_KEY,
        'X-Goog-FieldMask':
          'displayName,formattedAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,currentOpeningHours,rating,userRatingCount,accessibilityOptions,googleMapsUri,editorialSummary,businessStatus,primaryType',
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
          description: data.editorialSummary?.text ?? null,
          business_status: data.businessStatus ?? null,
          current_open_now: data.currentOpeningHours?.openNow ?? null,
          current_hours: data.currentOpeningHours?.weekdayDescriptions ?? null,
          primary_type: data.primaryType ?? null,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [resource.place_id])

  return (
    <>
      {/* Backdrop — dims on mobile, transparent on desktop */}
      <div
        className="fixed inset-0 bg-black/20 z-20 md:bg-transparent md:pointer-events-none"
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
          style={{ backgroundColor: color }}
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
              {details?.primary_type && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 capitalize">
                  {details.primary_type.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 ml-3 shrink-0">
              <button
                onClick={onToggleSave}
                title={isSaved ? t.removeSaved : t.saveResource}
                className="text-xl leading-none opacity-80 hover:opacity-100 transition-opacity"
              >
                {isSaved ? '★' : '☆'}
              </button>
              <button
                onClick={onClose}
                className="text-white opacity-70 hover:opacity-100 text-xl leading-none ml-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[55vh] md:max-h-[70vh]">
          {loading && (
            <p className="text-sm text-gray-400">{t.loading}</p>
          )}

          {!loading && (
            <>
              {details?.business_status && details.business_status !== 'OPERATIONAL' && (
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    ⚠️ {details.business_status === 'PERMANENTLY_CLOSED'
                      ? (lang === 'en' ? 'Permanently Closed' : 'Cerrado Permanentemente')
                      : (lang === 'en' ? 'Temporarily Closed' : 'Cerrado Temporalmente')}
                  </span>
                </div>
              )}

              {(details?.current_open_now !== null && details?.current_open_now !== undefined) && (
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    details.current_open_now ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {details.current_open_now ? t.openNow : t.closedNow}
                  </span>
                </div>
              )}

              {details?.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{details.description}</p>
              )}

              {details?.rating && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t.rating}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-sm">
                      {'★'.repeat(Math.round(details.rating))}{'☆'.repeat(5 - Math.round(details.rating))}
                    </span>
                    <span className="text-sm text-gray-700 font-medium">{details.rating.toFixed(1)}</span>
                    {details.review_count && (
                      <span className="text-xs text-gray-400">({details.review_count.toLocaleString()} {t.reviews})</span>
                    )}
                  </div>
                </div>
              )}

              {details?.formatted_address && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t.address}</p>
                  <p className="text-sm text-gray-700">{details.formatted_address}</p>
                </div>
              )}

              {resource.hotline && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t.hotline}</p>
                  <a href={`tel:${resource.hotline}`} className="text-sm font-bold text-red-600 hover:underline">
                    {resource.hotline}
                  </a>
                </div>
              )}

              {details?.phone && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t.phone}</p>
                  <a href={`tel:${details.phone}`} className="text-sm text-gray-700 hover:underline">
                    {details.phone}
                  </a>
                </div>
              )}

              {(details?.current_hours || details?.hours) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t.hours}</p>
                  <ul className="text-sm text-gray-700 space-y-0.5">
                    {(details.current_hours ?? details.hours)!.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}


              {details?.wheelchair_accessible && (
                <p className="text-xs text-gray-600 font-medium">{t.wheelchair}</p>
              )}

              {resource.serves_minors && (
                <p className="text-xs text-green-600 font-medium">{t.servesMinors}</p>
              )}

              {resource.services?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.services}</p>
                  <div className="flex flex-wrap gap-1">
                    {resource.services.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {resource.languages?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.languages}</p>
                  <div className="flex flex-wrap gap-1">
                    {resource.languages.map(l => (
                      <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {resource.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t.notes}</p>
                  <p className="text-sm text-gray-600">{resource.notes}</p>
                </div>
              )}

              {resource.links && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    {lang === 'en' ? 'University Resources' : 'Recursos Universitarios'}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {resource.links.title_ix && (
                      <a href={resource.links.title_ix} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors"
                        style={{ backgroundColor: `${color}15`, color }}>
                        ⚖️ {lang === 'en' ? 'Title IX Office' : 'Oficina Título IX'}
                      </a>
                    )}
                    {resource.links.counseling && (
                      <a href={resource.links.counseling} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors"
                        style={{ backgroundColor: `${color}15`, color }}>
                        🧠 {lang === 'en' ? 'Counseling & Mental Health' : 'Consejería y Salud Mental'}
                      </a>
                    )}
                    {resource.links.other && (
                      <a href={resource.links.other} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors"
                        style={{ backgroundColor: `${color}15`, color }}>
                        🛡️ {lang === 'en' ? 'Survivor Resources' : 'Recursos para Sobrevivientes'}
                      </a>
                    )}
                    {resource.links.campus_police && (
                      <a href={resource.links.campus_police} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors"
                        style={{ backgroundColor: `${color}15`, color }}>
                        🚔 {lang === 'en' ? 'Campus Police' : 'Policía del Campus'}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {details?.google_maps_uri && (
                  <a
                    href={details.google_maps_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm font-medium text-white rounded-lg py-2 transition-colors"
                    style={{ backgroundColor: color }}
                  >
                    {t.directions}
                  </a>
                )}
                {details?.website && (
                  <a
                    href={details.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm font-medium text-white rounded-lg py-2 transition-colors"
                    style={{ backgroundColor: color }}
                  >
                    {t.visitWebsite}
                  </a>
                )}
              </div>

              {!resource.hotline && !details?.phone && !resource.notes && !resource.services?.length && (
                <p className="text-sm text-gray-400 italic">{t.noDetails}</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
