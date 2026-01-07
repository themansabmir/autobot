# 🛠️ Feature Development Guide

This guide provides step-by-step instructions for common development tasks in Typebot. Use this as a reference when implementing new features or modifying existing ones.

## Table of Contents

1. [Adding a New Block Type](#adding-a-new-block-type)
2. [Creating a New Integration](#creating-a-new-integration)
3. [Adding a New API Endpoint](#adding-a-new-api-endpoint)
4. [Modifying the Database Schema](#modifying-the-database-schema)
5. [Adding a New Feature Module](#adding-a-new-feature-module)
6. [Implementing Real-time Features](#implementing-real-time-features)
7. [Adding Analytics Events](#adding-analytics-events)
8. [Creating Custom Themes](#creating-custom-themes)
9. [Testing Your Changes](#testing-your-changes)

---

## 🧩 Adding a New Block Type

### Overview

Blocks are the building units of a Typebot. There are four categories:
- **Bubbles**: Display content (text, images, videos)
- **Inputs**: Collect user data (text, email, buttons)
- **Logic**: Control flow (conditions, variables, scripts)
- **Integrations**: Connect to external services (webhooks, APIs)

### Step-by-Step Process

#### 1. Define the Block Schema

Create a new package in `packages/blocks/`:

```bash
cd packages/blocks
mkdir my-block
cd my-block
```

Create `package.json`:

```json
{
  "name": "@typebot.io/blocks-my-block",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

Create `src/schema.ts`:

```typescript
import { z } from 'zod'
import { blockBaseSchema } from '@typebot.io/blocks-core'

// Define block options
export const myBlockOptionsSchema = z.object({
  message: z.string().optional(),
  variableId: z.string().optional(),
  isRequired: z.boolean().default(false)
})

// Define the complete block schema
export const myBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.literal('myBlock'),
    options: myBlockOptionsSchema.optional()
  })
)

// Export types
export type MyBlock = z.infer<typeof myBlockSchema>
export type MyBlockOptions = z.infer<typeof myBlockOptionsSchema>
```

Create `src/constants.ts`:

```typescript
import { MyBlock } from './schema'

export const defaultMyBlockOptions: MyBlock['options'] = {
  message: 'Enter your message',
  isRequired: false
}
```

Create `src/index.ts`:

```typescript
export * from './schema'
export * from './constants'
```

#### 2. Add Execution Logic (Bot Engine)

Create execution handler in `packages/bot-engine/src/blocks/myBlock/`:

```typescript
// packages/bot-engine/src/blocks/myBlock/executeMyBlock.ts
import type { MyBlock } from '@typebot.io/blocks-my-block'
import type { SessionState } from '../../types'

export const executeMyBlock = async (
  state: SessionState,
  block: MyBlock
): Promise<{
  outgoingEdgeId: string | undefined
  newSessionState: SessionState
}> => {
  const { options } = block

  // Your block logic here
  console.log('Executing my block with message:', options?.message)

  // Update session state if needed
  const newSessionState = {
    ...state,
    // Add any state updates
  }

  // Return next edge and updated state
  return {
    outgoingEdgeId: block.outgoingEdgeId,
    newSessionState
  }
}
```

Register in `packages/bot-engine/src/blocks/index.ts`:

```typescript
import { executeMyBlock } from './myBlock/executeMyBlock'

export const executeBlock = async (
  state: SessionState,
  block: Block
): Promise<ExecuteBlockResult> => {
  switch (block.type) {
    case 'myBlock':
      return executeMyBlock(state, block)
    // ... other cases
  }
}
```

#### 3. Create Builder UI Components

Create settings panel in `apps/builder/src/features/blocks/myBlock/`:

```typescript
// MyBlockSettings.tsx
import { Input } from '@typebot.io/ui'
import { MyBlock } from '@typebot.io/blocks-my-block'

type Props = {
  block: MyBlock
  onUpdate: (updates: Partial<MyBlock>) => void
}

export const MyBlockSettings = ({ block, onUpdate }: Props) => {
  const updateMessage = (message: string) => {
    onUpdate({
      options: {
        ...block.options,
        message
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Message</label>
        <Input
          value={block.options?.message ?? ''}
          onChange={(e) => updateMessage(e.target.value)}
          placeholder="Enter message..."
        />
      </div>
    </div>
  )
}
```

Create block icon component:

```typescript
// MyBlockIcon.tsx
export const MyBlockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    {/* Your icon SVG */}
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
  </svg>
)
```

Register in block registry:

```typescript
// apps/builder/src/features/blocks/registry.ts
import { MyBlockSettings } from './myBlock/MyBlockSettings'
import { MyBlockIcon } from './myBlock/MyBlockIcon'

export const blockRegistry = {
  myBlock: {
    name: 'My Block',
    icon: MyBlockIcon,
    settings: MyBlockSettings,
    category: 'inputs', // or 'bubbles', 'logic', 'integrations'
    defaultOptions: defaultMyBlockOptions
  },
  // ... other blocks
}
```

#### 4. Create Viewer Renderer (if needed)

For input blocks or custom rendering:

```typescript
// apps/viewer/src/features/blocks/myBlock/MyBlockRenderer.tsx
import { MyBlock } from '@typebot.io/blocks-my-block'

type Props = {
  block: MyBlock
  onSubmit: (value: string) => void
}

export const MyBlockRenderer = ({ block, onSubmit }: Props) => {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    onSubmit(value)
  }

  return (
    <div className="flex flex-col gap-2">
      <p>{block.options?.message}</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="px-4 py-2 border rounded"
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

Register in viewer:

```typescript
// apps/viewer/src/features/blocks/BlockRenderer.tsx
import { MyBlockRenderer } from './myBlock/MyBlockRenderer'

export const BlockRenderer = ({ block, onSubmit }) => {
  switch (block.type) {
    case 'myBlock':
      return <MyBlockRenderer block={block} onSubmit={onSubmit} />
    // ... other cases
  }
}
```

#### 5. Add Tests

```typescript
// packages/bot-engine/src/blocks/myBlock/executeMyBlock.test.ts
import { describe, it, expect } from 'vitest'
import { executeMyBlock } from './executeMyBlock'

describe('executeMyBlock', () => {
  it('should execute successfully', async () => {
    const block = {
      id: 'block-1',
      type: 'myBlock',
      options: {
        message: 'Test message'
      }
    }

    const state = {
      // Mock session state
    }

    const result = await executeMyBlock(state, block)

    expect(result.outgoingEdgeId).toBeDefined()
  })
})
```

---

## 🔌 Creating a New Integration

### Using Forge (Recommended)

Forge is Typebot's plugin system for creating integrations.

#### 1. Generate Block Scaffold

```bash
cd packages/forge/cli
bun start
```

Follow the prompts:
- Block name: `myService`
- Description: `Integrate with My Service`
- Author: Your name

This creates: `packages/forge/blocks/myService/`

#### 2. Define Authentication

Edit `packages/forge/blocks/myService/auth.ts`:

```typescript
import { option, AuthDefinition } from '@typebot.io/forge'

export const auth = {
  type: 'encryptedCredentials',
  name: 'My Service Account',
  schema: option.object({
    apiKey: option.string.layout({
      label: 'API Key',
      isRequired: true,
      inputType: 'password',
      helperText: 'Get your API key from My Service dashboard'
    })
  })
} satisfies AuthDefinition
```

#### 3. Define Actions

Edit `packages/forge/blocks/myService/actions/sendData.ts`:

```typescript
import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

export const sendData = createAction({
  name: 'Send Data',
  auth,
  options: option.object({
    endpoint: option.string.layout({
      label: 'Endpoint',
      placeholder: '/api/data'
    }),
    data: option.string.layout({
      label: 'Data',
      inputType: 'textarea'
    })
  }),
  run: async ({ credentials, options, variables }) => {
    const response = await fetch(
      `https://api.myservice.com${options.endpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: options.data
      }
    )

    const result = await response.json()

    return {
      response: result,
      statusCode: response.status
    }
  }
})
```

#### 4. Register Actions

Edit `packages/forge/blocks/myService/index.ts`:

```typescript
import { createBlock } from '@typebot.io/forge'
import { auth } from './auth'
import { sendData } from './actions/sendData'
import { getData } from './actions/getData'

export const myServiceBlock = createBlock({
  id: 'myService',
  name: 'My Service',
  tags: ['integration'],
  LightLogo: MyServiceLightLogo,
  DarkLogo: MyServiceDarkLogo,
  auth,
  actions: [sendData, getData]
})
```

#### 5. Test Integration

```typescript
// packages/forge/blocks/myService/actions/sendData.test.ts
import { describe, it, expect } from 'vitest'
import { sendData } from './sendData'

describe('sendData', () => {
  it('should send data successfully', async () => {
    const result = await sendData.run({
      credentials: { apiKey: 'test-key' },
      options: {
        endpoint: '/test',
        data: JSON.stringify({ test: true })
      },
      variables: {}
    })

    expect(result.statusCode).toBe(200)
  })
})
```

---

## 🌐 Adding a New API Endpoint

### tRPC Endpoint (Recommended)

#### 1. Create Router

```typescript
// apps/builder/src/features/myFeature/api/myFeature.router.ts
import { router, protectedProcedure } from '@/lib/trpc/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

export const myFeatureRouter = router({
  // Query: Fetch data
  getItems: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        limit: z.number().optional().default(10)
      })
    )
    .query(async ({ input, ctx }) => {
      // Authorization check
      const workspace = await ctx.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        include: { members: true }
      })

      if (!workspace?.members.some(m => m.userId === ctx.user.id)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Fetch data
      const items = await ctx.prisma.myItem.findMany({
        where: { workspaceId: input.workspaceId },
        take: input.limit,
        orderBy: { createdAt: 'desc' }
      })

      return items
    }),

  // Mutation: Create item
  createItem: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string(),
        data: z.record(z.unknown())
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.prisma.myItem.create({
        data: {
          name: input.name,
          data: input.data,
          workspaceId: input.workspaceId
        }
      })

      return item
    }),

  // Mutation: Delete item
  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.myItem.delete({
        where: { id: input.itemId }
      })

      return { success: true }
    })
})
```

#### 2. Register Router

```typescript
// apps/builder/src/lib/trpc/router.ts
import { myFeatureRouter } from '@/features/myFeature/api/myFeature.router'

export const appRouter = router({
  // ... existing routers
  myFeature: myFeatureRouter
})

export type AppRouter = typeof appRouter
```

#### 3. Use in Frontend

```typescript
// apps/builder/src/features/myFeature/MyFeatureList.tsx
import { trpc } from '@/lib/trpc'

export const MyFeatureList = ({ workspaceId }: { workspaceId: string }) => {
  // Query
  const { data: items, isLoading } = trpc.myFeature.getItems.useQuery({
    workspaceId,
    limit: 20
  })

  // Mutation
  const { mutate: createItem } = trpc.myFeature.createItem.useMutation({
    onSuccess: () => {
      // Invalidate query to refetch
      trpc.useContext().myFeature.getItems.invalidate()
    }
  })

  const handleCreate = () => {
    createItem({
      workspaceId,
      name: 'New Item',
      data: {}
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={handleCreate}>Create Item</button>
      {items?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### REST API Endpoint

For public endpoints or webhooks:

```typescript
// apps/builder/src/app/api/v1/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@typebot.io/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'Missing id parameter' },
      { status: 400 }
    )
  }

  const item = await prisma.myItem.findUnique({
    where: { id }
  })

  if (!item) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(item)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Validate input
  const schema = z.object({
    name: z.string(),
    data: z.record(z.unknown())
  })

  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error },
      { status: 400 }
    )
  }

  const item = await prisma.myItem.create({
    data: result.data
  })

  return NextResponse.json(item, { status: 201 })
}
```

---

## 🗄️ Modifying the Database Schema

### 1. Edit Prisma Schema

```prisma
// packages/prisma/postgresql/schema.prisma

model MyNewModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
  name      String
  data      Json
  
  // Relations
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([workspaceId])
  @@index([createdAt(sort: Desc)])
}

// Add relation to existing model
model Workspace {
  // ... existing fields
  myNewModels MyNewModel[]
}
```

### 2. Create Migration

```bash
cd packages/prisma
bun prisma migrate dev --name add_my_new_model
```

This creates a migration file in `packages/prisma/postgresql/migrations/`

### 3. Generate Prisma Client

```bash
bun turbo run db:generate
```

### 4. Apply Migration to Database

```bash
# Development
bun turbo run db:push

# Production
bun prisma migrate deploy
```

### 5. Use in Code

```typescript
import { prisma } from '@typebot.io/prisma'

// Create
const item = await prisma.myNewModel.create({
  data: {
    name: 'Test',
    data: { key: 'value' },
    workspaceId: 'workspace-123'
  }
})

// Read
const items = await prisma.myNewModel.findMany({
  where: { workspaceId: 'workspace-123' },
  include: { workspace: true }
})

// Update
await prisma.myNewModel.update({
  where: { id: item.id },
  data: { name: 'Updated' }
})

// Delete
await prisma.myNewModel.delete({
  where: { id: item.id }
})
```

---

## 📦 Adding a New Feature Module

### 1. Create Feature Directory

```bash
mkdir -p apps/builder/src/features/myFeature
cd apps/builder/src/features/myFeature
```

### 2. Create Feature Structure

```
myFeature/
├── api/
│   └── myFeature.router.ts
├── components/
│   ├── MyFeatureList.tsx
│   ├── MyFeatureForm.tsx
│   └── MyFeatureItem.tsx
├── hooks/
│   ├── useMyFeature.ts
│   └── useMyFeatureForm.ts
├── stores/
│   └── myFeatureStore.ts
├── types/
│   └── index.ts
└── index.ts
```

### 3. Create Zustand Store

```typescript
// stores/myFeatureStore.ts
import { create } from 'zustand'

type MyFeatureState = {
  items: Item[]
  selectedItem: Item | null
  setItems: (items: Item[]) => void
  selectItem: (item: Item | null) => void
  addItem: (item: Item) => void
  removeItem: (itemId: string) => void
}

export const useMyFeatureStore = create<MyFeatureState>((set) => ({
  items: [],
  selectedItem: null,
  
  setItems: (items) => set({ items }),
  
  selectItem: (item) => set({ selectedItem: item }),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  removeItem: (itemId) => set((state) => ({
    items: state.items.filter(i => i.id !== itemId)
  }))
}))
```

### 4. Create Custom Hook

```typescript
// hooks/useMyFeature.ts
import { trpc } from '@/lib/trpc'
import { useMyFeatureStore } from '../stores/myFeatureStore'

export const useMyFeature = (workspaceId: string) => {
  const { setItems } = useMyFeatureStore()

  const { data: items, isLoading } = trpc.myFeature.getItems.useQuery(
    { workspaceId },
    {
      onSuccess: (data) => {
        setItems(data)
      }
    }
  )

  const { mutate: createItem, isLoading: isCreating } = 
    trpc.myFeature.createItem.useMutation({
      onSuccess: (newItem) => {
        useMyFeatureStore.getState().addItem(newItem)
      }
    })

  return {
    items,
    isLoading,
    createItem,
    isCreating
  }
}
```

### 5. Create Components

```typescript
// components/MyFeatureList.tsx
import { useMyFeature } from '../hooks/useMyFeature'

export const MyFeatureList = ({ workspaceId }: Props) => {
  const { items, isLoading, createItem } = useMyFeature(workspaceId)

  if (isLoading) return <Spinner />

  return (
    <div>
      <button onClick={() => createItem({ name: 'New' })}>
        Add Item
      </button>
      {items?.map(item => (
        <MyFeatureItem key={item.id} item={item} />
      ))}
    </div>
  )
}
```

---

## ⚡ Implementing Real-time Features

### Using PartyKit

#### 1. Create Party Server

```typescript
// packages/partykit/src/myFeatureParty.ts
import type * as Party from 'partykit/server'

export default class MyFeatureParty implements Party.Server {
  constructor(public party: Party.Party) {}

  async onConnect(connection: Party.Connection) {
    // Send initial state
    const state = await this.getState()
    connection.send(JSON.stringify({
      type: 'init',
      state
    }))
  }

  async onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message)

    // Handle different message types
    switch (data.type) {
      case 'update':
        await this.handleUpdate(data)
        // Broadcast to all except sender
        this.party.broadcast(message, [sender.id])
        break
    }
  }

  async handleUpdate(data: any) {
    // Save to database or storage
  }

  async getState() {
    // Load from database or storage
    return {}
  }
}
```

#### 2. Create Frontend Hook

```typescript
// apps/builder/src/features/myFeature/hooks/useMyFeatureRealtime.ts
import usePartySocket from 'partysocket/react'

export const useMyFeatureRealtime = (featureId: string) => {
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST,
    room: featureId,
    onMessage: (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'update') {
        // Update local state
        useMyFeatureStore.getState().updateItem(data.item)
      }
    }
  })

  const broadcastUpdate = (item: Item) => {
    socket.send(JSON.stringify({
      type: 'update',
      item
    }))
  }

  return { broadcastUpdate }
}
```

---

## 📊 Adding Analytics Events

### 1. Define Event

```typescript
// apps/builder/src/lib/analytics/events.ts
export const analyticsEvents = {
  myFeature: {
    itemCreated: 'My Feature Item Created',
    itemDeleted: 'My Feature Item Deleted',
    itemUpdated: 'My Feature Item Updated'
  }
}
```

### 2. Track Event

```typescript
import { trackEvent } from '@/lib/analytics'

const handleCreateItem = async () => {
  const item = await createItem({ name: 'New Item' })
  
  // Track event
  trackEvent({
    name: analyticsEvents.myFeature.itemCreated,
    properties: {
      itemId: item.id,
      workspaceId: workspace.id
    }
  })
}
```

---

## 🧪 Testing Your Changes

### Unit Tests

```typescript
// myFeature.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFeature'

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### Integration Tests

```typescript
// myFeature.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@typebot.io/prisma'

describe('MyFeature Integration', () => {
  beforeAll(async () => {
    // Setup test data
    await prisma.myItem.create({
      data: { name: 'Test' }
    })
  })

  it('should fetch items from database', async () => {
    const items = await prisma.myItem.findMany()
    expect(items).toHaveLength(1)
  })
})
```

### Run Tests

```bash
# All tests
bun test

# Specific file
bun test myFeature.test.ts

# Watch mode
bun test --watch
```

---

This guide covers the most common development tasks. For more specific scenarios, refer to existing code examples in the codebase or ask in the Discord community.
