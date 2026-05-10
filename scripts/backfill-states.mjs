/**
 * Backfill script: reverse-geocode lat/lng → US state for all resources
 *
 * Run with:
 *   node scripts/backfill-states.mjs
 *
 * Requirements:
 *   - .env file in project root with PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY,
 *     PUBLIC_GOOGLE_MAPS_API_KEY
 *   - The `state` column must exist in your resources table (run the SQL below first)
 *
 * SQL to add the column (run once in Supabase SQL editor):
 *   ALTER TABLE resources ADD COLUMN IF NOT EXISTS state text;
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env manually (no dotenv dependency needed)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env')
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = envVars.PUBLIC_SUPABASE_URL
const SUPABASE_KEY = envVars.PUBLIC_SUPABASE_ANON_KEY
const GOOGLE_KEY = envVars.PUBLIC_GOOGLE_MAPS_API_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function reverseGeocode(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=administrative_area_level_1&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' || !data.results[0]) return null

  const stateComponent = data.results[0].address_components.find(c =>
    c.types.includes('administrative_area_level_1')
  )
  return stateComponent?.short_name ?? null // e.g. "TX", "CA"
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('Fetching resources without a state...')

  const { data: resources, error } = await supabase
    .from('resources')
    .select('id, name, latitude, longitude, state')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .is('state', null)

  if (error) {
    console.error('Failed to fetch resources:', error.message)
    process.exit(1)
  }

  console.log(`Found ${resources.length} resources to backfill.\n`)

  let success = 0
  let failed = 0

  for (const resource of resources) {
    const state = await reverseGeocode(resource.latitude, resource.longitude)

    if (!state) {
      console.warn(`  ✗ Could not geocode: ${resource.name} (${resource.latitude}, ${resource.longitude})`)
      failed++
    } else {
      const { error: updateError } = await supabase
        .from('resources')
        .update({ state })
        .eq('id', resource.id)

      if (updateError) {
        console.error(`  ✗ Failed to update ${resource.name}: ${updateError.message}`)
        failed++
      } else {
        console.log(`  ✓ ${resource.name} → ${state}`)
        success++
      }
    }

    // Stay under Google's 50 req/s rate limit
    await sleep(50)
  }

  console.log(`\nDone! ${success} updated, ${failed} failed.`)
}

main()
