# Typebot Repository Guide

Welcome to the Typebot repository! This guide is designed to help you navigate the codebase, understand the architecture, and get started with contributing.

## 1. High-Level Overview

Typebot is a powerful chatbot builder. This repository is a **monorepo** managed with **TurboRepo** and **Bun**.

### Key Directories
- **`apps/`**: Contains the main applications.
  - `builder`: The visual editor for creating chatbots.
  - `viewer`: The runtime environment that displays and executes the chatbots.
  - `landing-page`: The marketing website.
  - `docs`: Documentation site.
- **`packages/`**: Shared libraries and modules used across apps.
- **`docker-compose.yml`**: Defines the local development infrastructure (PostgreSQL, Redis).

## 2. Database (PostgreSQL)

The database schema is defined in `packages/prisma/postgresql/schema.prisma`.

### Core Models
- **`User`**: Represents a registered user.
- **`Workspace`**: A collaborative environment where users create bots. Contains `Members`, `Credentials`, and `Plan` info.
- **`Typebot`**: The core entity representing a chatbot.
  - Stores structure in JSON fields: `groups`, `events`, `variables`, `edges`.
  - Linked to a `Workspace` and a `DashboardFolder`.
- **`Result`**: Represents a user session/interaction with a bot.
  - Contains `Answer`s (user inputs) and `Log`s (execution logs).
- **`PublicTypebot`**: A published version of a Typebot, optimized for the viewer.

### Authentication
- Uses **NextAuth.js** (implied by `Account`, `Session`, `VerificationToken` models).
- Supports OAuth providers and email magic links.

## 3. Backend Architecture

Typebot uses a modern, type-safe stack.

### API Layer
- **tRPC**: The primary method for communication between the frontend (`builder`, `viewer`) and the backend.
  - Ensures full type safety across the stack.
  - Routers are likely located in `apps/builder/src/features/*/api` or similar.

### Core Logic
- **`@typebot.io/bot-engine`** (`packages/bot-engine`): This is the heart of the runtime.
  - It handles the execution of the bot logic, processing blocks, evaluating conditions, and managing the session state.
  - It parses the JSON structure of the `Typebot` and executes it step-by-step.

### Infrastructure
- **Redis**: Used for caching and potentially for queue management (e.g., for `typebot-redis` service).
- **PostgreSQL**: Primary relational database.

## 4. Frontend Architecture

The frontend applications are built with **Next.js**.

### Apps
- **`apps/builder`**:
  - **Framework**: Next.js 15 (App Router/Pages Router mix likely).
  - **State Management**: **Zustand** for global client state, **TanStack Query** (React Query) for server state.
  - **Styling**: **Tailwind CSS** with a custom UI library (`@typebot.io/ui`) built on **Base UI**.
  - **Drag & Drop**: Uses `@dnd-kit` for the visual editor.
- **`apps/viewer`**:
  - **Framework**: Next.js 15.
  - **Purpose**: Lightweight, optimized for rendering the chat interface.
  - **Real-time**: Uses `partysocket` for real-time capabilities (likely for "typing" indicators or multi-user sessions).

### Shared UI
- **`@typebot.io/ui`** (`packages/ui`):
  - Contains reusable components (Buttons, Inputs, Modals).
  - Built with **Tailwind CSS**, **Class Variance Authority (CVA)**, and **Base UI**.

## 5. Modules & Packages

The `packages/` directory contains reusable code. Here are the most important ones:

- **`bot-engine`**: Core execution logic.
- **`prisma`**: Database client and schema definitions.
- **`forge`**: The plugin system for Typebot blocks.
  - **`packages/forge/blocks`**: Contains definitions for specific blocks (e.g., OpenAI, Google Sheets).
  - Allows for easy extension of the bot's capabilities.
- **`embeds`**: Libraries for embedding Typebot in other websites (React, HTML/JS, etc.).
- **`emails`**: Email templates and sending logic.
- **`variables`**: Logic for handling bot variables.

## 6. Getting Started

### Prerequisites
- **Bun**: The package manager used in this repo.
- **Docker**: For running the database and Redis.

### Running Locally
1.  **Install Dependencies**:
    ```bash
    bun install
    ```
2.  **Set up Environment**:
    - Copy `.env.example` to `.env`.
    - Configure the database URL and other secrets.
3.  **Start Infrastructure**:
    ```bash
    docker compose up -d
    ```
4.  **Run Development Server**:
    ```bash
    bun dev
    ```
    - This will start the Builder (http://localhost:3000), Viewer (http://localhost:3001), and other apps.

## 7. Contribution Tips
- **Adding a new Block**: Check `packages/forge`. You likely need to define the schema and the runtime logic there.
- **Database Changes**: Modify `packages/prisma/postgresql/schema.prisma` and run `bun turbo run db:generate`.
- **UI Changes**: Look into `packages/ui` for shared components or `apps/builder/src/components` for app-specific ones.

Happy Coding!
