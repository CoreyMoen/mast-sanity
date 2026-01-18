import {BlockElementIcon, BoltIcon, BookIcon, CogIcon, DocumentIcon, EditIcon, FolderIcon, MenuIcon, RobotIcon} from '@sanity/icons'
import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import pluralize from 'pluralize-esm'

/**
 * Structure builder is useful whenever you want to control how documents are grouped and
 * listed in the studio or for adding additional in-studio previews or content to documents.
 * Learn more: https://www.sanity.io/docs/structure-builder-introduction
 */

/**
 * Document types to exclude from auto-generated lists
 * These are either singletons, internal types, or handled in custom groups
 */
const DISABLED_TYPES = [
  'settings',
  'navigation',
  'footer',
  'assist.instruction.context',
  // Claude Assistant schemas - grouped under Claude Settings folder
  'claudeConversation',
  'claudeInstructions',
  'claudeApiSettings',
  'claudeQuickAction',
  'claudeWorkflow',
  // Handled in custom groups
  'page',
  'post',
  'person',
]

export const structure: StructureResolver = (S: StructureBuilder, context) =>
  S.list()
    .title('Content')
    .items([
      // ═══════════════════════════════════════════════════════════════════
      // CONTENT
      // ═══════════════════════════════════════════════════════════════════

      // Pages with drag-and-drop ordering
      orderableDocumentListDeskItem({
        type: 'page',
        title: 'Pages',
        icon: DocumentIcon,
        S,
        context,
      }),

      // Collections folder (Posts, People)
      S.listItem()
        .id('collections')
        .title('Collections')
        .icon(FolderIcon)
        .child(
          S.list()
            .id('collectionsList')
            .title('Collections')
            .items([
              S.documentTypeListItem('post').title('Posts'),
              S.documentTypeListItem('person').title('People'),
            ])
        ),

      S.divider(),

      // ═══════════════════════════════════════════════════════════════════
      // GLOBAL COMPONENTS
      // ═══════════════════════════════════════════════════════════════════

      // Navigation Singleton
      S.listItem()
        .title('Navigation')
        .child(S.document().schemaType('navigation').documentId('navigation'))
        .icon(MenuIcon),

      // Footer Singleton
      S.listItem()
        .title('Footer')
        .child(S.document().schemaType('footer').documentId('footer'))
        .icon(BlockElementIcon),

      S.divider(),

      // ═══════════════════════════════════════════════════════════════════
      // SETTINGS
      // ═══════════════════════════════════════════════════════════════════

      // Site Settings Singleton
      S.listItem()
        .title('Site Settings')
        .child(S.document().schemaType('settings').documentId('siteSettings'))
        .icon(CogIcon),

      // Claude Settings - AI Assistant configuration
      S.listItem()
        .id('claudeSettings')
        .title('Claude Settings')
        .icon(RobotIcon)
        .child(
          S.list()
            .id('claudeSettingsList')
            .title('Claude Settings')
            .items([
              // API Settings Singleton
              S.listItem()
                .id('claudeApiSettings')
                .title('API Settings')
                .child(S.document().schemaType('claudeApiSettings').documentId('claudeApiSettings'))
                .icon(CogIcon),
              // Instructions Singleton
              S.listItem()
                .id('claudeInstructions')
                .title('Instructions')
                .child(S.document().schemaType('claudeInstructions').documentId('claudeInstructions'))
                .icon(BookIcon),
              // Quick Actions List
              S.listItem()
                .id('claudeQuickActions')
                .title('Quick Actions')
                .child(S.documentTypeList('claudeQuickAction').title('Quick Actions'))
                .icon(EditIcon),
              // Workflows List
              S.listItem()
                .id('claudeWorkflows')
                .title('Workflows')
                .child(S.documentTypeList('claudeWorkflow').title('Workflows'))
                .icon(BoltIcon),
            ])
        ),
    ])
