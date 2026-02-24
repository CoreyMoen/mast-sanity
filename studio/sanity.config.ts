/**
 * This config is used to configure your Sanity Studio.
 * Learn more: https://www.sanity.io/docs/configuration
 */

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {codeInput} from '@sanity/code-input'
import {schemaTypes} from './src/schemaTypes'
import {structure} from './src/structure'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {
  presentationTool,
  defineDocuments,
  defineLocations,
  type DocumentLocation,
} from 'sanity/presentation'
import {PageNavigator} from './src/presentation/PageNavigator'
import {assist} from '@sanity/assist'
import {claudeAssistant, createStudioLayout} from './src/plugins/claude-assistant'
import {pinboard} from './src/plugins/pinboard'
import {StudioIcon} from './src/components/StudioIcon'
import './sanity.css'

// Environment variables for project configuration
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'your-projectID'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

// URL for preview functionality, defaults to localhost:3000 if not set
const SANITY_STUDIO_PREVIEW_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'

// Define the home location for the presentation tool
const homeLocation = {
  title: 'Home',
  href: '/',
} satisfies DocumentLocation

// resolveHref() is a convenience function that resolves the URL
// path for different document types and used in the presentation tool.
function resolveHref(documentType?: string, slug?: string, id?: string): string | undefined {
  switch (documentType) {
    case 'post':
      return slug ? `/posts/${slug}` : undefined
    case 'page':
      return slug ? `/${slug}` : undefined
    case 'sectionTemplate':
      return id ? `/preview/template/${id}` : undefined
    default:
      console.warn('Invalid document type:', documentType)
      return undefined
  }
}

// Main Sanity configuration
export default defineConfig({
  name: 'default',
  title: 'Mast Sanity',
  icon: StudioIcon,

  projectId,
  dataset,

  plugins: [
    // Presentation tool configuration for Visual Editing
    presentationTool({
      previewUrl: {
        origin: SANITY_STUDIO_PREVIEW_URL,
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
      // Custom header with page navigator
      components: {
        unstable_header: {
          component: PageNavigator,
        },
      },
      resolve: {
        // The Main Document Resolver API provides a method of resolving a main document from a given route or route pattern. https://www.sanity.io/docs/presentation-resolver-api#57720a5678d9
        mainDocuments: defineDocuments([
          {
            route: '/',
            filter: `_type == "settings" && _id == "siteSettings"`,
          },
          {
            route: '/:slug',
            filter: `_type == "page" && slug.current == $slug || _id == $slug`,
          },
          {
            route: '/posts/:slug',
            filter: `_type == "post" && slug.current == $slug || _id == $slug`,
          },
          {
            route: '/preview/template/:id',
            filter: `_type == "sectionTemplate" && _id == $id`,
          },
        ]),
        // Locations Resolver API allows you to define where data is being used in your application. https://www.sanity.io/docs/presentation-resolver-api#8d8bca7bfcd7
        locations: {
          settings: defineLocations({
            locations: [homeLocation],
            message: 'This document is used on all pages',
            tone: 'positive',
          }),
          page: defineLocations({
            select: {
              name: 'name',
              slug: 'slug.current',
            },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.name || 'Untitled',
                  href: resolveHref('page', doc?.slug)!,
                },
              ],
            }),
          }),
          post: defineLocations({
            select: {
              title: 'title',
              slug: 'slug.current',
            },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled',
                  href: resolveHref('post', doc?.slug)!,
                },
                {
                  title: 'Home',
                  href: '/',
                } satisfies DocumentLocation,
              ].filter(Boolean) as DocumentLocation[],
            }),
          }),
          sectionTemplate: defineLocations({
            select: {
              name: 'name',
              id: '_id',
              isGlobal: 'isGlobal',
            },
            resolve: (doc) => {
              // Hide locations panel for global sections (usage shown in custom banner instead)
              if (doc?.isGlobal) {
                return null
              }
              // Show preview location for prefill templates
              return {
                locations: [
                  {
                    title: `${doc?.name || 'Untitled Template'} (Preview)`,
                    href: resolveHref('sectionTemplate', undefined, doc?.id)!,
                  },
                ],
                message: 'Preview this template',
                tone: 'positive',
              }
            },
          }),
        },
      },
    }),
    structureTool({
      structure, // Custom studio structure configuration, imported from ./src/structure.ts
    }),
    // Additional plugins for enhanced functionality
    codeInput(),
    unsplashImageAsset(),
    assist(),
    visionTool(),
    claudeAssistant({
      apiEndpoint: `${SANITY_STUDIO_PREVIEW_URL}/api/claude`,
    }),
    pinboard({
      previewOrigin: SANITY_STUDIO_PREVIEW_URL,
    }),
  ],

  // Schema configuration, imported from ./src/schemaTypes/index.ts
  schema: {
    types: schemaTypes,
    // Initial value templates for section templates
    // These auto-set isGlobal based on which folder you create from
    templates: (prev) => [
      ...prev,
      {
        id: 'sectionTemplate-prefill',
        title: 'Prefill Template',
        schemaType: 'sectionTemplate',
        value: {isGlobal: false},
      },
      {
        id: 'sectionTemplate-global',
        title: 'Global Section',
        schemaType: 'sectionTemplate',
        value: {isGlobal: true},
      },
    ],
  },

  // Filter out Claude assistant document types from "Create new document" menu
  document: {
    newDocumentOptions: (prev) =>
      prev.filter(
        (item) =>
          !['claudeConversation', 'claudeInstructions', 'pinboard'].includes(item.templateId)
      ),
  },

  // Studio UI customization - add floating Claude chat across all tools
  studio: {
    components: {
      layout: createStudioLayout({
        apiEndpoint: `${SANITY_STUDIO_PREVIEW_URL}/api/claude`,
      }),
    },
  },
})
