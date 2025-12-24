import {defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const inlineVideoBlock = defineType({
  name: 'inlineVideoBlock',
  title: 'Inline Video',
  type: 'object',
  icon: PlayIcon,
  groups: [
    {name: 'video', title: 'Video', default: true},
    {name: 'appearance', title: 'Appearance'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fields: [
    // Video source
    defineField({
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      group: 'video',
      description: 'Upload an MP4 video file',
      options: {
        accept: 'video/mp4,video/webm',
      },
    }),
    defineField({
      name: 'videoUrl',
      title: 'Or Video URL',
      type: 'url',
      group: 'video',
      description: 'Direct URL to an MP4 video (used if no file is uploaded)',
    }),
    defineField({
      name: 'poster',
      title: 'Poster Image',
      type: 'image',
      group: 'video',
      description: 'Cover image shown before video plays',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Alternative text for accessibility',
        }),
      ],
    }),

    // Appearance
    defineField({
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'string',
      group: 'appearance',
      options: {
        list: [
          {title: '16:9 (Widescreen)', value: '16/9'},
          {title: '4:3 (Standard)', value: '4/3'},
          {title: '1:1 (Square)', value: '1/1'},
          {title: '9:16 (Vertical)', value: '9/16'},
          {title: '21:9 (Ultrawide)', value: '21/9'},
        ],
      },
      initialValue: '16/9',
    }),
    defineField({
      name: 'controlPosition',
      title: 'Control Button Position',
      type: 'string',
      group: 'appearance',
      options: {
        list: [
          {title: 'Bottom Right', value: 'bottom-right'},
          {title: 'Bottom Left', value: 'bottom-left'},
          {title: 'Top Right', value: 'top-right'},
          {title: 'Top Left', value: 'top-left'},
          {title: 'Center', value: 'center'},
        ],
      },
      initialValue: 'bottom-right',
    }),
    defineField({
      name: 'showControls',
      title: 'Show Play/Pause Button',
      type: 'boolean',
      group: 'appearance',
      initialValue: true,
    }),

    // Behavior
    defineField({
      name: 'autoplayOnScroll',
      title: 'Autoplay When In View',
      type: 'boolean',
      group: 'behavior',
      description: 'Automatically play video when scrolled into view',
      initialValue: true,
    }),
    defineField({
      name: 'loop',
      title: 'Loop Video',
      type: 'boolean',
      group: 'behavior',
      initialValue: true,
    }),
    defineField({
      name: 'muted',
      title: 'Muted',
      type: 'boolean',
      group: 'behavior',
      description: 'Videos must be muted for autoplay to work in most browsers',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      poster: 'poster',
      hasFile: 'videoFile.asset',
      hasUrl: 'videoUrl',
      aspectRatio: 'aspectRatio',
    },
    prepare({poster, hasFile, hasUrl, aspectRatio}) {
      const source = hasFile ? 'Uploaded file' : hasUrl ? 'External URL' : 'No video'
      return {
        title: 'Inline Video',
        subtitle: `${source} • ${aspectRatio || '16/9'}`,
        media: poster,
      }
    },
  },
})
