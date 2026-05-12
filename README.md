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
