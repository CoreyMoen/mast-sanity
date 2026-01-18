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

// Resolve page/post references in link objects
// Note: We always try to resolve these since object fields may not have _type set
const linkReference = /* groq */ `
  "page": page->slug.current,
  "post": post->slug.current
`

const linkFields = /* groq */ `
  link {
      ...,
      ${linkReference}
      }
`

// Rich text content with resolved links
const richTextFields = /* groq */ `
  content[]{
    ...,
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
    _type == "buttonBlock" => {
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
    _type == "buttonBlock" => {
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
      _type == "callToAction" => {
        ${linkFields},
      },
      _type == "infoSection" => {
        content[]{
          ...,
          markDefs[]{
            ...,
            ${linkReference}
          }
        }
      },
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
