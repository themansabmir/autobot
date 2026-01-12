# 📦 Package Reference Guide

This document provides a comprehensive overview of all packages in the Typebot monorepo, their purpose, key exports, and usage examples.

## Table of Contents

1. [Core Packages](#core-packages)
2. [Block Packages](#block-packages)
3. [Integration Packages](#integration-packages)
4. [UI & Styling Packages](#ui--styling-packages)
5. [Utility Packages](#utility-packages)
6. [Embed Packages](#embed-packages)

---

## 🎯 Core Packages

### @typebot.io/bot-engine

**Purpose:** Core execution engine that runs bot logic

**Location:** `packages/bot-engine/`

**Key Exports:**
```typescript
// Main execution functions
export { startBotFlow } from './startBotFlow'
export { continueBotFlow } from './continueBotFlow'
export { executeBlock } from './executeBlock'

// Types
export type { SessionState, ExecuteBlockResult }
```

**Usage Example:**
```typescript
import { startBotFlow, continueBotFlow } from '@typebot.io/bot-engine'

// Start a new bot session
const session = await startBotFlow({
  typebot: publicTypebot,
  startParams: {
    userId: 'user-123'
  }
})

// Continue with user input
const result = await continueBotFlow({
  session,
  message: {
    type: 'text',
    text: 'Hello'
  }
})

console.log(result.messages) // Messages to display
console.log(result.newSessionState) // Updated session
```

**Key Files:**
- `src/startBotFlow.ts` - Initialize bot session
- `src/continueBotFlow.ts` - Process user input
- `src/executeBlock.ts` - Execute individual blocks
- `src/executeLogic.ts` - Evaluate conditions
- `src/blocks/` - Block execution handlers

---

### @typebot.io/prisma

**Purpose:** Database client and schema definitions

**Location:** `packages/prisma/`

**Key Exports:**
```typescript
export { prisma } from './src/client'
export * from '@prisma/client'
```

**Usage Example:**
```typescript
import { prisma } from '@typebot.io/prisma'

// Fetch typebot
const typebot = await prisma.typebot.findUnique({
  where: { id: 'typebot-123' },
  include: {
    workspace: true,
    results: true
  }
})

// Create result
const result = await prisma.result.create({
  data: {
    typebotId: 'typebot-123',
    variables: {},
    isCompleted: false
  }
})
```

**Schema Files:**
- `postgresql/schema.prisma` - PostgreSQL schema
- `mysql/schema.prisma` - MySQL schema (alternative)

**Key Models:**
- `User` - User accounts
- `Workspace` - Team/organization
- `Typebot` - Bot definition
- `PublicTypebot` - Published bot
- `Result` - User session
- `Answer` - User responses
- `ChatSession` - Active session state

---

### @typebot.io/schemas

**Purpose:** Zod schemas for validation

**Location:** `packages/schemas/`

**Key Exports:**
```typescript
export { typebotV6Schema } from './src/typebot'
export { resultSchema } from './src/result'
export { workspaceSchema } from './src/workspace'
```

**Usage Example:**
```typescript
import { typebotV6Schema } from '@typebot.io/schemas'

// Validate typebot structure
const result = typebotV6Schema.safeParse(data)

if (!result.success) {
  console.error('Invalid typebot:', result.error)
} else {
  console.log('Valid typebot:', result.data)
}
```

---

### @typebot.io/env

**Purpose:** Environment variable management

**Location:** `packages/env/`

**Key Exports:**
```typescript
export { env } from './src/env'
```

**Usage Example:**
```typescript
import { env } from '@typebot.io/env'

console.log(env.DATABASE_URL)
console.log(env.ENCRYPTION_SECRET)
console.log(env.NEXTAUTH_URL)
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `ENCRYPTION_SECRET` - For encrypting credentials
- `NEXTAUTH_URL` - App URL
- `NEXTAUTH_SECRET` - Auth secret
- `OPENAI_API_KEY` - OpenAI integration
- `STRIPE_SECRET_KEY` - Stripe payments
- And many more...

---

### @typebot.io/variables

**Purpose:** Variable parsing and evaluation

**Location:** `packages/variables/`

**Key Exports:**
```typescript
export { parseVariables } from './src/parseVariables'
export { evaluateExpression } from './src/evaluateExpression'
export { updateVariables } from './src/updateVariables'
```

**Usage Example:**
```typescript
import { parseVariables } from '@typebot.io/variables'

const text = 'Hello {{Name}}, your email is {{Email}}'
const variables = [
  { id: 'var-1', name: 'Name', value: 'John' },
  { id: 'var-2', name: 'Email', value: 'john@example.com' }
]

const parsed = parseVariables(text, variables)
// Result: "Hello John, your email is john@example.com"
```

---

## 🧩 Block Packages

### @typebot.io/blocks-core

**Purpose:** Base schemas and utilities for all blocks

**Location:** `packages/blocks/core/`

**Key Exports:**
```typescript
export { blockBaseSchema } from './src/schema'
export { BlockType } from './src/constants'
```

---

### @typebot.io/blocks-bubbles

**Purpose:** Bubble block types (text, image, video, audio, embed)

**Location:** `packages/blocks/bubbles/`

**Key Exports:**
```typescript
export { textBubbleSchema } from './src/text'
export { imageBubbleSchema } from './src/image'
export { videoBubbleSchema } from './src/video'
export { audioBubbleSchema } from './src/audio'
export { embedBubbleSchema } from './src/embed'
```

**Block Types:**
- **Text Bubble**: Display rich text with variables
- **Image Bubble**: Show images/GIFs
- **Video Bubble**: Embed videos (YouTube, Vimeo, etc.)
- **Audio Bubble**: Play audio files
- **Embed Bubble**: Embed external content (iframes)

---

### @typebot.io/blocks-inputs

**Purpose:** Input block types for collecting user data

**Location:** `packages/blocks/inputs/`

**Key Exports:**
```typescript
export { textInputSchema } from './src/text'
export { emailInputSchema } from './src/email'
export { phoneInputSchema } from './src/phone'
export { numberInputSchema } from './src/number'
export { dateInputSchema } from './src/date'
export { choiceInputSchema } from './src/choice'
export { fileInputSchema } from './src/file'
export { paymentInputSchema } from './src/payment'
```

**Block Types:**
- **Text Input**: Free-form text
- **Email Input**: Email with validation
- **Phone Input**: Phone number
- **Number Input**: Numeric input
- **Date Input**: Date picker
- **Choice Input**: Buttons or dropdown
- **File Upload**: File picker
- **Payment**: Stripe integration

---

### @typebot.io/blocks-logic

**Purpose:** Logic blocks for flow control

**Location:** `packages/blocks/logic/`

**Key Exports:**
```typescript
export { conditionSchema } from './src/condition'
export { setVariableSchema } from './src/setVariable'
export { scriptSchema } from './src/script'
export { redirectSchema } from './src/redirect'
export { waitSchema } from './src/wait'
export { abTestSchema } from './src/abTest'
```

**Block Types:**
- **Condition**: If/else branching
- **Set Variable**: Store values
- **Script**: Execute JavaScript
- **Redirect**: Navigate to URL
- **Wait**: Delay execution
- **AB Test**: Split testing

---

### @typebot.io/blocks-integrations

**Purpose:** Integration block types

**Location:** `packages/blocks/integrations/`

**Key Exports:**
```typescript
export { webhookSchema } from './src/webhook'
export { emailSchema } from './src/email'
export { googleSheetsSchema } from './src/googleSheets'
export { googleAnalyticsSchema } from './src/googleAnalytics'
```

**Block Types:**
- **Webhook**: HTTP requests
- **Email**: Send emails
- **Google Sheets**: Read/write data
- **Google Analytics**: Track events
- **Meta Pixel**: Facebook tracking
- **Chatwoot**: Live chat integration

---

## 🔌 Integration Packages

### @typebot.io/forge

**Purpose:** Plugin system for creating custom integrations

**Location:** `packages/forge/`

**Key Exports:**
```typescript
export { createBlock } from './core/createBlock'
export { createAction } from './core/createAction'
export { option } from './core/option'
export type { AuthDefinition, ActionDefinition }
```

**Usage Example:**
```typescript
import { createBlock, createAction, option } from '@typebot.io/forge'

const myBlock = createBlock({
  id: 'myIntegration',
  name: 'My Integration',
  auth: {
    type: 'encryptedCredentials',
    schema: option.object({
      apiKey: option.string.layout({ label: 'API Key' })
    })
  },
  actions: [
    createAction({
      name: 'Send Data',
      options: option.object({
        data: option.string.layout({ label: 'Data' })
      }),
      run: async ({ credentials, options }) => {
        // Your integration logic
        return { success: true }
      }
    })
  ]
})
```

**Official Forge Blocks:**
- `packages/forge/blocks/openai/` - OpenAI
- `packages/forge/blocks/googleSheets/` - Google Sheets
- `packages/forge/blocks/stripe/` - Stripe
- `packages/forge/blocks/sendgrid/` - SendGrid
- And 20+ more...

---

### @typebot.io/whatsapp

**Purpose:** WhatsApp Business integration

**Location:** `packages/whatsapp/`

**Key Exports:**
```typescript
export { receiveMessage } from './src/receiveMessage'
export { sendChatReplyToWhatsApp } from './src/sendChatReplyToWhatsApp'
export { resumeWhatsAppFlow } from './src/resumeWhatsAppFlow'
export { startWhatsAppPreview } from './src/startWhatsAppPreview'
```

**Usage Example:**
```typescript
import { 
  receiveMessage, 
  sendChatReplyToWhatsApp 
} from '@typebot.io/whatsapp'

// Handle incoming message
const result = await receiveMessage({
  phoneNumberId: '123456789',
  from: '+1234567890',
  message: {
    type: 'text',
    text: { body: 'Hello' }
  }
})

// Send reply
await sendChatReplyToWhatsApp({
  to: '+1234567890',
  messages: [
    { type: 'text', text: 'Hi there!' }
  ],
  credentials: { accessToken: 'token' }
})
```

**Key Features:**
- Receive messages from WhatsApp
- Send text, images, videos, documents
- Handle interactive buttons
- Media upload/download
- Session management

---

### @typebot.io/credentials

**Purpose:** Credential encryption/decryption

**Location:** `packages/credentials/`

**Key Exports:**
```typescript
export { encrypt } from './src/encrypt'
export { decrypt } from './src/decrypt'
```

**Usage Example:**
```typescript
import { encrypt, decrypt } from '@typebot.io/credentials'

// Encrypt API key
const { encrypted, iv } = encrypt(
  'my-api-key',
  process.env.ENCRYPTION_SECRET
)

// Store in database
await prisma.credentials.create({
  data: {
    type: 'openai',
    data: encrypted,
    iv,
    workspaceId: 'workspace-123'
  }
})

// Decrypt when needed
const credentials = await prisma.credentials.findUnique({ where: { id } })
const apiKey = decrypt(
  credentials.data,
  credentials.iv,
  process.env.ENCRYPTION_SECRET
)
```

---

## 🎨 UI & Styling Packages

### @typebot.io/ui

**Purpose:** Shared UI component library

**Location:** `packages/ui/`

**Key Exports:**
```typescript
export { Button } from './src/components/Button'
export { Input } from './src/components/Input'
export { Modal } from './src/components/Modal'
export { Dropdown } from './src/components/Dropdown'
export { Spinner } from './src/components/Spinner'
export { Toast } from './src/components/Toast'
// ... 100+ components
```

**Usage Example:**
```typescript
import { Button, Input, Modal } from '@typebot.io/ui'

export const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Input placeholder="Enter text..." />
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2>Modal Content</h2>
      </Modal>
    </>
  )
}
```

**Component Categories:**
- **Form**: Input, Textarea, Select, Checkbox, Radio
- **Buttons**: Button, IconButton, ButtonGroup
- **Layout**: Stack, Grid, Flex, Container
- **Feedback**: Toast, Alert, Spinner, Progress
- **Overlay**: Modal, Drawer, Popover, Tooltip
- **Data Display**: Table, List, Card, Badge
- **Navigation**: Tabs, Breadcrumb, Pagination

---

### @typebot.io/theme

**Purpose:** Theme utilities and constants

**Location:** `packages/theme/`

**Key Exports:**
```typescript
export { defaultTheme } from './src/constants'
export { parseTheme } from './src/parseTheme'
```

---

### @typebot.io/rich-text

**Purpose:** Rich text editor and renderer

**Location:** `packages/rich-text/`

**Key Exports:**
```typescript
export { RichTextEditor } from './src/RichTextEditor'
export { RichTextRenderer } from './src/RichTextRenderer'
```

---

## 🛠️ Utility Packages

### @typebot.io/lib

**Purpose:** Shared utility functions

**Location:** `packages/lib/`

**Key Exports:**
```typescript
export { isDefined } from './src/utils'
export { isEmpty } from './src/utils'
export { generateId } from './src/generateId'
export { sanitizeUrl } from './src/sanitizeUrl'
```

**Usage Example:**
```typescript
import { isDefined, generateId } from '@typebot.io/lib'

const values = [1, null, 2, undefined, 3]
const defined = values.filter(isDefined) // [1, 2, 3]

const newId = generateId() // 'clx1234567890'
```

---

### @typebot.io/conditions

**Purpose:** Condition evaluation logic

**Location:** `packages/conditions/`

**Key Exports:**
```typescript
export { evaluateCondition } from './src/evaluateCondition'
export { ConditionOperator } from './src/constants'
```

**Usage Example:**
```typescript
import { evaluateCondition } from '@typebot.io/conditions'

const condition = {
  comparisons: [
    {
      variableId: 'var-1',
      operator: 'EQUAL',
      value: 'John'
    }
  ]
}

const variables = [
  { id: 'var-1', name: 'Name', value: 'John' }
]

const result = evaluateCondition(condition, variables)
// Result: true
```

**Operators:**
- `EQUAL`, `NOT_EQUAL`
- `CONTAINS`, `NOT_CONTAINS`
- `GREATER`, `LESS`
- `IS_SET`, `IS_EMPTY`
- `STARTS_WITH`, `ENDS_WITH`
- `MATCHES_REGEX`

---

### @typebot.io/results

**Purpose:** Result processing and analytics

**Location:** `packages/results/`

**Key Exports:**
```typescript
export { processResult } from './src/processResult'
export { exportResults } from './src/exportResults'
```

---

### @typebot.io/logs

**Purpose:** Logging utilities

**Location:** `packages/logs/`

**Key Exports:**
```typescript
export { createLog } from './src/createLog'
export { LogLevel } from './src/constants'
```

---

### @typebot.io/telemetry

**Purpose:** Analytics and telemetry

**Location:** `packages/telemetry/`

**Key Exports:**
```typescript
export { trackEvent } from './src/trackEvent'
export { identifyUser } from './src/identifyUser'
```

---

## 📱 Embed Packages

### @typebot.io/js

**Purpose:** Vanilla JavaScript embed library

**Location:** `packages/embeds/js/`

**Usage Example:**
```html
<script src="https://cdn.typebot.io/latest.js"></script>
<script>
  Typebot.initStandard({
    typebot: 'my-typebot',
    apiHost: 'https://typebot.io'
  })
</script>
```

---

### @typebot.io/react

**Purpose:** React embed component

**Location:** `packages/embeds/react/`

**Usage Example:**
```tsx
import { Standard } from '@typebot.io/react'

export const App = () => (
  <Standard
    typebot="my-typebot"
    apiHost="https://typebot.io"
  />
)
```

---

### @typebot.io/nextjs

**Purpose:** Next.js integration

**Location:** `packages/embeds/nextjs/`

**Usage Example:**
```tsx
import { Typebot } from '@typebot.io/nextjs'

export default function Page() {
  return (
    <Typebot
      typebot="my-typebot"
      apiHost="https://typebot.io"
    />
  )
}
```

---

## 📊 Package Dependency Graph

```
apps/builder
  ├─ @typebot.io/bot-engine
  ├─ @typebot.io/prisma
  ├─ @typebot.io/schemas
  ├─ @typebot.io/ui
  ├─ @typebot.io/blocks-*
  ├─ @typebot.io/forge
  ├─ @typebot.io/whatsapp
  └─ [20+ more packages]

apps/viewer
  ├─ @typebot.io/bot-engine
  ├─ @typebot.io/prisma
  ├─ @typebot.io/schemas
  └─ @typebot.io/whatsapp

@typebot.io/bot-engine
  ├─ @typebot.io/blocks-*
  ├─ @typebot.io/variables
  ├─ @typebot.io/conditions
  └─ @typebot.io/forge

@typebot.io/blocks-*
  └─ @typebot.io/blocks-core

@typebot.io/forge
  └─ @typebot.io/credentials
```

---

## 🔍 Finding the Right Package

**Need to...**

- **Execute bot logic?** → `@typebot.io/bot-engine`
- **Access database?** → `@typebot.io/prisma`
- **Validate data?** → `@typebot.io/schemas`
- **Parse variables?** → `@typebot.io/variables`
- **Evaluate conditions?** → `@typebot.io/conditions`
- **Create UI components?** → `@typebot.io/ui`
- **Build integration?** → `@typebot.io/forge`
- **Handle WhatsApp?** → `@typebot.io/whatsapp`
- **Encrypt credentials?** → `@typebot.io/credentials`
- **Embed typebot?** → `@typebot.io/react` or `@typebot.io/js`

---

This reference guide covers all major packages. For detailed implementation examples, refer to the source code in each package directory.
