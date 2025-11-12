# Recipe Finder

A full‑stack Next.js app for discovering recipes, filtering by diet/cuisine, saving favorites, generating shopping lists, posting reviews, and using AI to get similar recipes and ingredient substitutions.

## Features

- Recipe search with filters (diet, cuisine, time, calories)
- Full recipe view with ingredients, steps, nutrition, and price breakdown
- Save/unsave favorites and browse your favorites
- Shopping lists generated from recipe ingredients (add, check off, remove)
- Ratings and reviews with aggregation
- AI
  - Related recipes on the recipe page (LLM‑assisted, falls back to Spoonacular similar)
  - Ingredient substitutions via LLM with deterministic fallback
- Auth with email/password (NextAuth Credentials)
- Dark/light theme

## Tech Stack

- Frontend: Next.js App Router (React 18), TypeScript, Tailwind CSS
- Auth: NextAuth (credentials)
- Data: Prisma ORM + Postgres
- External API: Spoonacular (search/details/price)
- AI Providers: OpenAI / Anthropic / Gemini (configurable)
- Tests: Jest (unit) and Playwright (E2E)

## Project Structure

- `src/app` — Pages and API routes
  - `page.tsx` — Landing page
  - `login/page.tsx`, `register/page.tsx`, `dashboard/page.tsx`
  - `recipe/[id]/page.tsx` — Server‑rendered recipe details
  - `api/*/route.ts` — API endpoints (search, favorites, reviews, shopping list, recommendations, ai/substitute, auth)
- `src/components` — UI components (search, sheet, layout, theme, shopping, recipe)
- `src/server` — Spoonacular client and Prisma client
- `prisma/schema.prisma` — Database schema

## Getting Started

1) Install dependencies

- Node.js 18+
- Postgres (local or Docker)
- `npm install`

2) Database

- Example Docker (host port 5433):
  - `docker run --name pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:16`
- Create a database named `recipe_finder` (or update your `DATABASE_URL`).

3) Environment

Create `.env.local` in the repo root. Key variables used by the app:

- NextAuth
  - `NEXTAUTH_URL=http://localhost:3000`
  - `NEXTAUTH_SECRET=your_random_secret`
- Database
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/recipe_finder?schema=public"`
  - `DIRECT_URL="postgresql://postgres:postgres@localhost:5433/recipe_finder"`
- Spoonacular
  - `SPOONACULAR_API_KEY=your_spoonacular_key`
  - Optional fallback: `SPOONACULAR_API_KEY_FALLBACK=second_key_used_on_rate_limit`
- Admin invite (optional; used by register route)
  - `ADMIN_INVITE=let-me-in`
- Global LLM defaults (optional)
  - `LLM_PROVIDER=openai|anthropic|gemini`
  - `LLM_API_KEY=...`
  - `LLM_MODEL=gpt-4o-mini|claude-3-5-sonnet-20240620|gemini-1.5-flash`
- Substitutions LLM (feature‑scoped, overrides global)
  - `SUBS_PROVIDER=openai|anthropic|gemini`
  - `SUBS_API_KEY=...`
  - `SUBS_MODEL=...`
  - Optional fallback: `SUBS_FALLBACK_PROVIDER`, `SUBS_FALLBACK_API_KEY`, `SUBS_FALLBACK_MODEL`

4) Migrate

- `npx prisma migrate dev`
- Optional: `npx prisma generate`

5) Run

- Dev: `npm run dev` (http://localhost:3000)
- Build: `npm run build`
- Start: `npm run start`

## Core Flows

- Search: client `SearchSection` → `GET /api/search` → Spoonacular (fallback to local DB) → grid of recipes
- Recipe page: server component loads from local DB or Spoonacular details/price → renders ingredients, steps, nutrition, price, reviews, related recipes
- Favorites: `FavoriteButton` → `GET/POST /api/user/favorite` (auth) → local `Recipe` upsert ensures details can render without refetch
- Shopping list: `AddToListButton` → `POST /api/user/shoppinglist` (auth) → manage via `GET/PATCH/DELETE`
- Reviews: `ReviewsSection` → `GET/POST /api/user/reviews` (auth) with aggregate updates
- AI substitutions: `SubstituteBox` → `POST /api/ai/substitute` (LLM with safe fallback)
- Related recipes: `RelatedRecipes` uses LLM to craft similar search queries; falls back to Spoonacular "similar recipes"

## API Endpoints

- `GET /api/search?q=&diet?&cuisine?&maxTime?&maxCalories?`
- `GET/POST /api/user/favorite` (toggle/list, auth)
- `GET/POST /api/user/reviews` (auth)
- `GET/POST/PATCH/DELETE /api/user/shoppinglist` (auth)
- `GET /api/recommendations` (optional, used when building personalized suggestions)
- `POST /api/ai/substitute` (LLM substitutions)
- `POST /api/auth/register`
- `GET/POST /api/auth/[...nextauth]` (NextAuth handler)

## Testing

- Unit (Jest)
  - `npm test`
  - Includes tests for key UI components and the Spoonacular helper
- E2E (Playwright)
  - `npm run test:e2e`
  - Open HTML report: `npx playwright show-report`
  - Flows covered: home CTAs; register → invalid login → valid login → search (stub) → favorite (real) → view recipe → substitution (stub)

## Notes & Troubleshooting

- Postgres port: if using Docker mapping `-p 5433:5432`, ensure your `DATABASE_URL` uses `localhost:5433` when running Prisma on the host.
- External APIs: if Spoonacular/LLM keys are missing, the app still works with local DB fallback and deterministic AI substitution fallback.
- NextAuth: credentials provider; passwords are hashed (bcrypt). Admin role can be granted at registration with the invite code (`ADMIN_INVITE`).

## Scripts

- `npm run dev` — Start Next dev server
- `npm run build` — Build
- `npm run start` — Run production build
- `npm test` — Jest tests
- `npm run test:e2e` — Playwright tests

## License

This project is for educational and demonstration purposes.
