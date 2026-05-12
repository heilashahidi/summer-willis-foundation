# Summer Willis Foundation

Website for the Summer Willis Foundation, built with Astro, React, Tailwind CSS, and Supabase.

## Tech stack

- **Astro 5** with React islands for interactive components
- **Tailwind CSS v4** for styling
- **Supabase** for the resource directory data
- **Google Maps** (`@vis.gl/react-google-maps` + marker clusterer) for the resource map
- **GiveButter** widgets for donations
- **astro-seo** + `@astrojs/sitemap` for SEO

## Pages

`/` home, `/about`, `/campaigns`, `/get-involved`, `/resource-guide`, `/resource-map`, `/map`, `/events`, `/press`, `/videos`, `/blog` (with dynamic `BlogPost` layout), `/contact`.

## Resource map

A core feature of the site: a searchable, vetted directory of survivor support services backed by Supabase and rendered with Google Maps.

- **Two routes.** `/resource-map` embeds the map inline with a "Understanding the Services" explainer and CTA banner. `/map` is the full-screen view, linked from the embedded page's "Open Full Map" button.
- **Two views.** The map opens at a national level with a US GeoJSON overlay; states that have resources are highlighted in teal, others are muted. Clicking a highlighted state fits bounds to it and drills into a state view that shows individual resource markers. A back action returns to the national view.
- **Welcome overlay.** First-time visitors see a centered overlay asking for a city, state, or zip code, with a "Use My Location" fallback (browser geolocation). The overlay also offers a Spanish toggle.
- **Bilingual.** All map UI (welcome overlay, filter bar, resource card copy) supports English and Spanish via a `lang` toggle.
- **Service categories.** Pro Bono Legal, SANE Program, Sexual Violence Services, Shelter / Safe House, Counseling & Therapy, and Crisis Hotlines. Each has its own marker color, icon, and theme (driven by `MARKER_COLOR_BY_SLUG` in `src/lib/constants.ts`).
- **Filtering.** Users can filter visible markers by service type and toggle a "saved only" view. Saved resources are persisted to `localStorage` under the `swf-saved-resources` key.
- **Search and geolocation.** Inside a state, users can geocode a city or zip (Google Geocoding API) or trigger browser geolocation; both update the map center, zoom, and the user's location reference point.
- **Nearest list.** When a user location is known, the filter bar surfaces the 10 nearest resources sorted by haversine distance. On mobile, the same list renders as a horizontally scrollable strip docked to the bottom of the map.
- **Resource detail.** Selecting a marker opens a `ResourceCard` panel with full details from Supabase. The card renders regardless of whether `place_id` is set.
- **Data shape.** Resources are loaded from the `resources` table (filtered to `is_active = true` and rows with lat/lng) joined to `resource_types`. Both tables are queried at mount via `@supabase/supabase-js`.

Components live in `src/components/ResourceMap.tsx`, `ResourceCard.tsx`, and `FilterBar.tsx`. Required env vars: `PUBLIC_GOOGLE_MAPS_API_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start local dev server at `localhost:4321`   |
| `npm run build`   | Build production site to `./dist/`           |
| `npm run preview` | Preview the production build locally         |

## Summary of updates

### Pages and content
- Added Events, Press, and Videos pages plus a Pillars section on the home page.
- Built the Resource Map page with Supabase-backed data, service explanations, and consistent theme colors.
- Added SEO blog articles and a reusable `BlogPost` layout.
- Updated the campaign stat cards: trimmed the resource map card, removed film stats, adjusted denim runs, and reformatted the legislation card to "Texas & growing / States with active advocacy."
- Added Gabriella Taylor's advisory and voice cards; tuned her voice card color.
- Removed TX House Democratic Caucus and Santa Monica City Council from sponsors.

### Donations
- Integrated GiveButter donation widgets across the site.
- Reordered the Get Involved page and fixed scroll jumps when widgets mount.

### SEO
- Added sitemap, `robots.txt`, canonical URLs, and JSON-LD schema.

### UI and polish
- Reworked navigation, hero sun positioning, and assorted UI details.
- Card stack animation, video embeds, and font fixes.
- Carousel improvements and decorative icon polish; prevented icons from overlapping content on resize.
- Fixed `ResourceCard` to render Supabase data regardless of `place_id`.
- Fixed JS-toggled active class scoping so it works in Astro production builds.
- Viewport meta tag now includes `initial-scale=1`; base font size set to 16px.
- Copy passes: removed em dashes from voice card quotes and other site copy.
