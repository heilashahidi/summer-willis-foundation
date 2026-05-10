import { useState } from 'react'
import type { Resource, ResourceType } from '@/types'
import { MARKER_COLORS, MARKER_COLOR_BY_SLUG } from '@/lib/constants'

const C_PRIMARY      = '#00909d'
const C_PRIMARY_DARK = '#006b7a'
const C_YELLOW       = '#ffc60b'
const C_BG_TEAL_SOFT = '#e6f4f5'

export type Lang = 'en' | 'es'

const TYPE_NAME_ES: Record<string, string> = {
  'Advocacy Organization': 'Organización de Defensa',
  'Child Advocacy': 'Defensa Infantil',
  'Clinic': 'Clínica',
  'Counseling/Therapy': 'Consejería/Terapia',
  'Counseling & Therapy': 'Consejería y Terapia',
  'Crisis Hotlines': 'Líneas de Crisis',
  'Crisis Hotline': 'Línea de Crisis',
  'Law Enforcement': 'Fuerzas del Orden',
  'Pro Bono Legal': 'Servicios Legales Gratuitos',
  'SANE Program': 'Programa SANE',
  'Sexual Violence Services': 'Servicios para Sobrevivientes',
  'Shelter / Safe House': 'Refugio / Casa Segura',
  'Shelter': 'Refugio',
}

const TRANSLATIONS = {
  en: {
    exploreByState: 'Explore by State',
    tapState: '🗺️ Tap a highlighted state to explore resources',
    clickStateDesc: ['Click a ', 'teal highlighted', ' state on the map to view survivor support resources in that area.'],
    allStates: '← All States',
    searchLocation: 'Search Location',
    cityZip: 'City or zip code...',
    search: 'Search',
    useMyLocation: 'Use my location',
    filterByType: 'Filter by Type',
    clear: 'Clear',
    saved: 'Saved',
    allTypes: 'All Types',
    all: 'All',
  },
  es: {
    exploreByState: 'Explorar por Estado',
    tapState: '🗺️ Toca un estado resaltado para explorar recursos',
    clickStateDesc: ['Haz clic en un estado resaltado en ', 'turquesa', ' para ver recursos de apoyo para sobrevivientes en esa área.'],
    allStates: '← Todos los Estados',
    searchLocation: 'Buscar Ubicación',
    cityZip: 'Ciudad o código postal...',
    search: 'Buscar',
    useMyLocation: 'Usar mi ubicación',
    filterByType: 'Filtrar por Tipo',
    clear: 'Limpiar',
    saved: 'Guardados',
    allTypes: 'Todos los Tipos',
    all: 'Todos',
  },
}

type Props = {
  view: 'national' | 'state'
  selectedStateName: string | null
  onBack: () => void
  resourceTypes: ResourceType[]
  selectedType: string | null
  onSelect: (slug: string | null) => void
  onSearch: (query: string) => void
  onLocate: () => void
  locating: boolean
  locationError: string | null
  showSavedOnly: boolean
  savedCount: number
  onToggleSavedOnly: () => void
  lang: Lang
  onToggleLang: () => void
  nearestResources: (Resource & { distance: number })[]
  onSelectNearest: (r: Resource & { distance: number }) => void
}

export default function FilterBar({
  view,
  selectedStateName,
  onBack,
  resourceTypes,
  selectedType,
  onSelect,
  onSearch,
  onLocate,
  locating,
  locationError,
  showSavedOnly,
  savedCount,
  onToggleSavedOnly,
  lang,
  onToggleLang,
  nearestResources,
  onSelectNearest,
}: Props) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'filters' | 'nearest'>('filters')
  const t = TRANSLATIONS[lang]

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  function typeName(name: string) {
    return lang === 'es' ? (TYPE_NAME_ES[name] ?? name) : name
  }

  const filteredCount = selectedType
    ? resourceTypes.find(t => t.slug === selectedType)?.name
    : null

  // ── National view ──
  if (view === 'national') {
    return (
      <>
        <div className="md:hidden bg-white border-b border-gray-200 z-10 px-4 py-3">
          <p className="text-sm text-gray-500 text-center">{t.tapState}</p>
        </div>
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 shrink-0 justify-center items-center p-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
            style={{ backgroundColor: C_BG_TEAL_SOFT }}
          >
            🗺️
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-2">{t.exploreByState}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t.clickStateDesc[0]}<span className="font-semibold" style={{ color: C_PRIMARY }}>{t.clickStateDesc[1]}</span>{t.clickStateDesc[2]}
          </p>
          <button
            onClick={onToggleLang}
            className="mt-6 flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            🌐 {lang === 'en' ? 'Español' : 'English'}
          </button>
        </aside>
      </>
    )
  }

  // ── State view ──
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 shrink-0"
          >
            {t.allStates}
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate">{selectedStateName}</span>
        </div>
        <div className="flex gap-2 px-3 pb-2">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-0">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.cityZip}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              onFocus={e => (e.target.style.borderColor = C_PRIMARY)}
              onBlur={e => (e.target.style.borderColor = '')}
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-white text-sm font-medium rounded-lg shrink-0"
              style={{ backgroundColor: C_PRIMARY }}
            >
              {t.search}
            </button>
          </form>
          <button
            onClick={onLocate}
            disabled={locating}
            className="px-3 py-1.5 text-white text-sm font-medium rounded-lg disabled:opacity-50 shrink-0"
            style={{ backgroundColor: C_PRIMARY_DARK }}
          >
            {locating ? '...' : '📍'}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 pb-3 scrollbar-hide">
          <button
            onClick={onToggleSavedOnly}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors shrink-0 ${
              showSavedOnly ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-300'
            }`}
            style={showSavedOnly ? { backgroundColor: C_YELLOW, borderColor: C_YELLOW } : {}}
          >
            ★ {t.saved}{savedCount > 0 ? ` (${savedCount})` : ''}
          </button>
          <button
            onClick={() => onSelect(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors shrink-0 ${
              selectedType === null && !showSavedOnly ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {t.all}
          </button>
          {resourceTypes.map((type, i) => {
            const color = MARKER_COLOR_BY_SLUG[type.slug] ?? MARKER_COLORS[i % MARKER_COLORS.length]
            const active = selectedType === type.slug
            return (
              <button
                key={type.slug}
                onClick={() => onSelect(active ? null : type.slug)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors shrink-0 ${
                  active ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-300'
                }`}
                style={active ? { backgroundColor: color, borderColor: color } : {}}
              >
                {type.icon} {typeName(type.name)}
              </button>
            )
          })}
        </div>
        {locationError && (
          <div className="px-3 pb-2 text-sm text-red-600">{locationError}</div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            {t.allStates}
          </button>
          <h2 className="text-lg font-bold text-gray-800 mt-2">{selectedStateName}</h2>
        </div>

        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{t.searchLocation}</p>
          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.cityZip}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              onFocus={e => (e.target.style.borderColor = C_PRIMARY)}
              onBlur={e => (e.target.style.borderColor = '')}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 text-white text-sm font-medium rounded-lg transition-colors"
                style={{ backgroundColor: C_PRIMARY }}
              >
                {t.search}
              </button>
              <button
                type="button"
                onClick={onLocate}
                disabled={locating}
                className="px-3 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 shrink-0"
                style={{ backgroundColor: C_PRIMARY_DARK }}
                title={t.useMyLocation}
              >
                {locating ? '...' : '📍'}
              </button>
            </div>
          </form>
          {locationError && (
            <p className="mt-2 text-xs text-red-600">{locationError}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'filters'
                ? 'text-teal-600 border-b-2 border-teal-500 -mb-px'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {lang === 'en' ? 'Filters' : 'Filtros'}
          </button>
          <button
            onClick={() => setActiveTab('nearest')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'nearest'
                ? 'text-teal-600 border-b-2 border-teal-500 -mb-px'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            📍 {lang === 'en' ? 'Nearest' : 'Cercanos'}
            {nearestResources.length > 0 && (
              <span className="ml-1 bg-teal-100 text-teal-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {nearestResources.length}
              </span>
            )}
          </button>
        </div>

        {/* Lang toggle */}
        <div className="px-5 pt-3 pb-0 flex justify-end">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            🌐 {lang === 'en' ? 'Español' : 'English'}
          </button>
        </div>

        {/* Filters tab */}
        {activeTab === 'filters' && (
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t.filterByType}</p>
              {filteredCount && (
                <button onClick={() => onSelect(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  {t.clear}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={onToggleSavedOnly}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  showSavedOnly ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={showSavedOnly ? { backgroundColor: C_YELLOW } : {}}
              >
                <span className="text-base">★</span>
                {t.saved}{savedCount > 0 ? ` (${savedCount})` : ''}
              </button>
              <button
                onClick={() => onSelect(null)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  selectedType === null && !showSavedOnly ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">🗺️</span>
                {t.allTypes}
              </button>
              {resourceTypes.map((type, i) => {
                const color = MARKER_COLOR_BY_SLUG[type.slug] ?? MARKER_COLORS[i % MARKER_COLORS.length]
                const active = selectedType === type.slug
                return (
                  <button
                    key={type.slug}
                    onClick={() => onSelect(active ? null : type.slug)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                      active ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={active ? { backgroundColor: color } : {}}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: active ? 'white' : color }}
                    />
                    {type.icon} {typeName(type.name)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Nearest tab */}
        {activeTab === 'nearest' && (
          <div className="p-5 flex-1 overflow-y-auto">
            {nearestResources.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">📍</p>
                <p className="text-sm text-gray-400">
                  {lang === 'en'
                    ? 'Search a location to see nearby resources.'
                    : 'Busca una ubicación para ver recursos cercanos.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {nearestResources.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectNearest(r)}
                    className="flex items-start gap-2.5 w-full px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-400 w-4 shrink-0 mt-0.5">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.resource_type?.icon} {typeName(r.resource_type?.name ?? '')} · {r.distance.toFixed(1)} mi</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
