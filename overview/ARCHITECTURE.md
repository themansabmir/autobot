# 🏛️ Typebot Architecture Documentation

This document provides a detailed technical architecture overview of Typebot, including system design, data flow, and component interactions.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Application Layer Architecture](#application-layer-architecture)
3. [Data Flow & Processing](#data-flow--processing)
4. [Database Architecture](#database-architecture)
5. [API Architecture](#api-architecture)
6. [Real-time Architecture](#real-time-architecture)
7. [Integration Architecture](#integration-architecture)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)

---

## 🌐 System Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser                                                     │
│  ├─ Builder App (localhost:3000)    ← Bot creation interface   │
│  ├─ Viewer App (localhost:3001)     ← Bot runtime/chat         │
│  └─ Embed Libraries (JS/React)      ← Embedded bots            │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Applications                                            │
│  ├─ Builder (Next.js 15)                                        │
│  │  ├─ App Router (API routes, tRPC)                           │
│  │  ├─ Pages Router (Legacy pages)                             │
│  │  └─ Features (30+ feature modules)                          │
│  │                                                               │
│  ├─ Viewer (Next.js 15)                                         │
│  │  ├─ Chat API                                                 │
│  │  ├─ Block Renderers                                          │
│  │  └─ Webhook Handlers                                         │
│  │                                                               │
│  └─ PartyKit Server (Real-time)                                 │
│     └─ Collaboration sync                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Packages (Shared Libraries)                                     │
│  ├─ @typebot.io/bot-engine      ← Core execution engine        │
│  ├─ @typebot.io/forge           ← Plugin system                │
│  ├─ @typebot.io/whatsapp        ← WhatsApp integration         │
│  ├─ @typebot.io/blocks-*        ← Block implementations        │
│  └─ [30+ other packages]                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  ├─ PostgreSQL                  ← Primary database              │
│  │  ├─ Users, Workspaces                                        │
│  │  ├─ Typebots (JSON)                                          │
│  │  ├─ Results, Answers                                         │
│  │  └─ Sessions, Logs                                           │
│  │                                                               │
│  ├─ Redis                       ← Caching & sessions            │
│  │  ├─ Session state                                            │
│  │  ├─ Rate limiting                                            │
│  │  └─ Queue management                                         │
│  │                                                               │
│  └─ S3 Storage                  ← File uploads                  │
│     ├─ Images, videos                                           │
│     ├─ User uploads                                             │
│     └─ Export files                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  ├─ OpenAI API                  ← AI completions                │
│  ├─ Stripe API                  ← Payments                      │
│  ├─ WhatsApp Business API       ← Messaging                     │
│  ├─ Google Sheets API           ← Data integration              │
│  ├─ SMTP Servers                ← Email delivery                │
│  ├─ Sentry                      ← Error tracking                │
│  └─ PostHog                     ← Analytics                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Application Layer Architecture

### Builder Application Architecture

```
apps/builder/
│
├─ PRESENTATION LAYER
│  ├─ React Components
│  │  ├─ Graph Editor (Canvas)
│  │  ├─ Block Settings Panels
│  │  ├─ Theme Customizer
│  │  └─ Results Dashboard
│  │
│  └─ State Management
│     ├─ Zustand Stores (Client State)
│     │  ├─ graphStore.ts
│     │  ├─ blocksStore.ts
│     │  └─ editorStore.ts
│     │
│     └─ TanStack Query (Server State)
│        └─ Automatic caching & revalidation
│
├─ API LAYER
│  ├─ tRPC Routers
│  │  ├─ typebot.router.ts
│  │  ├─ workspace.router.ts
│  │  ├─ results.router.ts
│  │  └─ [25+ more routers]
│  │
│  ├─ REST API Routes
│  │  ├─ /api/v1/typebots
│  │  ├─ /api/v1/whatsapp/webhook
│  │  └─ /api/publicRuntimeConfig
│  │
│  └─ Middleware
│     ├─ Authentication (NextAuth)
│     ├─ CORS handling
│     └─ Rate limiting
│
├─ BUSINESS LOGIC LAYER
│  ├─ Feature Modules
│  │  ├─ features/editor/
│  │  ├─ features/blocks/
│  │  ├─ features/publish/
│  │  └─ [27+ features]
│  │
│  └─ Shared Packages
│     ├─ @typebot.io/bot-engine
│     ├─ @typebot.io/prisma
│     └─ @typebot.io/schemas
│
└─ DATA ACCESS LAYER
   ├─ Prisma ORM
   │  ├─ Type-safe queries
   │  └─ Automatic migrations
   │
   └─ Redis Client
      └─ ioredis
```

### Viewer Application Architecture

```
apps/viewer/
│
├─ CHAT INTERFACE LAYER
│  ├─ Chat Components
│  │  ├─ ChatContainer
│  │  ├─ MessageBubble
│  │  ├─ InputField
│  │  └─ BlockRenderers
│  │
│  └─ Embed Handlers
│     ├─ Standard embed
│     ├─ Popup embed
│     └─ Bubble embed
│
├─ API LAYER
│  ├─ Chat API
│  │  ├─ POST /api/v1/sessions/:sessionId/continueChat
│  │  ├─ POST /api/v1/typebots/:typebotId/startChat
│  │  └─ GET /api/v1/typebots/:publicId
│  │
│  └─ Webhook Handlers
│     ├─ WhatsApp webhook
│     └─ Generic webhook
│
├─ EXECUTION ENGINE
│  ├─ Bot Engine (@typebot.io/bot-engine)
│  │  ├─ startBotFlow()
│  │  ├─ continueBotFlow()
│  │  └─ executeBlock()
│  │
│  └─ Session Manager
│     ├─ Load session state
│     ├─ Execute next step
│     └─ Save session state
│
└─ DATA LAYER
   ├─ Session Storage
   │  ├─ PostgreSQL (persistent)
   │  └─ Redis (cache)
   │
   └─ Result Storage
      ├─ Result records
      ├─ Answer records
      └─ Log records
```

---

## 🔄 Data Flow & Processing

### Bot Creation Flow (Builder)

```
User Action (UI)
    ↓
React Component
    ↓
Zustand Store Update (optimistic)
    ↓
tRPC Mutation
    ↓
API Route Handler
    ↓
Business Logic
    ↓
Prisma Query
    ↓
PostgreSQL Database
    ↓
Response
    ↓
TanStack Query Cache Update
    ↓
UI Re-render
```

**Example: Adding a Block**

```typescript
// 1. User clicks "Add Text Block"
<Button onClick={() => addBlock('text')}>Add Text</Button>

// 2. Zustand store updates (optimistic)
const addBlock = useBlocksStore((state) => state.addBlock)
addBlock({ type: 'text', id: generateId() })

// 3. tRPC mutation
const { mutate } = trpc.typebot.updateTypebot.useMutation()
mutate({
  typebotId: 'abc123',
  blocks: [...blocks, newBlock]
})

// 4. API handler
export const updateTypebot = publicProcedure
  .input(updateTypebotSchema)
  .mutation(async ({ input }) => {
    return prisma.typebot.update({
      where: { id: input.typebotId },
      data: { groups: input.blocks }
    })
  })

// 5. Database updated
// 6. UI reflects change
```

### Bot Execution Flow (Viewer)

```
User Starts Bot
    ↓
POST /api/v1/typebots/:publicId/startChat
    ↓
Load PublicTypebot from DB
    ↓
Initialize Session
    ↓
startBotFlow(typebot, startParams)
    ↓
┌─────────────────────────────────┐
│   BOT ENGINE EXECUTION LOOP     │
├─────────────────────────────────┤
│ 1. Get current group            │
│ 2. Execute blocks sequentially  │
│ 3. Evaluate conditions          │
│ 4. Update variables             │
│ 5. Find next edge               │
│ 6. Move to next group           │
│ 7. Repeat until input needed    │
└─────────────────────────────────┘
    ↓
Save Session State (Redis/PostgreSQL)
    ↓
Return Messages to Display
    ↓
User Sees Messages
    ↓
User Responds
    ↓
POST /api/v1/sessions/:sessionId/continueChat
    ↓
Load Session State
    ↓
continueBotFlow(session, userMessage)
    ↓
[Execution loop continues...]
```

**Detailed Execution Example:**

```typescript
// Bot structure
{
  groups: [
    {
      id: 'group-1',
      blocks: [
        { id: 'b1', type: 'text', content: 'Hello!' },
        { id: 'b2', type: 'text', content: 'What is your name?' },
        { id: 'b3', type: 'textInput', variableId: 'var-name' }
      ]
    },
    {
      id: 'group-2',
      blocks: [
        { id: 'b4', type: 'text', content: 'Nice to meet you, {{Name}}!' }
      ]
    }
  ],
  edges: [
    { from: { eventId: 'start' }, to: { groupId: 'group-1' } },
    { from: { blockId: 'b3' }, to: { groupId: 'group-2' } }
  ]
}

// Execution trace:
// 1. Start → group-1
// 2. Execute b1 → Display "Hello!"
// 3. Execute b2 → Display "What is your name?"
// 4. Execute b3 → Wait for input (PAUSE)
// 5. User types "John"
// 6. Save "John" to variable "Name"
// 7. Follow edge from b3 → group-2
// 8. Execute b4 → Display "Nice to meet you, John!"
// 9. No more blocks → END
```

### WhatsApp Message Flow

```
User sends WhatsApp message
    ↓
Meta WhatsApp Business API
    ↓
POST /api/v1/whatsapp/webhook
    ↓
Verify webhook signature
    ↓
receiveMessage(message)
    ↓
Extract: phone number, message text, media
    ↓
Find or create session
    ↓
resumeWhatsAppFlow(session, message)
    ↓
continueBotFlow(session, message)
    ↓
Get response messages
    ↓
convertToWhatsAppFormat(messages)
    ↓
sendChatReplyToWhatsApp(messages)
    ↓
Meta WhatsApp Business API
    ↓
User receives response
```

---

## 🗄️ Database Architecture

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1:N
       ↓
┌──────────────────┐
│ MemberInWorkspace│
└──────┬───────────┘
       │ N:1
       ↓
┌─────────────┐         ┌──────────────┐
│  Workspace  │────────→│ Credentials  │
└──────┬──────┘   1:N   └──────────────┘
       │ 1:N
       ↓
┌─────────────┐         ┌──────────────────┐
│   Typebot   │────────→│ PublicTypebot    │
└──────┬──────┘   1:1   └──────────────────┘
       │ 1:N
       ↓
┌─────────────┐
│   Result    │
└──────┬──────┘
       │ 1:N
       ├────────→ Answer
       ├────────→ AnswerV2
       ├────────→ Log
       └────────→ VisitedEdge
```

### Key Tables & Their Purpose

#### User & Authentication Tables

**User**
- Stores user accounts
- Links to workspaces via `MemberInWorkspace`
- Contains preferences and settings

**Account**
- OAuth provider accounts (Google, GitHub, etc.)
- Links to User via `userId`

**Session**
- Active user sessions
- Used by NextAuth.js

#### Workspace Tables

**Workspace**
- Team/organization container
- Has billing plan, limits
- Contains typebots, credentials, custom domains

**MemberInWorkspace**
- Join table: User ↔ Workspace
- Stores role (ADMIN, MEMBER, GUEST)

#### Bot Tables

**Typebot**
- Main bot definition
- Stores JSON structure: `groups`, `edges`, `variables`, `theme`, `settings`
- Draft version (editable)

**PublicTypebot**
- Published version of Typebot
- Optimized for viewer
- Immutable until next publish

#### Execution Tables

**Result**
- Represents one user session/submission
- Links to Typebot
- Contains final variable values
- Tracks completion status

**Answer / AnswerV2**
- User responses to input blocks
- Links to Result
- AnswerV2 is newer format with attachments

**Log**
- Execution logs (errors, warnings, info)
- Links to Result
- Used for debugging

**ChatSession**
- Active chat state (in-progress)
- Stores current block, variables, history
- Can be in PostgreSQL or Redis

#### Integration Tables

**Credentials**
- Encrypted API keys/tokens
- Workspace-level (shared across bots)
- Types: OpenAI, Google Sheets, Stripe, etc.

**UserCredentials**
- User-level credentials
- Personal integrations

**Webhook**
- Webhook configurations
- Stores URL, method, headers, body template

### Data Storage Strategy

#### JSON Fields in PostgreSQL

Typebot uses JSONB columns for flexible schema:

```sql
-- Typebot table
groups    JSONB  -- Array of group objects
edges     JSONB  -- Array of edge objects
variables JSONB  -- Array of variable definitions
theme     JSONB  -- Theme configuration
settings  JSONB  -- Bot settings
```

**Advantages:**
- Flexible schema (no migrations for bot structure changes)
- Fast queries with JSONB indexes
- Version compatibility

**Disadvantages:**
- Less type safety at DB level
- Harder to query nested data

#### Session State Storage

**Option 1: PostgreSQL (Default)**
```typescript
// ChatSession table
{
  id: 'session-123',
  state: {
    currentBlockId: 'block-5',
    currentGroupId: 'group-2',
    variables: { name: 'John', email: 'john@example.com' },
    visitedEdges: ['edge-1', 'edge-2'],
    // ... more state
  }
}
```

**Option 2: Redis (High Performance)**
```typescript
// Redis key: session:session-123
{
  // Same structure as PostgreSQL
  // TTL: 24 hours (auto-expire)
}
```

**Hybrid Approach:**
- Active sessions in Redis (fast access)
- Periodic sync to PostgreSQL (persistence)
- Fallback to PostgreSQL if Redis miss

---

## 🔌 API Architecture

### tRPC Architecture

**Why tRPC?**
- End-to-end type safety
- No code generation needed
- Automatic API documentation
- Integrated with React Query

**Structure:**

```
apps/builder/src/features/
├─ typebot/
│  └─ api/
│     └─ typebot.router.ts
│
├─ workspace/
│  └─ api/
│     └─ workspace.router.ts
│
└─ results/
   └─ api/
      └─ results.router.ts

↓ Merged into

apps/builder/src/lib/trpc/
└─ router.ts  (Main app router)
```

**Example Router:**

```typescript
// typebot.router.ts
export const typebotRouter = router({
  // Query: Fetch typebot
  getTypebot: protectedProcedure
    .input(z.object({ typebotId: z.string() }))
    .query(async ({ input, ctx }) => {
      const typebot = await ctx.prisma.typebot.findUnique({
        where: { id: input.typebotId }
      })
      
      // Authorization check
      if (!canAccessTypebot(ctx.user, typebot)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      return typebot
    }),

  // Mutation: Update typebot
  updateTypebot: protectedProcedure
    .input(updateTypebotSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.typebot.update({
        where: { id: input.typebotId },
        data: {
          groups: input.groups,
          edges: input.edges,
          variables: input.variables
        }
      })
    }),

  // Subscription: Real-time updates (if needed)
  onTypebotUpdate: protectedProcedure
    .input(z.object({ typebotId: z.string() }))
    .subscription(({ input }) => {
      return observable<Typebot>((emit) => {
        // Subscribe to changes
        const unsubscribe = subscribeToTypebot(input.typebotId, (typebot) => {
          emit.next(typebot)
        })
        return unsubscribe
      })
    })
})
```

**Frontend Usage:**

```typescript
// Fetch typebot
const { data: typebot, isLoading } = trpc.typebot.getTypebot.useQuery({
  typebotId: 'abc123'
})

// Update typebot
const { mutate: updateTypebot } = trpc.typebot.updateTypebot.useMutation({
  onSuccess: () => {
    toast.success('Saved!')
  }
})

updateTypebot({
  typebotId: 'abc123',
  groups: [...]
})
```

### REST API Architecture

**Used for:**
- Public endpoints (no auth needed)
- Webhooks (external services)
- Legacy compatibility

**Structure:**

```
apps/builder/src/app/api/
├─ v1/
│  ├─ typebots/
│  │  ├─ [typebotId]/
│  │  │  └─ route.ts
│  │  └─ route.ts
│  │
│  ├─ whatsapp/
│  │  ├─ webhook/
│  │  │  └─ route.ts
│  │  └─ preview/
│  │     └─ webhook/
│  │        └─ route.ts
│  │
│  └─ sessions/
│     └─ [sessionId]/
│        └─ continueChat/
│           └─ route.ts
│
└─ publicRuntimeConfig/
   └─ route.ts
```

**Example REST Endpoint:**

```typescript
// apps/viewer/src/app/api/v1/sessions/[sessionId]/continueChat/route.ts
export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  const { message } = await req.json()
  
  // Load session
  const session = await getSession(params.sessionId)
  
  // Continue bot flow
  const result = await continueBotFlow({
    session,
    message
  })
  
  // Save session
  await saveSession(session)
  
  return Response.json(result)
}
```

---

## ⚡ Real-time Architecture

### PartyKit Integration

**Purpose:** Real-time collaboration for multi-user editing

**Architecture:**

```
User A (Browser)          PartyKit Server          User B (Browser)
      │                         │                         │
      │  WebSocket Connect      │                         │
      ├────────────────────────→│                         │
      │                         │  WebSocket Connect      │
      │                         │←────────────────────────┤
      │                         │                         │
      │  Update Block           │                         │
      ├────────────────────────→│                         │
      │                         │  Broadcast Update       │
      │                         ├────────────────────────→│
      │                         │                         │
      │                         │  Update Block           │
      │                         │←────────────────────────┤
      │  Broadcast Update       │                         │
      │←────────────────────────┤                         │
```

**Implementation:**

```typescript
// packages/partykit/src/server.ts
export default class TypebotPartyServer implements Party.Server {
  constructor(public party: Party.Party) {}

  async onConnect(connection: Party.Connection) {
    // User connected
    const typebotId = this.party.id
    
    // Send current state
    connection.send(JSON.stringify({
      type: 'init',
      state: await this.getTypebotState(typebotId)
    }))
  }

  async onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message)
    
    // Broadcast to all except sender
    this.party.broadcast(message, [sender.id])
    
    // Optionally save to database
    if (data.type === 'update') {
      await this.saveTypebot(data.typebot)
    }
  }
}
```

**Frontend Integration:**

```typescript
// apps/builder/src/features/collaboration/hooks/useCollaboration.ts
export const useCollaboration = (typebotId: string) => {
  const party = usePartySocket({
    host: 'localhost:1999',
    room: typebotId,
    onMessage: (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'update') {
        // Update local state
        updateTypebot(data.typebot)
      }
    }
  })

  const broadcastUpdate = (typebot: Typebot) => {
    party.send(JSON.stringify({
      type: 'update',
      typebot
    }))
  }

  return { broadcastUpdate }
}
```

---

## 🔗 Integration Architecture

### Integration Types

1. **Forge Blocks** (Plugin System)
2. **Webhooks** (HTTP requests)
3. **Native Integrations** (Built-in)

### Forge Block Architecture

**Structure:**

```
packages/forge/blocks/
├─ openai/
│  ├─ index.ts              # Block definition
│  ├─ actions/
│  │  ├─ createChatCompletion.ts
│  │  └─ createImage.ts
│  ├─ auth.ts               # Authentication
│  └─ logo.svg
│
└─ googleSheets/
   ├─ index.ts
   ├─ actions/
   │  ├─ insertRow.ts
   │  └─ getRow.ts
   └─ auth.ts
```

**Block Definition:**

```typescript
// packages/forge/blocks/openai/index.ts
import { createBlock } from '@typebot.io/forge'

export const openAIBlock = createBlock({
  id: 'openai',
  name: 'OpenAI',
  tags: ['ai', 'chat'],
  auth: {
    type: 'encryptedCredentials',
    name: 'OpenAI API Key',
    schema: z.object({
      apiKey: z.string()
    })
  },
  actions: [
    {
      name: 'Create Chat Completion',
      run: async ({ credentials, options }) => {
        const openai = new OpenAI({ apiKey: credentials.apiKey })
        
        const completion = await openai.chat.completions.create({
          model: options.model,
          messages: options.messages
        })
        
        return {
          response: completion.choices[0].message.content
        }
      },
      options: z.object({
        model: z.enum(['gpt-4', 'gpt-3.5-turbo']),
        messages: z.array(messageSchema)
      })
    }
  ]
})
```

---

## 🔒 Security Architecture

### Authentication & Authorization

**Authentication Flow:**

```
1. User enters email
2. Magic link sent to email
3. User clicks link with token
4. Token verified
5. Session created
6. Cookie set (httpOnly, secure)
```

**Authorization Layers:**

```typescript
// 1. Route-level (middleware)
export default authMiddleware({
  publicRoutes: ['/login', '/register']
})

// 2. API-level (tRPC procedures)
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { user: ctx.session.user } })
})

// 3. Resource-level (permissions)
const canAccessTypebot = (user: User, typebot: Typebot) => {
  // Check workspace membership
  const isMember = typebot.workspace.members.some(
    m => m.userId === user.id
  )
  
  // Check collaborator
  const isCollaborator = typebot.collaborators.some(
    c => c.userId === user.id
  )
  
  return isMember || isCollaborator
}
```

### Data Encryption

**Credentials Encryption:**

```typescript
// packages/credentials/src/encrypt.ts
export const encrypt = (data: string, secret: string) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv)
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return {
    encrypted,
    iv: iv.toString('hex')
  }
}

export const decrypt = (encrypted: string, iv: string, secret: string) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    secret,
    Buffer.from(iv, 'hex')
  )
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

**Usage:**

```typescript
// Storing credentials
const { encrypted, iv } = encrypt(apiKey, process.env.ENCRYPTION_SECRET)

await prisma.credentials.create({
  data: {
    type: 'openai',
    data: encrypted,
    iv,
    workspaceId: 'workspace-123'
  }
})

// Retrieving credentials
const creds = await prisma.credentials.findUnique({ where: { id } })
const apiKey = decrypt(creds.data, creds.iv, process.env.ENCRYPTION_SECRET)
```

---

## 🚀 Deployment Architecture

### Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Builder    │  │    Viewer    │  │  PartyKit    │  │
│  │  (Port 3000) │  │  (Port 3001) │  │  (Port 1999) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│  ┌─────────────────────────┴──────────────────────────┐ │
│  │              PostgreSQL (Port 5432)                 │ │
│  └─────────────────────────┬──────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────┴──────────────────────────┐ │
│  │                Redis (Port 6379)                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Production Deployment Options

**Option 1: Vercel (Recommended for Builder)**
- Automatic deployments from Git
- Edge functions for API routes
- Global CDN
- Serverless architecture

**Option 2: Self-Hosted (Docker)**
- Full control
- Custom infrastructure
- Cost-effective for high volume

**Option 3: Kubernetes**
- Auto-scaling
- High availability
- Complex setup

---

This architecture documentation provides a comprehensive technical overview of Typebot. For implementation details, refer to the ONBOARDING_GUIDE.md and specific package README files.
