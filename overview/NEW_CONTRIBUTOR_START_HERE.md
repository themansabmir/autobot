# 🎓 New Contributor Onboarding Summary

**Welcome to Typebot!** This document provides a quick overview to get you started. For detailed information, see the [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md).

## 📚 Documentation Structure

We've created comprehensive documentation to help you understand and contribute to Typebot:

### 🌟 Essential Reading (Start Here!)

1. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Your navigation hub
   - Find the right documentation for your needs
   - Learning paths by role
   - Documentation organized by task

2. **[ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md)** - Complete onboarding (READ THIS FIRST!)
   - Project overview and features
   - Technology stack
   - Setup instructions
   - Core concepts
   - Development workflow
   - Key features deep dive

3. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Your daily cheat sheet
   - Common commands
   - Code patterns
   - File paths
   - Troubleshooting

### 📖 Deep Dive Documentation

4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
   - High-level system design
   - Application architecture
   - Data flow
   - Database design
   - API architecture
   - Real-time features
   - Security
   - Deployment

5. **[FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md)** - Development how-tos
   - Adding blocks
   - Creating integrations
   - Adding API endpoints
   - Database changes
   - Feature modules
   - Real-time features
   - Testing

6. **[PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md)** - Package documentation
   - Core packages
   - Block packages
   - Integration packages
   - UI packages
   - Utility packages
   - Embed packages

### 🔧 Specialized Documentation

7. **[BOT_JSON_STRUCTURE.md](./BOT_JSON_STRUCTURE.md)** - Typebot format
8. **[CONVERSATION_FLOW.md](./CONVERSATION_FLOW.md)** - Flow execution
9. **[WHATSAPP_DEBUG_GUIDE.md](./WHATSAPP_DEBUG_GUIDE.md)** - WhatsApp troubleshooting
10. **[REPO_GUIDE.md](./REPO_GUIDE.md)** - Quick repo overview

## 🚀 Quick Start (30 Minutes)

### 1. Setup Your Environment (15 min)

```bash
# Clone repository
git clone https://github.com/baptistearno/typebot.io.git
cd typebot

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure
docker compose up -d

# Generate database
bun turbo run db:generate
bun turbo run db:push

# Start development
bun dev
```

**Access:**
- Builder: http://localhost:3000
- Viewer: http://localhost:3001

### 2. Explore the Codebase (10 min)

```bash
# Key directories
apps/builder/          # Visual editor
apps/viewer/           # Bot runtime
packages/bot-engine/   # Execution engine
packages/prisma/       # Database
packages/forge/        # Plugin system
packages/ui/           # UI components
```

### 3. Create Your First Bot (5 min)

1. Open http://localhost:3000
2. Create account (magic link)
3. Create workspace
4. Create a simple bot with:
   - Text bubble: "Hello!"
   - Text input: "What's your name?"
   - Text bubble: "Nice to meet you, {{Name}}!"
5. Test in preview

## 🎯 Your First Contribution

### Week 1: Learn & Explore

**Day 1-2: Setup & Documentation**
- ✅ Complete environment setup
- ✅ Read [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md)
- ✅ Create a test bot
- ✅ Join Discord community

**Day 3-4: Understand Architecture**
- ✅ Read [ARCHITECTURE.md](./ARCHITECTURE.md)
- ✅ Read [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md)
- ✅ Explore codebase structure
- ✅ Trace a simple flow in debugger

**Day 5: Pick an Issue**
- ✅ Browse "good first issue" labels
- ✅ Read [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md)
- ✅ Ask questions in Discord
- ✅ Start coding!

### Week 2+: Contribute

- ✅ Implement your feature/fix
- ✅ Write tests
- ✅ Create pull request
- ✅ Iterate based on feedback
- ✅ Celebrate your contribution! 🎉

## 📊 Codebase Overview

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         CLIENT LAYER                     │
│  Builder | Viewer | Embeds              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│      APPLICATION LAYER                   │
│  Next.js Apps | PartyKit                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│     BUSINESS LOGIC LAYER                 │
│  bot-engine | forge | whatsapp | blocks │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│         DATA LAYER                       │
│  PostgreSQL | Redis | S3                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│      EXTERNAL SERVICES                   │
│  OpenAI | Stripe | WhatsApp | etc.      │
└─────────────────────────────────────────┘
```

See the architecture diagram image for a visual representation!

### Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18
- Zustand (state)
- TanStack Query (server state)
- Tailwind CSS v4
- @dnd-kit (drag & drop)

**Backend:**
- tRPC (API)
- Prisma (ORM)
- PostgreSQL (database)
- Redis (cache)
- NextAuth.js (auth)

**Infrastructure:**
- TurboRepo (monorepo)
- Bun (package manager)
- Docker (local dev)
- Vercel (deployment)

## 🗂️ Key Directories

```
typebot/
├── apps/
│   ├── builder/              # Visual editor
│   │   └── src/features/     # 30+ feature modules
│   ├── viewer/               # Bot runtime
│   └── landing-page/         # Marketing site
│
├── packages/
│   ├── bot-engine/           # ⭐ Core execution engine
│   ├── prisma/               # ⭐ Database
│   ├── forge/                # ⭐ Plugin system
│   ├── whatsapp/             # WhatsApp integration
│   ├── blocks/               # Block definitions
│   ├── ui/                   # UI components
│   └── [30+ more packages]
│
├── DOCUMENTATION_INDEX.md    # 📚 Start here!
├── ONBOARDING_GUIDE.md       # 🎓 Complete guide
├── QUICK_REFERENCE.md        # ⚡ Cheat sheet
├── ARCHITECTURE.md           # 🏗️ System design
├── FEATURE_DEVELOPMENT_GUIDE.md  # 🛠️ How-tos
└── PACKAGE_REFERENCE.md      # 📦 Package docs
```

## 💡 Core Concepts

### 1. Typebot Structure

A bot is a JSON object with:
- **Events**: Entry points (start event)
- **Groups**: Containers for blocks
- **Blocks**: Individual actions (text, input, logic)
- **Edges**: Connections between groups
- **Variables**: Data storage
- **Theme**: Visual styling

### 2. Execution Flow

```
User starts bot
  → Load typebot
  → Execute start event
  → Process blocks sequentially
  → Wait for user input
  → Continue with next blocks
  → Save results
```

### 3. Monorepo Structure

- **apps/**: Applications (builder, viewer)
- **packages/**: Shared code
- **TurboRepo**: Build orchestration
- **Bun**: Fast package manager

## 🔗 Important Links

### Documentation
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Navigation hub
- [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Complete guide
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Cheat sheet

### External
- **Official Docs**: https://docs.typebot.io
- **Discord**: https://typebot.io/discord
- **GitHub**: https://github.com/baptistearno/typebot.io

### Local Development
- Builder: http://localhost:3000
- Viewer: http://localhost:3001
- Prisma Studio: `bun prisma studio`

## 🎓 Learning Paths

### Path 1: Quick Start (Recommended for most)
1. [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Sections: Overview, Setup, Core Concepts
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Keep handy
3. Pick a "good first issue"
4. Use [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) as needed

### Path 2: Deep Dive (For comprehensive understanding)
1. [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Complete read
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
3. [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - All packages
4. [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Development patterns
5. Build a feature

### Path 3: Specialized (By role)

**Frontend Developer:**
- Focus on `apps/builder/src/features/`
- Read UI sections in documentation
- Study state management patterns

**Backend Developer:**
- Focus on `packages/bot-engine/`
- Read API and database sections
- Study execution flow

**Integration Developer:**
- Focus on `packages/forge/`
- Read integration sections
- Study existing integrations

## 🤝 Getting Help

### Before Asking
1. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Troubleshooting section
2. Search existing GitHub issues
3. Search Discord history

### Where to Ask
- **Quick questions**: Discord
- **Bug reports**: GitHub Issues
- **Feature requests**: GitHub Discussions
- **Code questions**: PR comments

## ✅ Checklist for New Contributors

### Setup
- [ ] Clone repository
- [ ] Install Bun
- [ ] Install Docker
- [ ] Run `bun install`
- [ ] Setup `.env` file
- [ ] Start Docker services
- [ ] Run `bun dev`
- [ ] Access builder at localhost:3000

### Learning
- [ ] Read [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- [ ] Read [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md)
- [ ] Bookmark [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [ ] Create a test bot
- [ ] Explore codebase structure

### Community
- [ ] Join Discord
- [ ] Introduce yourself
- [ ] Star the repository
- [ ] Read CONTRIBUTING.md

### First Contribution
- [ ] Find a "good first issue"
- [ ] Read relevant documentation
- [ ] Ask questions if needed
- [ ] Create a branch
- [ ] Make changes
- [ ] Write tests
- [ ] Create pull request

## 🎉 You're Ready!

You now have access to comprehensive documentation covering:

✅ **Complete onboarding** - From setup to contribution  
✅ **System architecture** - How everything works together  
✅ **Development guides** - Step-by-step instructions  
✅ **Package reference** - All packages documented  
✅ **Quick reference** - Commands and patterns  
✅ **Specialized guides** - WhatsApp, bot structure, etc.

**Next Steps:**

1. Start with [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
2. Follow your chosen learning path
3. Join the Discord community
4. Make your first contribution

**Welcome to the Typebot community! We're excited to have you here! 🚀**

---

**Questions?** Check the [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) or ask in Discord!
