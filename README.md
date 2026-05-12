# Summer Willis Foundation

Website for the Summer Willis Foundation, built with Astro, React, Tailwind CSS, and Supabase.

## Tech stack

### Framework and rendering
- **Astro 5** (`astro ^5.17.1`) drives the site. Most pages are static `.astro` templates rendered at build time. Interactive UI (the resource map, filter bar, resource card) is shipped as React islands via `@astrojs/react` and hydrated client-side (most use `client:visible`).
- **React 19** (`react`, `react-dom` ^19.2.4) for those islands. `@types/react` and `@types/react-dom` are wired in for type safety.
- **TypeScript** is enabled for all `.ts` / `.tsx` files; Astro's default `tsconfig.json` extends `astro/tsconfigs/strict`.

### Styling
- **Tailwind CSS v4** (`tailwindcss ^4.2.1`) integrated through the official Vite plugin (`@tailwindcss/vite`). Styles are imported from `src/styles/tailwind.css`.
- Page-scoped CSS lives in `<style>` blocks inside each `.astro` file; theme tokens are defined as CSS custom properties (`--c-primary`, `--c-bg-teal`, etc.) and referenced from both Tailwind utilities and component styles.

### Data layer
- **Supabase** (`@supabase/supabase-js ^2.98.0`) is the source of truth for the resource directory. The browser client is created in `ResourceMap.tsx` using `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. Tables used: `resources` (joined to `resource_types`).
- A one-off Node script at `scripts/backfill-states.mjs` reverse-geocodes resource lat/lng to a US state abbreviation and writes it back to Supabase. Run with `node scripts/backfill-states.mjs`.

### Maps and geocoding
- **Google Maps** rendered through `@vis.gl/react-google-maps ^1.7.1` (`APIProvider`, `Map`, `AdvancedMarker`, `Pin`, `useMap`).
- **Marker clustering** is provided by `@googlemaps/markerclusterer ^2.6.2` for dense state-level views.
- **Geocoding** uses the Google Geocoding REST API directly (called from `ResourceMap.tsx`) to translate user-entered city / state / zip into lat/lng and zoom level.
- A static GeoJSON of US states is loaded from `PublicaMundi/MappingAPI` on GitHub to draw the national overlay.

### Donations
- **GiveButter** widgets are embedded via their hosted script. Mount points include a donation form on Get Involved and supporting CTAs across the site.

### SEO
- **`astro-seo ^1.1.0`** powers `<head>` metadata, OpenGraph, Twitter cards, and JSON-LD schema blocks.
- **`@astrojs/sitemap ^3.7.0`** generates `sitemap-index.xml` at build time. A hand-written `public/robots.txt` references it.
- Canonical URLs are emitted from the shared `src/layouts/Layout.astro`.

### Build and tooling
- **Vite** (bundled with Astro) handles module resolution and dev server.
- **No test framework** is currently configured.
- Path alias `@/*` resolves to `src/*` (set up in `tsconfig.json`).

### Hosting and environment
- `astro.config.mjs` sets `site: 'https://www.summerwillisfoundation.org'`. Production builds output static assets to `./dist/`.
- Required env vars (`.env` at project root, prefixed with `PUBLIC_` so Astro exposes them to the client):
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `PUBLIC_GOOGLE_MAPS_API_KEY`

### Project structure
```
src/
  assets/         static imports (images, etc.)
  components/     Astro components + React islands (ResourceMap, FilterBar, ResourceCard, Nav, Footer, etc.)
  layouts/        Layout.astro (default), BlogPost.astro (blog posts)
  lib/            constants.ts (marker colors, theme tokens)
  pages/          route files; blog/ and events/ hold dynamic + index routes
  styles/         tailwind.css entrypoint
  types/          shared TypeScript types (Resource, ResourceType, etc.)
public/           static files served at root (favicon, robots.txt, images)
scripts/          one-off Node scripts (backfill-states.mjs)
```

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

## Deployment

The site is deployed on **Vercel** and served at https://www.summerwillisfoundation.org.

- **Source.** The `main` branch of `github.com/heilashahidi/summer-willis-foundation` is connected to the Vercel project (`summer-willis-foundation`). Pushes to `main` trigger a production deploy; pushes to other branches and pull requests get preview deployments.
- **Build.** Vercel detects Astro automatically and runs `npm install` followed by `npm run build`, publishing the static output from `./dist/`. No serverless functions are used; the site is fully static.
- **Environment variables.** Set the `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `PUBLIC_GOOGLE_MAPS_API_KEY` env vars in the Vercel project settings for Production, Preview, and Development environments. Because they are prefixed with `PUBLIC_`, Astro inlines them into the client bundle at build time, so a redeploy is required whenever they change.
- **Domain.** The production domain `www.summerwillisfoundation.org` is configured in Vercel. `astro.config.mjs` mirrors this value via `site:`, which is used to generate absolute URLs for the sitemap and canonical tags.
- **Local Vercel CLI.** The repo contains a `.vercel/` directory linking the local checkout to the hosted project, so `vercel`, `vercel pull`, and `vercel deploy` work out of the box for anyone with access.
- **Cache and assets.** Vercel serves `./dist/` behind its CDN with immutable cache headers on hashed assets. Files in `public/` (fonts, images, favicons, `robots.txt`) are served verbatim from the site root.
- **Post-deploy checks.** After a production deploy, verify the resource map loads (Supabase + Google Maps env vars wired up), the GiveButter donate widget mounts, and `sitemap-index.xml` resolves at the site root.

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
