# DesignAI — AI Home Design App

A full-stack AI-powered home design mobile app. Users can get AI-generated interior design advice across 8 design categories, save designs, and organize them into projects.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session secret (for JWT signing)
- Auto-provisioned: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with expo-router file-based routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (stored in AsyncStorage on mobile)
- AI: Anthropic Claude (via Replit AI Integrations — no user API key needed)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, designs, projects)
- `lib/integrations-anthropic-ai/` — Anthropic AI client wrapper
- `artifacts/api-server/src/routes/` — Express route handlers (auth, designs, ai, projects)
- `artifacts/mobile/app/` — Expo Router screens
- `artifacts/mobile/constants/features.ts` — 8 design feature definitions
- `artifacts/mobile/context/AuthContext.tsx` — JWT auth state management

## Architecture decisions

- JWT stored in AsyncStorage (not Replit auth) — required for mobile Expo Go workflow
- PostgreSQL instead of MongoDB — uses the workspace's existing Drizzle ORM stack
- Anthropic Claude via Replit AI Integrations — no user API key required, billed to credits
- Credits use daily free plan (10/day) with pro plan unlimited — enforced server-side
- OpenAPI-first design: spec → codegen → typed React Query hooks used throughout mobile app

## Product

8 AI design tools: AI Home Design, Floor Decoration, Furniture Rearrangement, Room Cleanup, Garden Design, Full Room Design, Object Replacement, AI Exterior Design. Users get AI advice from Claude, save designs, organize into projects, and manage favorites.

## User preferences

- Dark theme (#0D0D0D background, #FF4C1E accent) matching design spec
- Inter font family throughout

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`
- The JWT secret defaults to a fallback — set `SESSION_SECRET` env var for production
- `useGetDailyTip` is a POST mutation hook (not a query) — invoke with `mutate`/`mutateAsync`
- Web insets for Expo: add platform-specific padding for status bar on web

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
