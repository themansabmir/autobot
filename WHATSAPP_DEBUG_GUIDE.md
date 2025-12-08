# WhatsApp Session Debugging Guide

## What We've Added

We've added comprehensive debug logging throughout the WhatsApp flow to trace:
1. When sessions are created
2. What state they have
3. The complete flow from initial message to state persistence

## Log Emoji Guide

- 📨 **Incoming message** - WhatsApp webhook received
- 🔍 **Session lookup** - Checking if session exists
- 🔄 **Placeholder session** - Session created without state (for concurrency control)
- 🆕 **New session** - Starting a brand new WhatsApp session
- 🔄 **Continue flow** - Resuming existing conversation
- 💾 **Saving state** - Persisting state to database
- ✅ **Success** - Operation completed
- ❌ **Error** - Problem detected
- 🗑️ **Deletion** - Session being deleted (conversation completed)

## Expected Flow for First Message

When you initiate a chat for the first time:

```
1. 📨 resumeWhatsAppFlow called
   - sessionId: wa-{phoneNumberId}-{yourNumber}
   - messageCount: 1
   - messageTypes: ["text"]

2. 🔍 Fetching session with ID: wa-...
   - exists: false (no session yet)

3. 🆕 Starting new WhatsApp session
   - hasState: false
   - workspaceId: your-workspace-id
   - contactName: your-name

4. 💾 Saving state to database
   - hasInput: true/false (depends on bot flow)
   - currentBlockId: xxx
   - typebotId: xxx

5. 🔄 Updating existing session: wa-...
   - hasState: true ✅
   - currentBlockId: xxx
   - isReplying: false

6. ✅ State saved to database successfully
```

## Expected Flow for Reply

When you send a reply:

```
1. 📨 resumeWhatsAppFlow called
   - sessionId: wa-{phoneNumberId}-{yourNumber}
   - messageCount: 1

2. 🔍 Fetching session with ID: wa-...
   - exists: true ✅
   - hasState: true ✅
   - currentBlockId: xxx

3. 🔄 Continuing existing bot flow
   - currentBlockId: xxx

4. 💾 Saving state to database
   - currentBlockId: yyy (next block)

5. ✅ State saved to database successfully
```

## Problem Scenario (What You're Experiencing)

```
1. 📨 resumeWhatsAppFlow called

2. 🔍 Fetching session with ID: wa-...
   - exists: true ✅
   - hasState: false ❌ <-- PROBLEM!
   - isReplying: true

3. ❌ Session exists but has no state - throwing error
   ERROR: "Session is empty. Most likely in reply state."
```

## What to Look For

### Scenario 1: Race Condition (Multiple Messages)
If you see:
```
🔄 Creating placeholder session (treat as unique message)
✅ Placeholder session created with isReplying=true, state=null
```
This means a placeholder session was created, and another message arrived before the state was saved.

### Scenario 2: Media Messages
If you see:
```
🔄 Creating placeholder session (first media in Redis)
```
This happens when you send images/videos/documents.

### Scenario 3: State Not Being Saved
Look for the sequence:
```
💾 Saving state to database
🔄 Updating existing session
✅ State saved to database successfully
```
If this is missing, the state was never persisted.

## How to Test

1. **Start your dev server** and watch the logs
2. **Send your first message** to the WhatsApp bot
3. **Wait for the bot to respond** completely
4. **Send your second message**
5. **Check the logs** for the flow above

## Key Questions to Answer

1. **Is the state being saved after the first message?**
   - Look for: `💾 Saving state to database` → `✅ State saved to database successfully`

2. **Is there a race condition?**
   - Look for: `🔄 Creating placeholder session` appearing before state is saved

3. **What is the sessionId?**
   - Should be: `wa-{phoneNumberId}-{yourPhoneNumber}`
   - Should be consistent across all messages

4. **Is the session being deleted prematurely?**
   - Look for: `🗑️ Deleting completed session`

## Next Steps

After running your test:
1. Share the complete log output
2. We'll analyze the flow
3. Identify exactly where the state is being lost
4. Fix the root cause
