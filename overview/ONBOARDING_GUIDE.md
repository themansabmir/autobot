# 🚀 Typebot Onboarding Guide for New Contributors

Welcome to Typebot! This comprehensive guide will help you understand the entire codebase from a high level down to implementation details. By the end of this guide, you'll be ready to contribute features and fixes confidently.

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Getting Started](#getting-started)
4. [Codebase Structure](#codebase-structure)
5. [Core Concepts](#core-concepts)
6. [Development Workflow](#development-workflow)
7. [Key Features Deep Dive](#key-features-deep-dive)
8. [Testing & Quality](#testing--quality)
9. [Deployment](#deployment)
10. [Additional Resources](#additional-resources)

---

## 🎯 Project Overview

### What is Typebot?

Typebot is a **Fair Source chatbot builder** that allows users to:
- Create advanced chatbots visually using a drag-and-drop interface
- Embed chatbots anywhere on web/mobile apps
- Collect and analyze results in real-time
- Integrate with 34+ building blocks (text, images, inputs, logic, integrations)

### Key Features

- **Visual Builder**: Drag-and-drop interface for creating complex conversational flows
- **Multi-Channel Support**: Web embeds, WhatsApp integration, and more
- **Rich Integrations**: OpenAI, Google Sheets, Stripe, Zapier, Make.com, etc.
- **Customizable Themes**: Match your brand identity with custom CSS support
- **Analytics**: In-depth insights with drop-off rates, completion rates
- **Developer-Friendly**: Well-documented APIs, no vendor lock-in

### Business Model

- **Cloud Version**: Managed service at [app.typebot.io](https://app.typebot.io)
- **Self-Hosted**: Open for self-hosting with AGPLv3 license
- **Fair Source**: Code is open but with usage restrictions for commercial deployments

---

## 🏗️ Architecture & Technology Stack

### Monorepo Structure

Typebot uses a **monorepo** architecture managed by:
- **TurboRepo**: Build system and task orchestration
- **Bun**: Package manager (v1.3.0)
- **Node.js**: Runtime (v22 required)

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 (App Router + Pages Router hybrid)
- **State Management**: 
  - Zustand (global client state)
  - TanStack Query (server state/caching)
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Custom library built on Base UI
- **Drag & Drop**: @dnd-kit for visual editor
- **Real-time**: PartySocket for collaborative features

#### Backend
- **API Layer**: tRPC (type-safe APIs)
- **Database**: PostgreSQL (primary), MySQL (supported)
- **ORM**: Prisma
- **Caching**: Redis (via ioredis)
- **Authentication**: NextAuth.js v5
- **File Storage**: S3-compatible storage

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Sentry
- **Analytics**: PostHog
- **Email**: Nodemailer with custom templates
- **Payments**: Stripe

#### Key Libraries
- **AI**: OpenAI SDK, Vercel AI SDK
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: Custom editor with ProseMirror
- **Code Editor**: CodeMirror 6
- **Charts**: Recharts
- **Date Handling**: date-fns

---

## 🚀 Getting Started

### Prerequisites

1. **Bun** (v1.3.0): Package manager
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Docker**: For running PostgreSQL and Redis
   ```bash
   # Install Docker Desktop from docker.com
   ```

3. **Node.js** (v22): Required runtime
   ```bash
   # Use nvm or download from nodejs.org
   nvm install 22
   nvm use 22
   ```

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/baptistearno/typebot.io.git
   cd typebot
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `ENCRYPTION_SECRET`: Secret for encrypting credentials
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for dev)
   - `NEXTAUTH_SECRET`: Secret for NextAuth.js
   - Add API keys for integrations (OpenAI, Stripe, etc.)

4. **Start infrastructure services**
   ```bash
   docker compose up -d
   ```
   
   This starts:
   - PostgreSQL (port 5432)
   - Redis (port 6379)

5. **Generate Prisma client and push schema**
   ```bash
   bun turbo run db:generate
   bun turbo run db:push
   ```

6. **Start development servers**
   ```bash
   bun dev
   ```
   
   This starts:
   - **Builder** (port 3000): http://localhost:3000
   - **Viewer** (port 3001): http://localhost:3001
   - **PartyKit** (port 1999): Real-time collaboration server

### Verify Setup

1. Open http://localhost:3000 in your browser
2. Create an account (will use email magic link in dev)
3. Create your first workspace
4. Create a test bot

---

## 📁 Codebase Structure

### Root Directory

```
typebot/
├── apps/                    # Main applications
│   ├── builder/            # Visual editor (Next.js)
│   ├── viewer/             # Bot runtime/player (Next.js)
│   ├── landing-page/       # Marketing website
│   └── docs/               # Documentation site (Docusaurus)
│
├── packages/               # Shared libraries
│   ├── bot-engine/         # Core bot execution logic
│   ├── prisma/             # Database schema & client
│   ├── forge/              # Plugin system for blocks
│   ├── blocks/             # Block type definitions
│   ├── embeds/             # Embed libraries (React, JS, etc.)
│   ├── ui/                 # Shared UI components
│   ├── whatsapp/           # WhatsApp integration
│   ├── emails/             # Email templates
│   ├── schemas/            # Zod schemas
│   └── [30+ more packages] # Feature-specific packages
│
├── .env                    # Environment variables (gitignored)
├── .env.example            # Example environment config
├── docker-compose.yml      # Local development infrastructure
├── turbo.json              # TurboRepo configuration
├── package.json            # Root package.json
└── bun.lock                # Dependency lock file
```

### Apps Directory Deep Dive

#### `apps/builder/` - The Visual Editor

```
builder/
├── src/
│   ├── app/                # Next.js App Router routes
│   │   └── api/            # API routes (tRPC, webhooks)
│   │
│   ├── features/           # Feature modules (30+ features)
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── auth/           # Authentication
│   │   ├── blocks/         # Block editor components
│   │   ├── editor/         # Graph editor (canvas)
│   │   ├── graph/          # Graph state management
│   │   ├── publish/        # Publishing & embedding
│   │   ├── results/        # Results & submissions
│   │   ├── settings/       # Bot settings
│   │   ├── theme/          # Theme customization
│   │   ├── whatsapp/       # WhatsApp integration
│   │   └── workspace/      # Workspace management
│   │
│   ├── components/         # Shared React components
│   ├── helpers/            # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Third-party integrations
│   ├── pages/              # Next.js Pages Router (legacy)
│   └── middleware.ts       # Next.js middleware
│
├── public/                 # Static assets
└── package.json
```

**Key Builder Features:**
- **Graph Editor** (`features/graph/`): The visual canvas for building flows
- **Block System** (`features/blocks/`): All block types (bubbles, inputs, logic, integrations)
- **Preview** (`features/preview/`): Test your bot in real-time
- **Publish** (`features/publish/`): Generate embed codes and publish bots
- **Analytics** (`features/analytics/`): View bot performance metrics
- **Collaboration** (`features/collaboration/`): Multi-user editing

#### `apps/viewer/` - The Bot Runtime

```
viewer/
├── src/
│   ├── app/                # Next.js App Router
│   │   └── api/            # Chat API endpoints
│   │
│   ├── features/           # Viewer-specific features
│   │   ├── chat/           # Chat UI components
│   │   ├── blocks/         # Block renderers
│   │   └── whatsapp/       # WhatsApp webhook handlers
│   │
│   └── lib/                # Utilities
│
└── package.json
```

**Key Viewer Features:**
- **Chat Engine**: Renders the conversational UI
- **Block Renderers**: Displays different block types
- **Session Management**: Handles user sessions and state
- **Webhook Handlers**: Processes incoming messages (WhatsApp, etc.)

### Packages Directory Deep Dive

#### Core Packages

##### `packages/bot-engine/` - The Heart of Typebot

This is the **most critical package** - it executes bot logic.

```
bot-engine/
├── src/
│   ├── blocks/             # Block execution logic
│   │   ├── bubbles/        # Text, image, video bubbles
│   │   ├── inputs/         # User input handlers
│   │   ├── logic/          # Conditional logic, redirects
│   │   └── integrations/   # External service integrations
│   │
│   ├── continueBotFlow.ts  # Main execution loop
│   ├── startBotFlow.ts     # Bot initialization
│   ├── executeBlock.ts     # Block execution dispatcher
│   └── executeLogic.ts     # Logic evaluation
│
└── package.json
```

**How it works:**
1. User starts a bot → `startBotFlow()`
2. Bot processes each block → `executeBlock()`
3. Evaluates conditions → `executeLogic()`
4. Continues to next block → `continueBotFlow()`
5. Stores results in database

##### `packages/prisma/` - Database Layer

```
prisma/
├── postgresql/
│   └── schema.prisma       # PostgreSQL schema
├── mysql/
│   └── schema.prisma       # MySQL schema (alternative)
└── src/
    └── index.ts            # Prisma client exports
```

**Core Models:**
- `User`: User accounts
- `Workspace`: Team/organization container
- `Typebot`: Bot definition (JSON structure)
- `PublicTypebot`: Published bot (optimized)
- `Result`: User session/submission
- `Answer`: User responses
- `ChatSession`: Active chat state

##### `packages/forge/` - Plugin System

The Forge system allows extending Typebot with custom blocks.

```
forge/
├── blocks/                 # Official forge blocks
│   ├── openai/            # OpenAI integration
│   ├── googleSheets/      # Google Sheets
│   ├── stripe/            # Stripe payments
│   └── [20+ more blocks]
│
├── core/                   # Forge framework
│   ├── createBlock.ts     # Block factory
│   └── schemas.ts         # Block schemas
│
└── cli/                    # CLI for creating blocks
```

##### `packages/whatsapp/` - WhatsApp Integration

```
whatsapp/
├── src/
│   ├── receiveMessage.ts           # Incoming message handler
│   ├── sendChatReplyToWhatsApp.ts  # Send messages
│   ├── resumeWhatsAppFlow.ts       # Continue conversation
│   ├── startWhatsAppPreview.ts     # Preview mode
│   └── convertMessageToWhatsAppMessage.ts
│
└── README.md               # Detailed WhatsApp docs
```

##### `packages/embeds/` - Embed Libraries

```
embeds/
├── js/                     # Vanilla JavaScript embed
├── react/                  # React component
├── nextjs/                 # Next.js integration
└── wordpress/              # WordPress plugin
```

##### `packages/ui/` - Shared UI Components

```
ui/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   └── [100+ components]
│   │
│   └── styles/             # Tailwind configuration
│
└── package.json
```

---

## 🧠 Core Concepts

### 1. Typebot Structure (JSON-based)

Every bot is stored as a JSON object with this structure:

```typescript
{
  version: "6",
  id: "bot-id",
  name: "My Bot",
  
  // The flow graph
  events: [],      // Entry points (start event)
  groups: [],      // Containers for blocks
  blocks: [],      // Individual actions (in groups)
  edges: [],       // Connections between groups
  
  // Data & appearance
  variables: [],   // Bot variables
  theme: {},       // Visual styling
  settings: {}     // Bot configuration
}
```

**See `BOT_JSON_STRUCTURE.md` for detailed examples.**

### 2. Flow Execution Model

```
User starts bot
    ↓
[Start Event] → triggers first group
    ↓
[Group 1]
  ├─ Block 1 (Text bubble)
  ├─ Block 2 (Input)
  └─ Block 3 (Logic)
    ↓
[Edge] → connects to next group
    ↓
[Group 2]
  └─ Block 4 (Integration)
    ↓
[End or continue...]
```

**Key Points:**
- Execution is **sequential** within a group
- **Edges** connect groups (can have conditions)
- **Variables** store user data across the flow
- **Session state** persists in database or Redis

### 3. Block Types

#### Bubbles (Output)
- **Text**: Display messages with variables
- **Image**: Show images/GIFs
- **Video**: Embed videos
- **Audio**: Play audio files
- **Embed**: Embed external content

#### Inputs (User Input)
- **Text**: Free-form text input
- **Email**: Email validation
- **Phone**: Phone number input
- **Number**: Numeric input
- **Date**: Date picker
- **Choice**: Buttons or dropdown
- **File Upload**: File picker
- **Payment**: Stripe integration

#### Logic (Flow Control)
- **Condition**: If/else branching
- **Set Variable**: Store values
- **Script**: Execute JavaScript
- **Redirect**: Navigate to URL
- **Wait**: Delay execution
- **AB Test**: Split testing

#### Integrations (External Services)
- **Webhook**: HTTP requests
- **OpenAI**: AI completions
- **Google Sheets**: Read/write data
- **Email**: Send emails
- **Zapier/Make**: Automation platforms
- **Analytics**: Google Analytics, Meta Pixel

### 4. State Management

#### Client State (Builder)
- **Zustand stores** in `features/*/stores/`
- Example: `graphStore.ts`, `blocksStore.ts`

```typescript
// Example: Graph store
const useGraph = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  addNode: (node) => set((state) => ({ 
    nodes: [...state.nodes, node] 
  })),
}))
```

#### Server State (Builder)
- **TanStack Query** for API calls
- Automatic caching and revalidation

```typescript
// Example: Fetch typebot
const { data: typebot } = trpc.typebot.getTypebot.useQuery({
  typebotId: 'abc123'
})
```

#### Session State (Viewer)
- Stored in **PostgreSQL** (`ChatSession` table)
- Or **Redis** for high-performance setups
- Contains: current block, variables, history

### 5. Database Models

**Core relationships:**

```
User
  ├─ has many → Workspaces (via MemberInWorkspace)
  └─ has many → ApiTokens

Workspace
  ├─ has many → Typebots
  ├─ has many → Credentials
  ├─ has many → CustomDomains
  └─ has many → Members

Typebot
  ├─ has one → PublicTypebot (published version)
  ├─ has many → Results (user sessions)
  └─ belongs to → Workspace

Result
  ├─ has many → Answers (user responses)
  ├─ has many → Logs (execution logs)
  └─ belongs to → Typebot
```

**See `packages/prisma/postgresql/schema.prisma` for full schema.**

### 6. Authentication Flow

1. User enters email → NextAuth.js magic link
2. Email sent with verification token
3. User clicks link → token verified
4. Session created → stored in database
5. Session cookie set → user authenticated

**OAuth providers supported:**
- Google
- GitHub
- Facebook
- Azure AD
- GitLab

### 7. WhatsApp Integration

**Flow:**
1. User sends message to WhatsApp Business number
2. Meta sends webhook to `/api/v1/whatsapp/webhook`
3. `receiveMessage()` processes the message
4. `resumeWhatsAppFlow()` continues the bot
5. `sendChatReplyToWhatsApp()` sends response

**Key files:**
- `packages/whatsapp/src/receiveMessage.ts`
- `packages/whatsapp/src/resumeWhatsAppFlow.ts`
- `apps/builder/src/app/api/v1/whatsapp/webhook/route.ts`

**See `WHATSAPP_DEBUG_GUIDE.md` for troubleshooting.**

---

## 🔄 Development Workflow

### Making Changes

#### 1. Create a Feature Branch
```bash
git checkout -b feature/my-new-feature
```

#### 2. Make Your Changes
- Edit files in relevant packages or apps
- Follow existing code patterns
- Add TypeScript types

#### 3. Test Locally
```bash
bun dev  # Start dev servers
```

#### 4. Format & Lint
```bash
bun format-and-lint:fix
```

#### 5. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

**Commit message format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

#### 6. Push & Create PR
```bash
git push origin feature/my-new-feature
```

### Common Development Tasks

#### Adding a New Block Type

1. **Define the schema** in `packages/blocks/`
   ```typescript
   // packages/blocks/my-block/schema.ts
   export const myBlockSchema = z.object({
     type: z.literal('myBlock'),
     options: z.object({
       message: z.string()
     })
   })
   ```

2. **Add execution logic** in `packages/bot-engine/`
   ```typescript
   // packages/bot-engine/src/blocks/myBlock/executeMyBlock.ts
   export const executeMyBlock = async (block: MyBlock) => {
     // Your logic here
   }
   ```

3. **Create UI component** in `apps/builder/src/features/blocks/`
   ```tsx
   // MyBlockSettings.tsx
   export const MyBlockSettings = ({ block }) => {
     return <Input {...} />
   }
   ```

4. **Register the block** in block registry

#### Modifying Database Schema

1. **Edit schema**
   ```bash
   vim packages/prisma/postgresql/schema.prisma
   ```

2. **Generate migration**
   ```bash
   cd packages/prisma
   bun prisma migrate dev --name my_migration
   ```

3. **Generate client**
   ```bash
   bun turbo run db:generate
   ```

#### Adding a New API Endpoint (tRPC)

1. **Create router** in `apps/builder/src/features/*/api/`
   ```typescript
   // myFeature.router.ts
   export const myFeatureRouter = router({
     getItems: publicProcedure
       .input(z.object({ id: z.string() }))
       .query(async ({ input }) => {
         return prisma.item.findMany()
       })
   })
   ```

2. **Add to main router**
   ```typescript
   // apps/builder/src/lib/trpc/router.ts
   export const appRouter = router({
     myFeature: myFeatureRouter,
     // ... other routers
   })
   ```

3. **Use in frontend**
   ```typescript
   const { data } = trpc.myFeature.getItems.useQuery({ id: '123' })
   ```

#### Adding Environment Variables

1. **Add to `.env.example`**
   ```
   MY_NEW_VAR=example_value
   ```

2. **Add to env schema** in `packages/env/`
   ```typescript
   export const env = z.object({
     MY_NEW_VAR: z.string()
   })
   ```

3. **Use in code**
   ```typescript
   import { env } from '@typebot.io/env'
   console.log(env.MY_NEW_VAR)
   ```

---

## 🔍 Key Features Deep Dive

### Feature 1: Graph Editor

**Location:** `apps/builder/src/features/graph/`

**Purpose:** Visual canvas for building bot flows

**Key Components:**
- `GraphCanvas.tsx`: Main canvas component
- `GraphNode.tsx`: Individual group nodes
- `GraphEdge.tsx`: Connections between nodes
- `useGraphDnd.ts`: Drag-and-drop logic

**State Management:**
- `graphStore.ts`: Zustand store for graph state
- Manages nodes, edges, selection, zoom

**How it works:**
1. User drags blocks onto canvas
2. Blocks grouped into "groups" (nodes)
3. Edges connect groups
4. Changes saved to database via tRPC

### Feature 2: Bot Execution Engine

**Location:** `packages/bot-engine/`

**Purpose:** Execute bot logic and process user interactions

**Key Files:**
- `startBotFlow.ts`: Initialize new session
- `continueBotFlow.ts`: Process next step
- `executeBlock.ts`: Execute individual blocks
- `executeLogic.ts`: Evaluate conditions

**Execution Flow:**
```typescript
// 1. Start bot
const session = await startBotFlow({
  typebot,
  startParams: { userId: '123' }
})

// 2. Continue with user input
const result = await continueBotFlow({
  session,
  message: { type: 'text', text: 'Hello' }
})

// 3. Return next messages
return result.messages
```

### Feature 3: WhatsApp Integration

**Location:** `packages/whatsapp/` + `apps/builder/src/features/whatsapp/`

**Purpose:** Enable bots to work on WhatsApp Business

**Key Components:**
- **Webhook Handler**: Receives messages from Meta
- **Message Processor**: Converts WhatsApp format to Typebot format
- **Reply Sender**: Sends responses back to WhatsApp
- **Media Handler**: Uploads/downloads media files

**Setup Process:**
1. User connects WhatsApp Business account
2. Credentials stored encrypted in database
3. Webhook URL configured in Meta dashboard
4. Messages routed through Typebot engine

**See `packages/whatsapp/README.md` for detailed docs.**

### Feature 4: Analytics

**Location:** `apps/builder/src/features/analytics/`

**Purpose:** Track bot performance and user behavior

**Metrics:**
- **Views**: Number of bot starts
- **Starts**: Users who interacted
- **Completion Rate**: % who finished
- **Drop-off Points**: Where users leave

**Implementation:**
- Data from `Result` and `Answer` tables
- Aggregated in real-time
- Visualized with Recharts

### Feature 5: Collaboration

**Location:** `apps/builder/src/features/collaboration/`

**Purpose:** Multiple users editing same bot

**Technology:**
- **PartyKit**: Real-time sync server
- **WebSockets**: Live updates
- **Conflict Resolution**: Last-write-wins

**How it works:**
1. User opens bot → connects to PartyKit
2. Changes broadcast to all connected users
3. UI updates in real-time
4. Periodic saves to database

### Feature 6: Theming

**Location:** `apps/builder/src/features/theme/`

**Purpose:** Customize bot appearance

**Customizable:**
- Fonts (Google Fonts)
- Colors (bubbles, background, buttons)
- Roundness, shadows, spacing
- Custom CSS

**Theme Structure:**
```typescript
{
  general: {
    font: { type: 'Google', family: 'Inter' },
    background: { type: 'Color', content: '#fff' }
  },
  chat: {
    hostBubbles: { backgroundColor: '#0042DA' },
    guestBubbles: { backgroundColor: '#F7F8FF' },
    buttons: { backgroundColor: '#0042DA' }
  }
}
```

---

## 🧪 Testing & Quality

### Running Tests

```bash
# Run all tests
bun test

# Run specific package tests
cd packages/bot-engine
bun test

# Watch mode
bun test --watch
```

### Test Structure

- **Unit Tests**: Individual functions
- **Integration Tests**: API endpoints
- **E2E Tests**: Full user flows (Playwright)

### Code Quality Tools

#### Biome (Linter & Formatter)
```bash
# Check code
bun format-and-lint

# Auto-fix
bun format-and-lint:fix
```

#### TypeScript
```bash
# Type check
bun turbo run typecheck
```

#### Sherif (Monorepo Linter)
```bash
# Check package.json consistency
bun lint-repo
```

### Pre-commit Hooks

Husky runs checks before commits:
- Format & lint
- Type check
- Broken links check

---

## 🚀 Deployment

### Docker Deployment

#### Build Images
```bash
docker compose -f docker-compose.build.yml build
```

#### Run Production
```bash
docker compose -f docker-compose.yml up -d
```

### Environment Variables for Production

**Required:**
- `DATABASE_URL`: PostgreSQL connection
- `ENCRYPTION_SECRET`: For encrypting credentials
- `NEXTAUTH_URL`: Your domain
- `NEXTAUTH_SECRET`: Auth secret
- `S3_ENDPOINT`: File storage
- `S3_ACCESS_KEY`: S3 credentials
- `S3_SECRET_KEY`: S3 credentials

**Optional:**
- `REDIS_URL`: For caching
- `SMTP_*`: Email configuration
- `STRIPE_*`: Payment processing
- `OPENAI_API_KEY`: AI features

### Vercel Deployment (Builder)

1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically on push

### Self-Hosting

See official docs: https://docs.typebot.io/self-hosting

---

## 📖 Additional Resources

### Documentation Files

- **`REPO_GUIDE.md`**: Quick repository overview
- **`BOT_JSON_STRUCTURE.md`**: Typebot JSON format
- **`CONVERSATION_FLOW.md`**: How conversations work
- **`WHATSAPP_DEBUG_GUIDE.md`**: WhatsApp troubleshooting
- **`CHAT_HISTORY_IMPLEMENTATION.md`**: Chat history feature
- **`packages/whatsapp/README.md`**: WhatsApp package docs

### External Resources

- **Official Docs**: https://docs.typebot.io
- **API Reference**: https://docs.typebot.io/api-reference
- **Discord Community**: https://typebot.io/discord
- **GitHub Issues**: https://github.com/baptistearno/typebot.io/issues

### Learning Path for New Contributors

1. **Week 1**: Setup & Exploration
   - Set up local environment
   - Create a simple bot in the UI
   - Explore codebase structure
   - Read core documentation files

2. **Week 2**: Understanding Core Concepts
   - Study bot JSON structure
   - Trace execution flow in bot-engine
   - Understand database schema
   - Review state management patterns

3. **Week 3**: Making Small Changes
   - Fix a "good first issue"
   - Add a simple UI component
   - Modify an existing block
   - Write tests for your changes

4. **Week 4+**: Feature Development
   - Pick a feature from backlog
   - Design & implement
   - Get code review
   - Iterate based on feedback

---

## 🎓 Common Patterns & Best Practices

### Code Organization

- **Feature-based**: Group by feature, not by type
- **Colocation**: Keep related files together
- **Shared code**: Extract to `packages/` when used by multiple apps

### TypeScript

- **Use strict types**: Avoid `any`
- **Zod for validation**: Runtime + compile-time safety
- **Type inference**: Let TypeScript infer when possible

### React

- **Functional components**: Use hooks
- **Custom hooks**: Extract reusable logic
- **Memoization**: Use `useMemo`/`useCallback` for expensive operations

### State Management

- **Server state**: Use TanStack Query
- **Client state**: Use Zustand for global, useState for local
- **Form state**: Use React Hook Form

### API Design

- **tRPC procedures**: Type-safe, auto-generated
- **Input validation**: Always use Zod schemas
- **Error handling**: Use `TRPCError` with proper codes

### Database

- **Migrations**: Always create migrations for schema changes
- **Indexes**: Add indexes for frequently queried fields
- **Relations**: Use Prisma relations for joins

---

## 🤝 Getting Help

### Where to Ask Questions

1. **Discord**: Quick questions, community help
2. **GitHub Discussions**: Feature requests, architecture questions
3. **GitHub Issues**: Bug reports, specific problems
4. **Code Comments**: Leave questions in PR reviews

### Debugging Tips

1. **Use browser DevTools**: React DevTools, Network tab
2. **Check logs**: Console, server logs
3. **Database queries**: Use Prisma Studio (`bun prisma studio`)
4. **Redis data**: Use Redis CLI (`redis-cli`)

### Common Issues

**Issue**: `DATABASE_URL` not found
- **Solution**: Copy `.env.example` to `.env` and configure

**Issue**: Port already in use
- **Solution**: Kill process on port or change port in package.json

**Issue**: Prisma client out of sync
- **Solution**: Run `bun turbo run db:generate`

**Issue**: Build fails
- **Solution**: Clear cache with `bun restore` then `bun install`

---

## 🎉 You're Ready!

Congratulations! You now have a comprehensive understanding of the Typebot codebase. Here's what to do next:

1. ✅ Set up your local environment
2. ✅ Create a test bot to understand the user experience
3. ✅ Pick a "good first issue" from GitHub
4. ✅ Join the Discord community
5. ✅ Start contributing!

**Remember**: Don't hesitate to ask questions. The community is here to help you succeed!

Happy coding! 🚀
