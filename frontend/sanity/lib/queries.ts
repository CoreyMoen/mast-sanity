import {defineQuery} from 'next-sanity'

export const settingsQuery = defineQuery(`*[_type == "settings"][0]`)

// Navigation query with resolved link references
export const navigationQuery = defineQuery(`*[_type == "navigation"][0]{
  logoText,
  logoImage,
  items[]{
    _key,
    label,
    type,
    link{
      linkType,
      href,
      openInNewTab,
      "page": page->slug.current,
      "post": post->slug.current
    },
    dropdownLinks[]{
      _key,
      label,
      link{
        linkType,
        href,
        openInNewTab,
        "page": page->slug.current,
        "post": post->slug.current
      }
    }
  },
  showCta,
  ctaLabel,
  ctaLink{
    linkType,
    href,
    openInNewTab,
    "page": page->slug.current,
    "post": post->slug.current
  },
  ctaStyle
}`)

// Footer query with resolved link references
export const footerQuery = defineQuery(`*[_type == "footer"][0]{
  showLogo,
  logoText,
  logoImage,
  linkColumns[]{
    _key,
    title,
    links[]{
      _key,
      label,
      link{
        linkType,
        href,
        openInNewTab,
        "page": page->slug.current,
        "post": post->slug.current
      }
    }
  },
  socialLinks[]{
    _key,
    platform,
    url
  },
  companyName,
  showThemeToggle
}`)

const postFields = /* groq */ `
  _id,
  "status": select(_originalId in path("drafts.**") => "draft", "published"),
  "title": coalesce(title, "Untitled"),
  "slug": slug.current,
  summary,
  coverImage,
  "date": coalesce(date, _updatedAt),
  "author": author->{firstName, lastName, picture},
`

// Resolve page/post/variable references in link objects
// Note: We always try to resolve these since object fields may not have _type set
const linkReference = /* groq */ `
  "page": page->slug.current,
  "post": post->slug.current,
  variable->{
    _id,
    variableType,
    linkValue{
      ...,
      "page": page->slug.current,
      "post": post->slug.current
    }
  }
`

// SmartString field expansion - resolves variable references for text fields
const smartStringFields = /* groq */ `
  ...,
  variableRef->{
    _id,
    name,
    key,
    variableType,
    textValue
  }
`

const linkFields = /* groq */ `
  link {
      ...,
      ${linkReference}
      }
`

// Rich text content with resolved links and inline variables
// Portable Text structure: blocks[].children[] contains inline objects
const richTextFields = /* groq */ `
  content[]{
    ...,
    // Expand inline content variables within block children
    children[]{
      ...,
      _type == "contentVariableInline" => {
        ...,
        reference->{
          _id,
          name,
          key,
          variableType,
          textValue
        }
      }
    },
    markDefs[]{
      ...,
      ${linkReference}
    }
  }
`

// Nested row content blocks (for rows inside columns)
// Handles 2 levels deep of nesting for button links
const nestedContentBlockFields = /* groq */ `
  content[]{
    ...,
    _type == "headingBlock" => {
      ...,
      text{ ${smartStringFields} }
    },
    _type == "eyebrowBlock" => {
      ...,
      text{ ${smartStringFields} }
    },
    _type == "buttonBlock" => {
      ...,
      text{ ${smartStringFields} },
      ${linkFields}
    },
    _type == "richTextBlock" => {
      ${richTextFields}
    },
    _type == "inlineVideoBlock" => {
      ...,
      videoFile {
        asset-> {
          url
        }
      },
      poster {
        ...,
        asset->
      }
    }
  }
`

// Content blocks inside columns
const contentBlockFields = /* groq */ `
  content[]{
    ...,
    _type == "headingBlock" => {
      ...,
      text{ ${smartStringFields} }
    },
    _type == "eyebrowBlock" => {
      ...,
      text{ ${smartStringFields} }
    },
    _type == "buttonBlock" => {
      ...,
      text{ ${smartStringFields} },
      ${linkFields}
    },
    _type == "richTextBlock" => {
      ${richTextFields}
    },
    _type == "inlineVideoBlock" => {
      ...,
      videoFile {
        asset-> {
          url
        }
      },
      poster {
        ...,
        asset->
      }
    },
    _type == "row" => {
      ...,
      columns[]{
        ...,
        ${nestedContentBlockFields}
      }
    }
  }
`

// Column fields with content blocks
const columnFields = /* groq */ `
  columns[]{
    ...,
    ${contentBlockFields}
  }
`

// Row fields with columns
const rowFields = /* groq */ `
  rows[]{
    ...,
    ${columnFields}
  }
`

// Section block projection
const sectionFields = /* groq */ `
  _type == "section" => {
    ...,
    ${rowFields}
  }
`

export const getPageQuery = defineQuery(`
  *[_type == 'page' && slug.current == $slug][0]{
    _id,
    _type,
    name,
    slug,
    heading,
    subheading,
    "pageBuilder": pageBuilder[]{
      ...,
      ${sectionFields}
    },
  }
`)

export const sitemapData = defineQuery(`
  *[_type == "page" || _type == "post" && defined(slug.current)] | order(_type asc) {
    "slug": slug.current,
    _type,
    _updatedAt,
  }
`)

export const allPostsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(date desc, _updatedAt desc) {
    ${postFields}
  }
`)

export const morePostsQuery = defineQuery(`
  *[_type == "post" && _id != $skip && defined(slug.current)] | order(date desc, _updatedAt desc) [0...$limit] {
    ${postFields}
  }
`)

export const postQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug] [0] {
    content[]{
    ...,
    markDefs[]{
      ...,
      ${linkReference}
    }
  },
    ${postFields}
  }
`)

export const postPagesSlugs = defineQuery(`
  *[_type == "post" && defined(slug.current)]
  {"slug": slug.current}
`)

export const pagesSlugs = defineQuery(`
  *[_type == "page" && defined(slug.current)]
  {"slug": slug.current}
`)

// Blog Grid queries - flexible queries for different selection modes
// Date sorting - descending (newest first)
export const blogGridAllPostsDateDescQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(date desc, _updatedAt desc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Date sorting - ascending (oldest first)
export const blogGridAllPostsDateAscQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(date asc, _updatedAt asc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Title sorting - descending (Z-A)
export const blogGridAllPostsTitleDescQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(title desc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Title sorting - ascending (A-Z)
export const blogGridAllPostsTitleAscQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(title asc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Specific posts by IDs (no sorting - respects order in CMS)
export const blogGridByIdsQuery = defineQuery(`
  *[_type == "post" && _id in $ids && defined(slug.current)] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Category filtering - date descending
export const blogGridByCategoryDateDescQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && $categoryId in categories[]._ref] | order(date desc, _updatedAt desc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Category filtering - date ascending
export const blogGridByCategoryDateAscQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && $categoryId in categories[]._ref] | order(date asc, _updatedAt asc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Category filtering - title descending
export const blogGridByCategoryTitleDescQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && $categoryId in categories[]._ref] | order(title desc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Category filtering - title ascending
export const blogGridByCategoryTitleAscQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && $categoryId in categories[]._ref] | order(title asc) [0...$limit] {
    ${postFields}
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Section Template query for preview
export const sectionTemplateQuery = defineQuery(`
  *[_type == "sectionTemplate" && _id == $id][0]{
    _id,
    _type,
    name,
    description,
    category,
    rows[]{
      ...,
      ${columnFields}
    },
    backgroundColor,
    minHeight,
    verticalAlign,
    maxWidth,
    paddingTop
  }
`)
