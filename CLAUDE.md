# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About the Developer

Computer science student focused on learning. Prefers understanding concepts before implementation

## Communication Style

- **Explain before coding** — Always explain reasoning and tradeoffs before writing code. Ask "want me to make these changes, or do you want to try it?" after explaining.
- **Ask clarifying questions** — Gather context before starting work. Don't assume.
- **Use tables for comparisons** — When explaining tradeoffs or options, use markdown tables.
- **Keep explanations concise** — Use bullet points, code snippets, and clear headers.

## Code Preferences

- Let the user implement things themselves when possible after explaining
- Show "before and after" code snippets when explaining fixes
- Reference specific line numbers when discussing existing code
- Explain the "why" not just the "what"

## Project Overview

AI Food is a meal planning application built with Next.js 16. Users can plan weekly meals, manage inventory, create shopping lists, and interact with an AI assistant to manage their meal plans.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Start Docker services (PostgreSQL with pgvector, Redis)
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Generate Prisma client after schema changes
npx prisma generate
```

## Architecture

### AI Integration

The app uses two AI providers:
- **Anthropic Claude** (`@anthropic-ai/sdk`) - For the chat assistant and tool orchestration in `/api/chat`
- **OpenAI** (`openai`) - For generating text embeddings via `text-embedding-3-small` model

The chat system implements Claude tool use with three tools:
- `add-meal-to-plan` - Adds a meal to a specific day
- `create-meal` - Creates a new meal with ingredients
- `remove-meal-from-plan` - Removes a meal from the plan

Tool handlers are in `/app/api/chat/route.ts`. Each tool call triggers a fetch to the corresponding `/api/tools/*` endpoint.

### Meal Search

Meal search uses a two-tier approach:
1. **Fuse.js** - First tries fuzzy string matching for typos
2. **Vector embeddings** - Falls back to semantic search using pgvector

Embeddings are generated when meals are created and stored in the `embedding` column (vector type) of the meals table.

### Database

PostgreSQL with pgvector extension. Schema is in `prisma/schema.prisma`. Key models:
- `Meal` - Stores meal definitions with optional embedding vector
- `PlannedMeal` - Links meals to specific dates in a meal plan
- `MealPlan` - Weekly plan container starting on Sunday
- `FoodItem` / `Ingredient` - Ingredient tracking

### Authentication

Uses NextAuth v5 beta with Prisma adapter. Configuration in `lib/auth.ts`.

### Date Handling

**Important:** Always use local time formatting to avoid timezone issues:
- When creating URLs with dates: Use `formatDateForUrl()` helper (local time)
- When parsing date strings: Add `"T00:00:00"` suffix to force local midnight
- `toISOString()` converts to UTC which causes day shifts in western timezones

### Key Files

- `/app/api/chat/route.ts` - Main AI chat endpoint with tool handling
- `/app/api/tools/*` - Individual tool implementations
- `/lib/embeddings.ts` - OpenAI embedding generation
- `/prisma/seed.ts` - Database seeding (uses relative import for embeddings)

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - For Claude chat
- `OPENAI_API_KEY` - For embeddings
- Auth-related variables for NextAuth
