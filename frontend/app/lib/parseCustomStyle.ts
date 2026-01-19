/**
 * Shared utility for parsing custom CSS strings into React style objects
 * with security filtering via property whitelist
 */

/**
 * Whitelist of allowed CSS properties for security
 * Only these properties can be set via customStyle to prevent XSS and unwanted styling
 * Properties are in camelCase format (React style object format)
 */
const ALLOWED_CSS_PROPERTIES = new Set([
  // Layout
  'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignContent',
  'gap', 'rowGap', 'columnGap', 'order', 'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  // Spacing
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  // Sizing
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  // Typography
  'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform',
  // Colors (limited - no arbitrary URLs)
  'color', 'backgroundColor', 'opacity',
  // Borders
  'border', 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius',
  'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
  // Position (relative only for safety)
  'position', 'top', 'right', 'bottom', 'left', 'zIndex',
  // Other safe properties
  'overflow', 'overflowX', 'overflowY', 'boxSizing', 'verticalAlign',
])

/**
 * Check if a CSS property is allowed
 * Allows any CSS custom property (--*) plus whitelisted standard properties
 */
function isAllowedProperty(property: string): boolean {
  // Allow CSS custom properties (variables)
  if (property.startsWith('--')) return true
  return ALLOWED_CSS_PROPERTIES.has(property)
}

/**
 * Parse CSS string to React style object with security filtering
 * Only allows whitelisted properties to prevent XSS and unwanted styling
 *
 * @param cssString - CSS string in format "property: value; property2: value2;"
 * @returns React CSSProperties object or undefined if invalid/empty
 *
 * @example
 * parseCustomStyle('padding: 10px; color: blue;')
 * // Returns: { padding: '10px', color: 'blue' }
 *
 * @example
 * parseCustomStyle('background-image: url(evil.com);')
 * // Returns: {} (backgroundImage not in whitelist for security)
 */
export function parseCustomStyle(cssString?: string): React.CSSProperties | undefined {
  if (!cssString) return undefined
  try {
    const entries = cssString
      .split(';')
      .filter((s) => s.trim())
      .map((s) => {
        const [key, ...valueParts] = s.split(':')
        const value = valueParts.join(':').trim()
        // Clean the key: remove trailing hyphens and convert to camelCase
        const cleanKey = key.trim().replace(/-+$/, '') // Remove trailing hyphens
        if (!cleanKey || !value) return null // Skip invalid entries

        // Check if it's a CSS custom property (starts with --)
        if (cleanKey.startsWith('--')) {
          if (!isAllowedProperty(cleanKey)) return null
          return [cleanKey, value]
        }

        // Convert to camelCase for standard properties
        const camelKey = cleanKey.replace(/-([a-z])/g, (g) => g[1].toUpperCase())

        // Security: Only allow whitelisted properties
        if (!isAllowedProperty(camelKey)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[parseCustomStyle] Blocked non-whitelisted CSS property: ${cleanKey}`)
          }
          return null
        }

        return [camelKey, value]
      })
      .filter((entry): entry is [string, string] => entry !== null)
    return Object.fromEntries(entries)
  } catch {
    return undefined
  }
}
