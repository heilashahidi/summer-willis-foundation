import { useState } from 'react'
import type { ResourceType } from '@/types'

const THEME_COLORS = [
  '#00909d', // teal
  '#ffc60b', // yellow
  '#ef3f6b', // hot pink
  '#6e98b9', // blue
  '#006b7a', // dark teal
  '#f37f8e', // light pink
  '#bad0ec', // light blue
]

type Props = {
  resourceTypes: ResourceType[]
  selectedType: string | null
  onSelect: (slug: string | null) => void
  onSearch: (query: string) => void
  onLocate: () => void
  locating: boolean
}

export default function FilterBar({
  resourceTypes,
  selectedType,
  onSelect,
  onSearch,
  onLocate,
  locating,
}: Props) {
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <div className="bg-white shadow-sm z-10 px-3 py-2 space-y-2">
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-0">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="City or zip code..."
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{ '--tw-ring-color': 'transparent' } as React.CSSProperties}
            onFocus={e => (e.target.style.borderColor = '#00909d')}
            onBlur={e => (e.target.style.borderColor = '')}
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            style={{ backgroundColor: '#00909d' }}
          >
            Search
          </button>
        </form>

        <button
          onClick={onLocate}
          disabled={locating}
          className="px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0"
          style={{ backgroundColor: '#006b7a' }}
        >
          {locating ? '...' : '📍'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onSelect(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors shrink-0 ${
            selectedType === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          All
        </button>

        {resourceTypes.map((type, i) => {
          const color = THEME_COLORS[i % THEME_COLORS.length]
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
              {type.icon} {type.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
