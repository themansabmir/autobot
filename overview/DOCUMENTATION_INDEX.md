# 📚 Typebot Documentation Index

Welcome to the Typebot documentation! This index will help you find the right documentation for your needs.

## 🎯 Start Here

**New to Typebot?** Start with these documents in order:

1. **[ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md)** - Complete guide for new contributors
   - Project overview and key features
   - Technology stack explanation
   - Step-by-step setup instructions
   - Core concepts and architecture
   - Development workflow
   - Learning path for new contributors

2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Cheat sheet for common tasks
   - Common commands
   - Code patterns
   - File paths
   - Troubleshooting tips

## 📖 Core Documentation

### Architecture & Design

**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Deep dive into system architecture
- High-level system overview
- Application layer architecture
- Data flow and processing
- Database design
- API architecture
- Real-time features
- Integration patterns
- Security architecture
- Deployment strategies

**[REPO_GUIDE.md](./REPO_GUIDE.md)** - Quick repository overview
- Monorepo structure
- Key directories
- Database models
- Backend architecture
- Frontend architecture

### Development Guides

**[FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md)** - Step-by-step development instructions
- Adding new block types
- Creating integrations
- Adding API endpoints
- Modifying database schema
- Adding feature modules
- Implementing real-time features
- Adding analytics
- Creating themes
- Testing

**[PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md)** - Complete package documentation
- Core packages (`bot-engine`, `prisma`, `schemas`)
- Block packages (bubbles, inputs, logic, integrations)
- Integration packages (`forge`, `whatsapp`, `credentials`)
- UI packages (`ui`, `theme`, `rich-text`)
- Utility packages (`variables`, `conditions`, `lib`)
- Embed packages (`js`, `react`, `nextjs`)

### Feature-Specific Documentation

**[BOT_JSON_STRUCTURE.md](./BOT_JSON_STRUCTURE.md)** - Typebot JSON format
- High-level structure
- Events, groups, blocks, edges
- Variables and theme
- Complete examples

**[CONVERSATION_FLOW.md](./CONVERSATION_FLOW.md)** - How conversations work
- Flow execution model
- Session management
- State handling

**[CHAT_HISTORY_IMPLEMENTATION.md](./CHAT_HISTORY_IMPLEMENTATION.md)** - Chat history feature
- Implementation details
- Database schema
- API endpoints

**[WHATSAPP_DEBUG_GUIDE.md](./WHATSAPP_DEBUG_GUIDE.md)** - WhatsApp troubleshooting
- Common issues
- Debugging steps
- Session management

**[WHATSAPP_SESSION_FIX.md](./WHATSAPP_SESSION_FIX.md)** - WhatsApp session fixes
- Session state issues
- Database fixes

**[LOGIC_MAP.md](./LOGIC_MAP.md)** - Logic flow mapping
- Conditional logic
- Flow control

## 🗺️ Documentation by Role

### For New Interns/Contributors

Start here to understand the project:

1. ✅ [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Read this first!
2. ✅ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Keep this handy
3. ✅ [REPO_GUIDE.md](./REPO_GUIDE.md) - Quick overview
4. ✅ [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the system
5. ✅ [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Start building

### For Frontend Developers

Focus on these documents:

- [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Section: "Frontend Architecture"
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Section: "Application Layer Architecture"
- [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Section: "UI & Styling Packages"
- [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - All sections

**Key packages to know:**
- `@typebot.io/ui` - UI components
- `@typebot.io/blocks-*` - Block definitions
- `apps/builder/src/features/` - Feature modules

### For Backend Developers

Focus on these documents:

- [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Section: "Backend Architecture"
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Sections: "API Architecture", "Database Architecture"
- [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Section: "Core Packages"
- [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - API and database sections

**Key packages to know:**
- `@typebot.io/bot-engine` - Execution engine
- `@typebot.io/prisma` - Database
- `@typebot.io/forge` - Plugin system

### For Integration Developers

Focus on these documents:

- [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Section: "Creating a New Integration"
- [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Section: "Integration Packages"
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Section: "Integration Architecture"

**Key packages to know:**
- `@typebot.io/forge` - Plugin framework
- `packages/forge/blocks/` - Official integrations
- `@typebot.io/credentials` - Credential encryption

### For DevOps/Infrastructure

Focus on these documents:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Section: "Deployment Architecture"
- [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Section: "Deployment"
- Docker files: `docker-compose.yml`, `Dockerfile`

**Key files to know:**
- `docker-compose.yml` - Local development
- `docker-compose.build.yml` - Production build
- `.env.example` - Environment variables

## 🔍 Documentation by Task

### Setting Up Development Environment

1. [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Section: "Getting Started"
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Setup Commands"

### Understanding the Codebase

1. [REPO_GUIDE.md](./REPO_GUIDE.md) - Quick overview
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Deep dive
3. [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Package details

### Adding a New Feature

1. [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Section: "Adding a New Feature Module"
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Common Code Patterns"

### Creating a New Block

1. [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Section: "Adding a New Block Type"
2. [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Section: "Block Packages"
3. [BOT_JSON_STRUCTURE.md](./BOT_JSON_STRUCTURE.md) - Understand block structure

### Building an Integration

1. [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Section: "Creating a New Integration"
2. [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Section: "@typebot.io/forge"
3. Look at existing integrations in `packages/forge/blocks/`

### Working with Database

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Section: "Database Architecture"
2. [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Section: "Modifying the Database Schema"
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Database Commands"
4. `packages/prisma/postgresql/schema.prisma` - Schema file

### Adding API Endpoints

1. [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Section: "Adding a New API Endpoint"
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Section: "API Architecture"
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Common Code Patterns"

### WhatsApp Integration

1. [WHATSAPP_DEBUG_GUIDE.md](./WHATSAPP_DEBUG_GUIDE.md) - Troubleshooting
2. [WHATSAPP_SESSION_FIX.md](./WHATSAPP_SESSION_FIX.md) - Session fixes
3. [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Section: "@typebot.io/whatsapp"
4. `packages/whatsapp/README.md` - Package documentation

### Testing

1. [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Section: "Testing & Quality"
2. [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Section: "Testing Your Changes"
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Testing Commands"

### Deployment

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Section: "Deployment Architecture"
2. [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Section: "Deployment"
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Build & Deploy Commands"

### Troubleshooting

1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Troubleshooting"
2. [WHATSAPP_DEBUG_GUIDE.md](./WHATSAPP_DEBUG_GUIDE.md) - WhatsApp issues
3. [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Section: "Getting Help"

## 📊 Documentation Coverage

### Complete Coverage ✅

- ✅ **Onboarding** - Comprehensive guide for new contributors
- ✅ **Architecture** - System design and patterns
- ✅ **Development** - Step-by-step guides for common tasks
- ✅ **Packages** - Complete package reference
- ✅ **Quick Reference** - Commands and patterns
- ✅ **Bot Structure** - JSON format documentation
- ✅ **WhatsApp** - Integration and debugging

### Existing Documentation

- ✅ `README.md` - Project overview
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `CHANGELOG.md` - Version history
- ✅ `SECURITY.md` - Security policies
- ✅ `LICENSE` - License information

## 🎓 Learning Paths

### Path 1: Quick Start (1-2 days)

For those who want to start contributing quickly:

1. Read: [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Sections: "Project Overview", "Getting Started"
2. Setup: Follow setup instructions
3. Read: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
4. Practice: Create a simple bot in the UI
5. Start: Pick a "good first issue" from GitHub

### Path 2: Deep Understanding (1 week)

For those who want comprehensive knowledge:

1. **Day 1-2**: [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Complete read
2. **Day 3**: [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
3. **Day 4**: [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md) - Package ecosystem
4. **Day 5**: [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - Development patterns
5. **Day 6-7**: Build a small feature, read relevant code

### Path 3: Specialized (Ongoing)

For focusing on specific areas:

**Frontend Specialist:**
- UI components in `packages/ui/`
- Feature modules in `apps/builder/src/features/`
- State management patterns

**Backend Specialist:**
- Bot engine in `packages/bot-engine/`
- Database schema in `packages/prisma/`
- API design in `apps/builder/src/features/*/api/`

**Integration Specialist:**
- Forge system in `packages/forge/`
- Existing integrations in `packages/forge/blocks/`
- WhatsApp in `packages/whatsapp/`

## 🔗 External Resources

### Official Resources

- **Official Docs**: https://docs.typebot.io
- **API Reference**: https://docs.typebot.io/api-reference
- **Self-Hosting Guide**: https://docs.typebot.io/self-hosting
- **Contributing Guide**: https://docs.typebot.io/contribute

### Community

- **Discord**: https://typebot.io/discord
- **GitHub Issues**: https://github.com/baptistearno/typebot.io/issues
- **GitHub Discussions**: https://github.com/baptistearno/typebot.io/discussions

### Technology Documentation

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **tRPC**: https://trpc.io/docs
- **Zustand**: https://docs.pmnd.rs/zustand
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs

## 📝 Documentation Maintenance

### Updating Documentation

When making changes to the codebase, update relevant documentation:

- **New feature** → Update [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md)
- **New package** → Update [PACKAGE_REFERENCE.md](./PACKAGE_REFERENCE.md)
- **Architecture change** → Update [ARCHITECTURE.md](./ARCHITECTURE.md)
- **New command** → Update [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep examples up-to-date
- Add diagrams where helpful
- Link to related documentation

## 🎯 Next Steps

**After reading this index:**

1. ✅ Choose your learning path based on your role
2. ✅ Start with [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md)
3. ✅ Set up your development environment
4. ✅ Keep [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) handy
5. ✅ Join the Discord community
6. ✅ Pick your first issue to work on

**Questions?**

- Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section: "Troubleshooting"
- Ask in Discord: https://typebot.io/discord
- Create a GitHub Discussion

---

**Welcome to Typebot! We're excited to have you contribute! 🚀**
