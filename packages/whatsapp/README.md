# @typebot.io/whatsapp Package Analysis

## Overview

This package (`@typebot.io/whatsapp`) is the core integration layer between Typebot and the WhatsApp Cloud API. It handles the entire lifecycle of a WhatsApp conversation, from receiving webhooks to processing user input, managing session state, and sending responses back to the user.

It is designed to work within the Typebot monorepo and relies heavily on other workspace packages like `@typebot.io/bot-engine`, `@typebot.io/chat-session`, and `@typebot.io/prisma`.

## Architecture & Data Flow

The integration follows a webhook-driven architecture:

1.  **Webhook Reception**:
    - **Production**: `src/apiHandlers/handleProductionWebhookRequest.ts` receives webhooks from Meta.
    - **Preview**: `src/apiHandlers/handlePreviewWebhookRequest.ts` handles webhooks for the builder preview mode.

2.  **Processing Pipeline**:
    - Incoming payloads are parsed and validated using Zod schemas (`src/schemas.ts`).
    - **Message Aggregation**: Since WhatsApp sends media and text as separate messages (often in bursts), `resumeWhatsAppFlow.ts` uses **Redis** to debounce and aggregate these messages into a single "turn" to avoid the bot replying multiple times or missing context.

3.  **Session Management**:
    - Sessions are identified by a composite key: `wa-{phoneNumberId}-{fromPhoneNumber}`.
    - The package checks for an existing session in the database.
    - If no session exists, it attempts to start one via `startWhatsAppSession.ts`, checking against any "Start Conditions" defined in the Typebot settings.
    - If a session exists, it resumes the flow via `resumeWhatsAppFlow.ts`.

4.  **Bot Execution**:
    - The package converts WhatsApp-specific message formats into Typebot's internal `Message` format (`convertWhatsAppMessageToTypebotMessage` in `resumeWhatsAppFlow.ts`).
    - It invokes the core bot engine (`@typebot.io/bot-engine`) to process the input and determine the next steps.

5.  **Response Generation**:
    - The bot's response (blocks) is converted back into WhatsApp-compatible messages (Text, Interactive Buttons, etc.) via `sendChatReplyToWhatsApp.ts` and `convertInputToWhatsAppMessage.ts`.
    - Messages are sent to the WhatsApp API using `ky` for HTTP requests.

## Key Components Breakdown

### 1. `src/resumeWhatsAppFlow.ts` (The Orchestrator)
This is the most critical file. It handles:
- **Concurrency**: Uses Redis to lock/aggregate messages (`aggregateParallelMediaMessagesIfRedisEnabled`).
- **Session Retrieval**: Fetches the current state of the conversation.
- **Flow Execution**: Calls `continueBotFlow` or `startWhatsAppSession`.
- **State Saving**: Persists the new state to the database after processing.

### 2. `src/startWhatsAppSession.ts`
- Responsible for initiating a new conversation.
- Evaluates **Start Conditions** (e.g., "Only start if message contains 'Hello'") to decide which Typebot to trigger if multiple are connected to the same number.

### 3. `src/sendChatReplyToWhatsApp.ts`
- Takes the bot's output (bubbles, inputs) and sends them to the user.
- Handles **Typing Emulation**: Adds delays to mimic human typing.
- Manages **Client-Side Actions**: Handles logic that needs to happen "client-side" (like waiting or redirects), although in the context of WhatsApp, this is simulated server-side.

### 4. `src/convertInputToWhatsAppMessage.ts`
- Converts Typebot Input blocks into WhatsApp Interactive Messages.
- **Important**: Handles the strict constraints of WhatsApp API, such as:
    - **Button Titles**: Must be unique and under 20 characters (`trimTextTo20Chars`).
    - **List Messages**: Used when options exceed button limits.
    - **Media Uploads**: Uploads images/videos to WhatsApp servers (`getOrUploadMedia.ts`) so they can be sent as attachments.

### 5. `src/schemas.ts`
- Contains Zod definitions for all WhatsApp Webhook objects and API payloads.
- Essential for understanding the exact structure of data expected from Meta.

## Critical Concepts & Gotchas

### Media Handling & Redis
WhatsApp sends media messages (images, audio) separately from text. If a user sends an image with a caption, it arrives as two webhooks.
- **The Solution**: This package uses Redis to "hold" the first message for a few seconds (`INCOMING_MEDIA_MESSAGE_DEBOUNCE = 3000ms`) to see if another related message arrives.
- **Impact**: If Redis is down or not configured, the bot might treat an image and its caption as two separate inputs, potentially breaking the flow.

### Preview vs. Production
- **Preview Mode**: Uses a specific "System User Token" and a Test Phone Number ID defined in environment variables (`META_SYSTEM_USER_TOKEN`, `WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID`).
- **Production**: Uses the credentials stored in the database for the specific Typebot workspace.

### WhatsApp API Limits
- **Button Text**: Max 20 characters. The code attempts to truncate and uniquify these (`convertInputToWhatsAppMessage.ts`), but it's a common source of UI issues.
- **File Sizes**: There are strict limits on media file sizes for upload.

## Contribution Guide

1.  **Environment Setup**:
    - Ensure you have the necessary environment variables set up (see root `.env` example), specifically `META_SYSTEM_USER_TOKEN` if you are working on preview logic.
    - Redis is required for full functionality testing.

2.  **Testing**:
    - Run tests with `pnpm test` (uses Vitest).
    - `convertInputToWhatsAppMessage.test.ts` is a good place to look for examples of how inputs are transformed.

3.  **Adding New Features**:
    - **New Input Type**: Update `convertInputToWhatsAppMessage.ts` to handle the new block type.
    - **New Message Type**: Update `schemas.ts` to support the new incoming webhook structure and `resumeWhatsAppFlow.ts` to parse it.

4.  **Debugging**:
    - Use `console.log` or breakpoints in `handleProductionWebhookRequest.ts` to trace incoming webhooks.
    - Check Sentry logs for "Unknown WhatsApp errors".
