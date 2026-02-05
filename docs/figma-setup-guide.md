# Figma Integration Setup Guide

This guide explains how to set up the Figma integration for the Claude Assistant plugin, enabling the ability to create Sanity pages from Figma designs.

## Prerequisites

- A Figma account with access to the designs you want to import
- Environment variable access for your deployment

## Step 1: Generate a Figma Personal Access Token

1. Log in to your Figma account
2. Go to **Settings** (click your profile icon → Settings)
3. Scroll down to **Personal access tokens**
4. Click **Generate new token**
5. Give your token a descriptive name (e.g., "Sanity Claude Assistant")
6. Copy the token immediately — you won't be able to see it again

> **Security Note:** Treat this token like a password. Anyone with this token can access your Figma files.

## Step 2: Configure Environment Variables

Add the following environment variable to your deployment:

```env
# Figma Personal Access Token
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Local Development

Add to your `.env.local` file in the `frontend/` directory:

```env
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

### Vercel Deployment

1. Go to your project in the Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add `FIGMA_ACCESS_TOKEN` with your token value
4. Redeploy for changes to take effect

### Other Platforms

Consult your platform's documentation for adding environment variables.

## Step 3: Ensure Sanity API Token is Configured

The Figma integration also needs a Sanity API token for uploading images. This should already be configured if you're using the Claude Assistant:

```env
# Required for image uploads
SANITY_API_TOKEN=skxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The token needs **write** permissions to upload assets.

## Step 4: Enable Figma on a Skill

1. Open Sanity Studio
2. Go to **Structure** → **Claude Skills**
3. Edit (or create) the skill you want to enable Figma for
4. Go to the **Integrations** tab
5. Enable **"Enable Figma Integration"**
6. Save the document

## Step 5: Configure Skill Instructions

For Claude to properly interpret your Figma designs, add component mapping instructions to your skill's **System Instructions** field.

See the example instructions template at: `docs/figma-skill-instructions.md`

This template includes:
- Component naming conventions to Sanity block type mappings
- Property mapping rules (colors, spacing, alignment)
- Image handling workflow
- Nesting depth constraints

Customize the mappings to match your Figma design system's naming conventions.

## Usage

Once configured, you can use the integration like this:

1. Select the Figma-enabled skill in Claude Assistant
2. Paste a Figma frame URL into the chat:
   ```
   Create a page from this Figma design:
   https://www.figma.com/design/ABC123/My-Design?node-id=1-234
   ```
3. Claude will fetch the frame data and interpret the structure
4. Images will be uploaded to Sanity automatically
5. The page will be created with all content and images

## Figma URL Formats

The integration supports these URL formats:

```
https://www.figma.com/design/{fileKey}/{fileName}?node-id={nodeId}
https://www.figma.com/file/{fileKey}/{fileName}?node-id={nodeId}
https://figma.com/design/{fileKey}?node-id={nodeId}
```

To get the correct URL:
1. Open your Figma file
2. Select the frame you want to import
3. Copy the URL from your browser (it should include `?node-id=...`)

## File Permissions

Your Figma Personal Access Token can only access files that your Figma account has access to:

- **Personal files**: Always accessible
- **Team files**: Accessible if you're a team member
- **Shared files**: Accessible if the file has been shared with you

If you get a "403 Access Denied" error, verify:
1. Your token is correct and not expired
2. You have access to the file in Figma
3. The file hasn't been moved or deleted

## Troubleshooting

### "FIGMA_ACCESS_TOKEN environment variable is not set"

The token is not configured or the server needs to be restarted after adding it.

### "Figma access denied" (403 error)

- Check that your token is correct
- Verify you have access to the file in Figma
- Regenerate the token if it may have been revoked

### "File or node not found" (404 error)

- Verify the URL is correct
- Ensure you've selected a specific frame (URL should have `?node-id=...`)
- The file may have been deleted or the node removed

### Images not uploading

- Verify `SANITY_API_TOKEN` is configured
- Check the token has write permissions
- Look for errors in the server logs

### Component mapping issues

- Review your skill's System Instructions
- Ensure Figma component names match the mapping table
- Check the frame data response to see actual component names

## Security Best Practices

1. **Use separate tokens** for development and production
2. **Rotate tokens** periodically (every 90 days recommended)
3. **Limit access** by using a Figma account with only necessary file access
4. **Never commit tokens** to version control — use environment variables
5. **Monitor usage** in Figma's activity log for unexpected access

## API Rate Limits

Figma's API has rate limits. If you're importing many designs:
- Space out requests
- Consider caching frame data for unchanged designs
- The integration handles rate limit errors gracefully

## Support

For issues specific to this integration:
- Check the browser console and server logs for error details
- Verify all environment variables are set correctly
- Review the skill instructions for proper component mappings
