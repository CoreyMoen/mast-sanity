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
          {title: 'Query', value: 'query'},
          {title: 'Navigate', value: 'navigate'},
          {title: 'Explain', value: 'explain'},
          {title: 'Upload Image', value: 'uploadImage'},
          {title: 'Fetch Figma Frame', value: 'fetchFigmaFrame'},
          {title: 'Upload Figma Image', value: 'uploadFigmaImage'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Human-readable description of the action',
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
          {title: 'Executing', value: 'executing'},
          {title: 'Completed', value: 'completed'},
          {title: 'Failed', value: 'failed'},
          {title: 'Cancelled', value: 'cancelled'},
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
    defineField({
      name: 'payloadJson',
      title: 'Payload JSON',
      type: 'text',
      description: 'Full action payload as JSON',
      hidden: true,
    }),
    defineField({
      name: 'resultJson',
      title: 'Result JSON',
      type: 'text',
      description: 'Full action result as JSON',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      type: 'type',
      description: 'description',
      documentType: 'documentType',
      status: 'status',
    },
    prepare({type, description, documentType, status}) {
      return {
        title: description || `${type} ${documentType || 'document'}`,
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
      name: 'hidden',
      title: 'Hidden',
      type: 'boolean',
      description: 'Hidden messages are API context only, not shown in chat UI',
      hidden: true,
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
