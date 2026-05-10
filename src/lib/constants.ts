// Maps hex color → CSS class suffix for card/avatar styling (shared across pages)
export const HEX_TO_CLASS: Record<string, string> = {
  '#00909d': 'teal',
  '#d4a000': 'yellow',
  '#ef3f6b': 'pink',
  '#6e98b9': 'blue',
  '#006b7a': 'teal-dark',
  '#f37f8e': 'pink-light',
}

// Readable brand colors for map markers and filter buttons (no background tints)
export const MARKER_COLORS = [
  '#00909d', // teal
  '#ef3f6b', // hot pink
  '#6e98b9', // blue
  '#ffc60b', // yellow
  '#006b7a', // dark teal
  '#f37f8e', // pink
]

// Override colors for specific resource type slugs
export const MARKER_COLOR_BY_SLUG: Record<string, string> = {
  'counseling-therapy': '#7e6bb5',       // soft purple
  'sexual-violence-services': '#c05c7a', // deep rose
}

export const THEME_COLORS = [
  '#00909d', // teal
  '#ffc60b', // yellow
  '#f37f8e', // light pink
  '#6e98b9', // blue
  '#006b7a', // dark teal
  '#eff8fa', // bg teal
  '#ffe896', // light yellow
  '#fff7eb', // bg yellow
  '#ef3f6b', // hot pink
  '#fef2f1', // bg pink
  '#bad0ec', // light blue
  '#eef5fc', // bg blue
]
