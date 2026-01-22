import {CommentIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {format, parseISO} from 'date-fns'

/**
 * Claude Conversation schema.
 * Stores chat conversations between users and the Claude assistant.
 */

// Action object for tracking document operations
const actionObject = defineArrayMember({
  name: 'action',
  title: 'Action',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Create', value: 'create'},
          {title: 'Update', value: 'update'},
          {title: 'Delete', value: 'delete'},
          {title: 'Publish', value: 'publish'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'documentId',
      title: 'Document ID',
      type: 'string',
    }),
    defineField({
      name: 'documentType',
      title: 'Document Type',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Success', value: 'success'},
          {title: 'Failed', value: 'failed'},
        ],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'error',
      title: 'Error',
      type: 'text',
      description: 'Error message if the action failed',
    }),
  ],
  preview: {
    select: {
      type: 'type',
      documentType: 'documentType',
      status: 'status',
    },
    prepare({type, documentType, status}) {
      return {
        title: `${type} ${documentType || 'document'}`,
        subtitle: status,
      }
    },
  },
})

// Message object for conversation messages
const messageObject = defineArrayMember({
  name: 'message',
  title: 'Message',
  type: 'object',
  fields: [
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          {title: 'User', value: 'user'},
          {title: 'Assistant', value: 'assistant'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'actions',
      title: 'Actions',
      type: 'array',
      description: 'Document operations performed by this message',
      of: [actionObject],
    }),
  ],
  preview: {
    select: {
      role: 'role',
      content: 'content',
      timestamp: 'timestamp',
    },
    prepare({role, content, timestamp}) {
      const truncatedContent = content?.length > 50 ? `${content.substring(0, 50)}...` : content
      return {
        title: role === 'user' ? 'User' : 'Claude',
        subtitle: truncatedContent,
        media: role === 'user' ? undefined : CommentIcon,
      }
    },
  },
})

export const claudeConversation = defineType({
  name: 'claudeConversation',
  title: 'Claude Conversation',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'A descriptive title for this conversation',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      description: 'The ID of the user who owns this conversation',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'messages',
      title: 'Messages',
      type: 'array',
      of: [messageObject],
    }),
    defineField({
      name: 'lastActivity',
      title: 'Last Activity',
      type: 'datetime',
      description: 'Timestamp of the last message in this conversation',
      readOnly: true,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'Whether this conversation is archived',
      initialValue: false,
    }),
    defineField({
      name: 'workflowIds',
      title: 'Workflow IDs',
      type: 'array',
      description: 'IDs of workflows applied to this conversation',
      of: [{type: 'string'}],
      hidden: true,
    }),
  ],
  orderings: [
    {
      title: 'Last Activity (Newest First)',
      name: 'lastActivityDesc',
      by: [{field: 'lastActivity', direction: 'desc'}],
    },
    {
      title: 'Last Activity (Oldest First)',
      name: 'lastActivityAsc',
      by: [{field: 'lastActivity', direction: 'asc'}],
    },
    {
      title: 'Title (A-Z)',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      lastActivity: 'lastActivity',
      messages: 'messages',
      archived: 'archived',
    },
    prepare({title, lastActivity, messages, archived}) {
      const messageCount = messages?.length || 0
      const lastActivityFormatted = lastActivity
        ? format(parseISO(lastActivity), 'MMM d, yyyy h:mm a')
        : 'No activity'

      return {
        title: archived ? `[Archived] ${title}` : title,
        subtitle: `${messageCount} messages - ${lastActivityFormatted}`,
        media: CommentIcon,
      }
    },
  },
})
