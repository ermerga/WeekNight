# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About the Developer

Computer science student focused on learning. Wants to learn how to code and wants to learn the hard way. Ask questions that would spark me to find the answer on my own. Be more of a resource rather than an answer giver. Prefers understanding concepts before implementation

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

The chat system implements Claude tool use with four tools:
- `add-meal-to-plan` - Adds a meal to a specific day
- `create-meal` - Creates a new meal with ingredients
- `remove-meal-from-plan` - Removes a meal from the plan
- `add-item-shopping-list` - Adds a standalone item (not tied to a meal) to the shopping list

Tool handlers are in `/app/api/chat/route.ts`. Each tool call triggers a fetch to the corresponding `/api/tools/*` endpoint.

The chat route also manages context compression: when `conversationHistory` exceeds `MAX_CONTEXT_TOKENS` (2000), it summarizes the older half via a second Claude call and persists that summary in `UserContext`. On the next fresh session start, the saved summary is injected as the first assistant message.

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

Uses NextAuth v5 beta with Prisma adapter. Configuration in `lib/auth.ts`. Supports two providers:
- **Google OAuth** — requires `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- **Credentials** — email + bcrypt-hashed password; uses JWT session strategy (required for Credentials provider)

`session.user.id` is populated via a JWT callback and used throughout API routes for user-scoped queries.

### Planner vs. Chat API

There are two separate AI chat endpoints:
- `/app/api/chat/route.ts` — general assistant with tool use (the main chat)
- `/app/api/planner/chat/route.ts` — planner-specific chat (also has `/planner/confirm` and `/planner/meals`)

### Hooks

`/hooks/` currently only contains a `README.ts` placeholder. No custom React hooks have been implemented yet — data fetching is done inline in page components.

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
- `/app/api/planner/` - Separate planner-specific endpoints (chat, confirm, meals)

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - For Claude chat
- `OPENAI_API_KEY` - For embeddings
- Auth-related variables for NextAuth

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
