# Claude Assistant Slack App Specification

This document outlines how to build a Slack app that integrates with the Remote Claude API to enable content creation in Sanity CMS directly from Slack.

## Overview

The goal is to create a Slack app that allows users to:
- Create, update, and query Sanity content via natural language in Slack
- Have multi-turn conversations with Claude for complex content tasks
- Receive links to created/updated content in Sanity Studio
- Use the same instructions and workflows as the in-Studio Claude Assistant

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Slack Workspace                         │
│                                                                 │
│   User: "Create a landing page for Q1 campaign"                │
│                            │                                    │
│                            ▼                                    │
│   ┌─────────────────────────────────────────┐                  │
│   │      Slack Agents & AI Apps Interface    │                  │
│   │   (DMs, @mentions, /ask-claude command)  │                  │
│   └─────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Slack Bolt App (Bridge)                      │
│                                                                 │
│   • Receives message events from Slack                          │
│   • Manages conversation history per thread                     │
│   • Calls Remote Claude API                                     │
│   • Formats and streams response back to Slack                  │
│   • Posts links to created documents                            │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Remote Claude API (Already Built)                  │
│         /api/claude/remote on your Next.js server               │
│                                                                 │
│   • Receives message + conversationHistory                      │
│   • Builds prompt with Sanity schema context                    │
│   • Calls Claude via Anthropic API                              │
│   • Executes Sanity CRUD operations                             │
│   • Returns response + action results + studio links            │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                     ┌───────────────┐
                     │  Sanity CMS   │
                     └───────────────┘
```

## Recommended Approach: Slack Bolt Framework

Slack has an official "Agents & AI Apps" feature that provides a dedicated conversational interface. Combined with the Bolt framework, this is the best approach.

### Why Bolt + Agents & AI Apps?

1. **Official Slack Sample** - Slack maintains [bolt-python-ai-chatbot](https://github.com/slack-samples/bolt-python-ai-chatbot) that demonstrates this exact pattern
2. **Rich UX** - Loading states, streaming messages, suggested prompts
3. **Thread Support** - Maintains conversation context per thread
4. **Multiple Entry Points** - DMs, @mentions, slash commands
5. **Your API Does the Heavy Lifting** - The Bolt app is just a bridge

### Plan Requirements

- A paid Slack plan is required for the Agents & AI Apps feature
- Free sandbox available via [Slack Developer Program](https://api.slack.com/developer-program)

---

## Implementation Guide

### Phase 1: Create the Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From scratch" and give it a name (e.g., "Claude Sanity Assistant")
3. Select your workspace

### Phase 2: Enable Agents & AI Apps Feature

1. In the left sidebar, click **Agents & AI Apps**
2. Toggle the feature **ON**
3. Add an overview description (e.g., "Create and manage Sanity CMS content with Claude")
4. Configure suggested prompts:
   - "Create a landing page for..."
   - "List all pages in Sanity"
   - "Update the homepage hero section"
5. Save changes

### Phase 3: Configure OAuth Scopes

Navigate to **OAuth & Permissions** and add these Bot Token Scopes:

```
assistant:write      # Required for AI apps
chat:write          # Send messages
im:history          # Read DM history
im:read             # Access DMs
im:write            # Send DMs
channels:history    # Read channel messages (if using @mentions)
groups:history      # Read private channel messages
users:read          # Get user info
```

### Phase 4: Enable Events

Navigate to **Event Subscriptions**:

1. Toggle **Enable Events** ON
2. Add these **Bot Events**:
   - `assistant_thread_started` - When user starts conversation
   - `assistant_thread_context_changed` - When context changes
   - `message.im` - Direct messages to the bot
   - `app_mention` - When @mentioned in channels (optional)

### Phase 5: Create the Bolt App

Choose either **Python** or **JavaScript** (Node.js):

#### Option A: Python (Bolt for Python)

```bash
# Create project directory
mkdir claude-slack-app && cd claude-slack-app

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install slack-bolt requests python-dotenv
```

Create `app.py`:

```python
import os
import requests
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
from dotenv import load_dotenv

load_dotenv()

# Initialize the Bolt app
app = App(token=os.environ["SLACK_BOT_TOKEN"])

# Store conversation history per thread
conversation_store = {}

# Remote Claude API configuration
CLAUDE_API_URL = os.environ.get("CLAUDE_API_URL", "http://localhost:4000/api/claude/remote")
CLAUDE_API_SECRET = os.environ["CLAUDE_REMOTE_API_SECRET"]


def get_conversation_history(thread_ts: str) -> list:
    """Get conversation history for a thread."""
    return conversation_store.get(thread_ts, [])


def add_to_history(thread_ts: str, role: str, content: str):
    """Add a message to conversation history."""
    if thread_ts not in conversation_store:
        conversation_store[thread_ts] = []
    conversation_store[thread_ts].append({"role": role, "content": content})
    # Keep last 20 messages to avoid context overflow
    conversation_store[thread_ts] = conversation_store[thread_ts][-20:]


def call_remote_claude_api(message: str, conversation_history: list) -> dict:
    """Call the Remote Claude API."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CLAUDE_API_SECRET}"
    }

    payload = {
        "message": message,
        "conversationHistory": conversation_history,
        "dryRun": False  # Set to True for testing
    }

    response = requests.post(CLAUDE_API_URL, json=payload, headers=headers)
    return response.json()


def format_slack_response(api_response: dict) -> str:
    """Format the API response for Slack."""
    parts = []

    # Add Claude's text response
    if api_response.get("response"):
        parts.append(api_response["response"])

    # Add summary of actions
    summary = api_response.get("summary", {})
    if summary.get("totalActions", 0) > 0:
        parts.append("\n---")
        parts.append(f"*Actions:* {summary['successfulActions']}/{summary['totalActions']} successful")

        if summary.get("createdDocuments"):
            parts.append(f"*Created:* {len(summary['createdDocuments'])} document(s)")
        if summary.get("updatedDocuments"):
            parts.append(f"*Updated:* {len(summary['updatedDocuments'])} document(s)")

    # Add links to Sanity Studio
    studio_links = api_response.get("studioLinks", [])
    if studio_links:
        parts.append("\n*View in Sanity Studio:*")
        for link in studio_links:
            parts.append(f"• <{link['structureUrl']}|{link['documentType']}: {link['documentId']}>")

    return "\n".join(parts)


# Handle assistant thread started event
@app.event("assistant_thread_started")
def handle_thread_started(event, say, client):
    """Handle when a user starts a new conversation."""
    thread_ts = event.get("assistant_thread", {}).get("thread_ts")

    # Set initial status
    client.assistant_threads_setStatus(
        thread_ts=thread_ts,
        status="Ready to help with Sanity content!"
    )


# Handle messages in assistant threads
@app.event("message")
def handle_message(event, say, client, logger):
    """Handle incoming messages."""
    # Skip bot messages
    if event.get("bot_id"):
        return

    text = event.get("text", "")
    thread_ts = event.get("thread_ts") or event.get("ts")
    channel = event.get("channel")

    if not text:
        return

    try:
        # Set loading status
        client.assistant_threads_setStatus(
            thread_ts=thread_ts,
            status="Thinking..."
        )

        # Get conversation history
        history = get_conversation_history(thread_ts)

        # Call Remote Claude API
        api_response = call_remote_claude_api(text, history)

        if api_response.get("success"):
            # Add to history
            add_to_history(thread_ts, "user", text)
            add_to_history(thread_ts, "assistant", api_response.get("response", ""))

            # Format and send response
            formatted_response = format_slack_response(api_response)
            say(text=formatted_response, thread_ts=thread_ts)
        else:
            error_msg = api_response.get("error", "An error occurred")
            say(text=f"Sorry, something went wrong: {error_msg}", thread_ts=thread_ts)

        # Clear status
        client.assistant_threads_setStatus(
            thread_ts=thread_ts,
            status=""
        )

    except Exception as e:
        logger.error(f"Error handling message: {e}")
        say(text="Sorry, I encountered an error. Please try again.", thread_ts=thread_ts)


# Handle app mentions (optional - for channel usage)
@app.event("app_mention")
def handle_mention(event, say, client, logger):
    """Handle @mentions of the bot."""
    # Remove the @mention from the text
    text = event.get("text", "")
    # The text includes the mention, extract just the message
    # e.g., "<@U123ABC456> create a page" -> "create a page"
    text = " ".join(text.split()[1:])

    thread_ts = event.get("thread_ts") or event.get("ts")
    channel = event.get("channel")

    if not text:
        say(text="Hi! How can I help you with Sanity content today?", thread_ts=thread_ts)
        return

    try:
        # Get conversation history for this thread
        history = get_conversation_history(thread_ts)

        # Call Remote Claude API
        api_response = call_remote_claude_api(text, history)

        if api_response.get("success"):
            add_to_history(thread_ts, "user", text)
            add_to_history(thread_ts, "assistant", api_response.get("response", ""))

            formatted_response = format_slack_response(api_response)
            say(text=formatted_response, thread_ts=thread_ts)
        else:
            error_msg = api_response.get("error", "An error occurred")
            say(text=f"Sorry, something went wrong: {error_msg}", thread_ts=thread_ts)

    except Exception as e:
        logger.error(f"Error handling mention: {e}")
        say(text="Sorry, I encountered an error. Please try again.", thread_ts=thread_ts)


if __name__ == "__main__":
    # Use Socket Mode for development
    handler = SocketModeHandler(app, os.environ["SLACK_APP_TOKEN"])
    print("⚡️ Claude Sanity Assistant is running!")
    handler.start()
```

Create `.env`:

```bash
# Slack credentials
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

# Remote Claude API
CLAUDE_API_URL=https://your-domain.com/api/claude/remote
CLAUDE_REMOTE_API_SECRET=your-secret-key
```

#### Option B: JavaScript (Bolt for JavaScript)

```bash
# Create project directory
mkdir claude-slack-app && cd claude-slack-app
npm init -y

# Install dependencies
npm install @slack/bolt dotenv
```

Create `app.js`:

```javascript
const { App, Assistant } = require('@slack/bolt');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Conversation history store
const conversationStore = new Map();

// Remote Claude API configuration
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'http://localhost:4000/api/claude/remote';
const CLAUDE_API_SECRET = process.env.CLAUDE_REMOTE_API_SECRET;

async function callRemoteClaudeAPI(message, conversationHistory) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLAUDE_API_SECRET}`,
    },
    body: JSON.stringify({
      message,
      conversationHistory,
      dryRun: false,
    }),
  });
  return response.json();
}

function formatSlackResponse(apiResponse) {
  const parts = [];

  if (apiResponse.response) {
    parts.push(apiResponse.response);
  }

  const summary = apiResponse.summary || {};
  if (summary.totalActions > 0) {
    parts.push('\n---');
    parts.push(`*Actions:* ${summary.successfulActions}/${summary.totalActions} successful`);

    if (summary.createdDocuments?.length) {
      parts.push(`*Created:* ${summary.createdDocuments.length} document(s)`);
    }
    if (summary.updatedDocuments?.length) {
      parts.push(`*Updated:* ${summary.updatedDocuments.length} document(s)`);
    }
  }

  const studioLinks = apiResponse.studioLinks || [];
  if (studioLinks.length) {
    parts.push('\n*View in Sanity Studio:*');
    for (const link of studioLinks) {
      parts.push(`• <${link.structureUrl}|${link.documentType}: ${link.documentId}>`);
    }
  }

  return parts.join('\n');
}

// Set up the Assistant using Bolt's Assistant class
const assistant = new Assistant({
  threadStarted: async ({ say, setStatus }) => {
    await setStatus('Ready to help with Sanity content!');
  },

  threadContextChanged: async ({ say, setStatus }) => {
    // Handle context changes if needed
  },

  userMessage: async ({ message, say, setStatus, context }) => {
    const threadTs = message.thread_ts || message.ts;
    const text = message.text;

    try {
      await setStatus('Thinking...');

      // Get conversation history
      const history = conversationStore.get(threadTs) || [];

      // Call Remote Claude API
      const apiResponse = await callRemoteClaudeAPI(text, history);

      if (apiResponse.success) {
        // Update history
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: apiResponse.response || '' });
        conversationStore.set(threadTs, history.slice(-20)); // Keep last 20

        // Send response
        const formatted = formatSlackResponse(apiResponse);
        await say(formatted);
      } else {
        await say(`Sorry, something went wrong: ${apiResponse.error || 'Unknown error'}`);
      }

      await setStatus('');
    } catch (error) {
      console.error('Error handling message:', error);
      await say('Sorry, I encountered an error. Please try again.');
    }
  },
});

app.assistant(assistant);

// Handle @mentions in channels (optional)
app.event('app_mention', async ({ event, say, client }) => {
  const text = event.text.split(' ').slice(1).join(' ');
  const threadTs = event.thread_ts || event.ts;

  if (!text) {
    await say({ text: 'Hi! How can I help you with Sanity content today?', thread_ts: threadTs });
    return;
  }

  try {
    const history = conversationStore.get(threadTs) || [];
    const apiResponse = await callRemoteClaudeAPI(text, history);

    if (apiResponse.success) {
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: apiResponse.response || '' });
      conversationStore.set(threadTs, history.slice(-20));

      await say({ text: formatSlackResponse(apiResponse), thread_ts: threadTs });
    } else {
      await say({ text: `Sorry, something went wrong: ${apiResponse.error}`, thread_ts: threadTs });
    }
  } catch (error) {
    console.error('Error:', error);
    await say({ text: 'Sorry, I encountered an error.', thread_ts: threadTs });
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Claude Sanity Assistant is running!');
})();
```

### Phase 6: Enable Socket Mode

1. Navigate to **Socket Mode** in the left sidebar
2. Toggle **Enable Socket Mode** ON
3. Generate an app-level token with `connections:write` scope
4. Save the token as `SLACK_APP_TOKEN`

### Phase 7: Install the App

1. Go to **Install App** in the left sidebar
2. Click **Install to Workspace**
3. Authorize the requested permissions
4. Copy the **Bot User OAuth Token** as `SLACK_BOT_TOKEN`

### Phase 8: Run and Test

```bash
# Python
python app.py

# JavaScript
node app.js
```

Test by:
1. Opening the app in Slack's sidebar (Agents & AI Apps)
2. Typing "List all pages in Sanity"
3. Or @mention the bot in a channel

---

## Production Deployment

### Hosting Options

1. **Same Server** - Run the Bolt app alongside your Next.js app
2. **Separate Service** - Deploy to Heroku, Railway, Render, or AWS Lambda
3. **Serverless** - Use AWS Lambda with Slack's HTTP mode (instead of Socket Mode)

### Environment Variables for Production

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...  # For HTTP mode

# Remote Claude API
CLAUDE_API_URL=https://your-production-domain.com/api/claude/remote
CLAUDE_REMOTE_API_SECRET=your-production-secret

# Optional
NODE_ENV=production
```

### Switching to HTTP Mode (for Serverless)

Instead of Socket Mode, you can use HTTP endpoints:

1. Disable Socket Mode in app settings
2. Set up a Request URL for events (e.g., `https://your-app.com/slack/events`)
3. Use `@slack/bolt` with `receiver` configuration for Express/Lambda

---

## Advanced Features

### Add Slash Commands

1. Navigate to **Slash Commands** in app settings
2. Create a command like `/claude` or `/sanity`
3. Add handler:

```python
@app.command("/claude")
def handle_claude_command(ack, respond, command):
    ack()
    text = command.get("text", "")

    if not text:
        respond("Please provide a message. Example: `/claude Create a blog post about AI`")
        return

    # Call API and respond
    api_response = call_remote_claude_api(text, [])
    respond(format_slack_response(api_response))
```

### Add Workflow Builder Step

You can expose the app as a custom step in Slack Workflow Builder:

```python
from slack_bolt.workflows.step import WorkflowStep

ws = WorkflowStep(
    callback_id="claude_sanity_action",
    edit=edit_handler,
    save=save_handler,
    execute=execute_handler,
)
app.step(ws)
```

### Dry Run Mode Toggle

Add a button or slash command option for dry-run mode:

```python
@app.command("/claude-preview")
def handle_preview_command(ack, respond, command):
    ack()
    text = command.get("text", "")

    # Call with dryRun: True
    payload = {"message": text, "dryRun": True}
    # ... rest of implementation
```

---

## Security Considerations

1. **API Secret** - Keep `CLAUDE_REMOTE_API_SECRET` secure
2. **Rate Limiting** - The Remote API already has rate limiting (30 req/min by default)
3. **User Validation** - Consider restricting which Slack users can use the bot
4. **Workspace Restriction** - Don't distribute publicly; keep it org-private

---

## Resources

- [Slack Bolt for Python](https://slack.dev/bolt-python/tutorial/getting-started)
- [Slack Bolt for JavaScript](https://slack.dev/bolt-js/tutorial/getting-started)
- [Slack AI Apps Documentation](https://docs.slack.dev/ai/)
- [bolt-python-ai-chatbot Sample](https://github.com/slack-samples/bolt-python-ai-chatbot)
- [Building AI Apps Workshop](https://slack.dev/workshop/build-ai-assistant-slack-boltjs/)

---

## Quick Reference: Remote Claude API

### Endpoint
```
POST /api/claude/remote
Authorization: Bearer <CLAUDE_REMOTE_API_SECRET>
Content-Type: application/json
```

### Request Body
```json
{
  "message": "Create a landing page with a hero section",
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "dryRun": false,
  "workflow": "content-creation",  // optional
  "includeInstructions": ["writing", "design"],  // optional
  "context": {
    "documents": ["page-123"],  // optional document IDs for context
    "additionalContext": "Extra info"  // optional
  }
}
```

### Response
```json
{
  "success": true,
  "response": "I've created a landing page with a hero section...",
  "actions": [...],
  "summary": {
    "totalActions": 1,
    "successfulActions": 1,
    "failedActions": 0,
    "createdDocuments": ["drafts.page-abc123"],
    "updatedDocuments": [],
    "deletedDocuments": []
  },
  "studioLinks": [
    {
      "documentId": "drafts.page-abc123",
      "documentType": "page",
      "structureUrl": "https://studio.sanity.io/...",
      "presentationUrl": "https://..."
    }
  ],
  "metadata": {
    "processingTime": 3200,
    "model": "claude-sonnet-4-20250514",
    "dryRun": false
  }
}
```
