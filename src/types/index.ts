export type ResourceType = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

export type Resource = {
  id: string
  place_id: string
  name: string
  latitude: number
  longitude: number
  city: string | null
  resource_type_id: string | null
  resource_type?: ResourceType
  hotline: string | null
  languages: string[]
  services: string[]
  serves_minors: boolean
  notes: string | null
  state: string | null
  is_active: boolean
  is_verified: boolean
  links: {
    title_ix: string | null
    counseling: string | null
    other: string | null
    campus_police: string | null
  } | null
}

export type PlaceDetails = {
  name: string
  formatted_address: string
  phone: string | null
  website: string | null
  hours: string[] | null
  open_now: boolean | null
  rating: number | null
  review_count: number | null
  google_maps_uri: string | null
  wheelchair_accessible: boolean | null
  description: string | null
  business_status: string | null
  current_open_now: boolean | null
  current_hours: string[] | null
  primary_type: string | null
}
