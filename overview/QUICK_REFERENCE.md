# 🚀 Quick Reference Guide

A cheat sheet for common tasks and commands in Typebot development.

## 📋 Table of Contents

- [Setup Commands](#setup-commands)
- [Development Commands](#development-commands)
- [Database Commands](#database-commands)
- [Testing Commands](#testing-commands)
- [Build & Deploy Commands](#build--deploy-commands)
- [Common Code Patterns](#common-code-patterns)
- [Useful File Paths](#useful-file-paths)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## ⚙️ Setup Commands

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Start infrastructure (PostgreSQL, Redis)
docker compose up -d

# Generate Prisma client
bun turbo run db:generate

# Push schema to database
bun turbo run db:push

# Start development servers
bun dev
```

---

## 💻 Development Commands

```bash
# Start all dev servers (Builder, Viewer, PartyKit)
bun dev

# Start specific app
cd apps/builder && bun dev
cd apps/viewer && bun dev

# Format and lint code
bun format-and-lint

# Auto-fix formatting and linting
bun format-and-lint:fix

# Type check
bun turbo run typecheck

# Check monorepo consistency
bun lint-repo

# Auto-fix monorepo issues
bun lint-repo:fix
```

---

## 🗄️ Database Commands

```bash
# Generate Prisma client
bun turbo run db:generate

# Push schema changes (dev)
bun turbo run db:push

# Create migration
cd packages/prisma
bun prisma migrate dev --name my_migration

# Apply migrations (production)
bun prisma migrate deploy

# Open Prisma Studio (database GUI)
cd packages/prisma
bun prisma studio

# Reset database (WARNING: deletes all data)
bun prisma migrate reset
```

---

## 🧪 Testing Commands

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests for specific package
cd packages/bot-engine
bun test

# Run specific test file
bun test myFeature.test.ts

# Run tests with coverage
bun test --coverage
```

---

## 🏗️ Build & Deploy Commands

```bash
# Build all apps
bun build

# Build specific app
cd apps/builder && bun run build

# Start production server
bun start

# Docker build
docker compose -f docker-compose.build.yml build

# Docker run production
docker compose -f docker-compose.yml up -d

# Clean build artifacts
bun restore
```

---

## 📝 Common Code Patterns

### Creating a tRPC Query

```typescript
// apps/builder/src/features/myFeature/api/myFeature.router.ts
export const myFeatureRouter = router({
  getItems: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.myItem.findMany({
        where: { workspaceId: input.workspaceId }
      })
    })
})
```

### Using tRPC in Component

```typescript
const { data, isLoading } = trpc.myFeature.getItems.useQuery({
  workspaceId: 'workspace-123'
})
```

### Creating a Zustand Store

```typescript
import { create } from 'zustand'

type Store = {
  items: Item[]
  addItem: (item: Item) => void
}

export const useStore = create<Store>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  }))
}))
```

### Database Query with Prisma

```typescript
// Create
const item = await prisma.myItem.create({
  data: { name: 'Test', workspaceId: 'workspace-123' }
})

// Read
const items = await prisma.myItem.findMany({
  where: { workspaceId: 'workspace-123' },
  include: { workspace: true }
})

// Update
await prisma.myItem.update({
  where: { id: 'item-123' },
  data: { name: 'Updated' }
})

// Delete
await prisma.myItem.delete({
  where: { id: 'item-123' }
})
```

### Parsing Variables

```typescript
import { parseVariables } from '@typebot.io/variables'

const text = 'Hello {{Name}}'
const variables = [{ id: 'var-1', name: 'Name', value: 'John' }]
const result = parseVariables(text, variables)
// Result: "Hello John"
```

### Encrypting Credentials

```typescript
import { encrypt, decrypt } from '@typebot.io/credentials'

// Encrypt
const { encrypted, iv } = encrypt(apiKey, process.env.ENCRYPTION_SECRET)

// Decrypt
const apiKey = decrypt(encrypted, iv, process.env.ENCRYPTION_SECRET)
```

### Creating a Block

```typescript
// Schema
export const myBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.literal('myBlock'),
    options: z.object({
      message: z.string()
    })
  })
)

// Execution
export const executeMyBlock = async (state, block) => {
  // Your logic
  return {
    outgoingEdgeId: block.outgoingEdgeId,
    newSessionState: state
  }
}
```

---

## 📂 Useful File Paths

### Configuration Files
```
/.env                           # Environment variables
/turbo.json                     # TurboRepo config
/package.json                   # Root package.json
/biome.json                     # Linter/formatter config
/docker-compose.yml             # Docker services
```

### Database
```
/packages/prisma/postgresql/schema.prisma    # Database schema
/packages/prisma/src/client.ts               # Prisma client
```

### Builder App
```
/apps/builder/src/features/                  # Feature modules
/apps/builder/src/app/api/                   # API routes
/apps/builder/src/components/                # Shared components
/apps/builder/src/lib/trpc/                  # tRPC setup
```

### Viewer App
```
/apps/viewer/src/app/api/                    # Chat API
/apps/viewer/src/features/blocks/            # Block renderers
```

### Core Packages
```
/packages/bot-engine/                        # Execution engine
/packages/forge/                             # Plugin system
/packages/whatsapp/                          # WhatsApp integration
/packages/ui/                                # UI components
/packages/blocks/                            # Block definitions
```

---

## 🔐 Environment Variables

### Required
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/typebot"
ENCRYPTION_SECRET="your-32-char-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

### Optional (Common)
```bash
# Redis
REDIS_URL="redis://localhost:6379"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-password"

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# S3 Storage
S3_ENDPOINT="https://s3.amazonaws.com"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET="typebot-uploads"

# WhatsApp
WHATSAPP_CLOUD_API_TOKEN="your-token"

# Analytics
POSTHOG_API_KEY="your-key"
SENTRY_DSN="https://..."
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma Client Out of Sync

```bash
bun turbo run db:generate
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker compose restart postgres

# Check DATABASE_URL in .env
```

### Build Fails

```bash
# Clear cache and rebuild
bun restore
bun install
bun turbo run db:generate
bun dev
```

### TypeScript Errors

```bash
# Restart TypeScript server in VSCode
Cmd+Shift+P → "TypeScript: Restart TS Server"

# Clear TypeScript cache
rm -rf node_modules/.cache
```

### Module Not Found

```bash
# Reinstall dependencies
bun install

# Check if package is in workspace
cat package.json | grep "workspaces"
```

---

## 🔗 Quick Links

- **Builder**: http://localhost:3000
- **Viewer**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (run `bun prisma studio`)
- **PartyKit**: http://localhost:1999

---

## 📚 Documentation Files

- `ONBOARDING_GUIDE.md` - Complete onboarding for new contributors
- `ARCHITECTURE.md` - System architecture and design
- `FEATURE_DEVELOPMENT_GUIDE.md` - Step-by-step development guides
- `PACKAGE_REFERENCE.md` - All packages and their usage
- `BOT_JSON_STRUCTURE.md` - Typebot JSON format
- `WHATSAPP_DEBUG_GUIDE.md` - WhatsApp troubleshooting
- `REPO_GUIDE.md` - Quick repository overview

---

## 💡 Pro Tips

1. **Use TurboRepo cache**: Speeds up builds significantly
2. **Prisma Studio**: Great for debugging database issues
3. **tRPC DevTools**: Install browser extension for debugging
4. **Hot reload**: Changes auto-reload in dev mode
5. **Biome**: Faster than ESLint + Prettier combined
6. **Bun**: Much faster than npm/yarn
7. **Docker Compose**: Easy local infrastructure setup

---

## 🎯 Common Tasks Checklist

### Adding a New Feature
- [ ] Create feature directory in `apps/builder/src/features/`
- [ ] Create tRPC router in `api/` subdirectory
- [ ] Create Zustand store if needed
- [ ] Create React components
- [ ] Add to main router
- [ ] Write tests
- [ ] Update documentation

### Adding a New Block
- [ ] Create schema in `packages/blocks/`
- [ ] Add execution logic in `packages/bot-engine/`
- [ ] Create settings UI in `apps/builder/`
- [ ] Create renderer in `apps/viewer/` (if needed)
- [ ] Register in block registry
- [ ] Add icon
- [ ] Write tests

### Database Changes
- [ ] Edit `schema.prisma`
- [ ] Create migration: `bun prisma migrate dev`
- [ ] Generate client: `bun turbo run db:generate`
- [ ] Update TypeScript types
- [ ] Test queries
- [ ] Update documentation

---

Keep this guide handy for quick reference during development!
