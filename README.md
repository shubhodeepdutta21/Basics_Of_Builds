# BOB — Basics Of Builds

Turn the electronics parts you already own into real projects. Log your inventory, see which projects you can build right now, ask AI to invent one from your exact parts, and get step-by-step help from a project-aware assistant.

## Features

- **Inventory:** log parts (catalog or custom) with quantities. Stored in your browser's localStorage.
- **Discovery:** every project is scored by how many of its *required* parts you own. Optional parts never count against you.
- **AI Auto-Invent:** generates a new project from your exact inventory (Groq, `openai/gpt-oss-120b`). The response is validated server-side before it reaches the UI.
- **Project assistant:** a chat tied to the project you're viewing; conversations are saved per project.
- **Auth:** email/password and Google via Supabase Auth.
- **Community:** in progress (currently a UI prototype).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres) · Groq API · Upstash Redis (rate limiting) · Vercel

## Getting started

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
cp .env.example .env.local   # on Windows PowerShell: Copy-Item .env.example .env.local
# fill in the values, then:
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Where it's used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Required. The app throws on startup if missing. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Required. Public by design; protect data with RLS. |
| `GROQ_API_KEY` | server only | Required for AI routes. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | server only | Optional locally (falls back to in-memory limiting). Recommended in production. |

## Database (Supabase)

Tables in the `public` schema: `components`, `projects`, `project_requirements`, `profiles`.

Catalog tables (`components`, `projects`, `project_requirements`) should be **readable by everyone and writable by no client**: enable Row Level Security with a public `select` policy and no insert/update/delete policies. Make catalog changes from the Supabase dashboard.

## Security notes

- AI routes (`/api/generate`, `/api/chatbot`) require a signed-in user; the server verifies the Supabase access token.
- Both routes are rate limited per user and validate all client input (roles, lengths, shapes).
- No service-role key is used or needed by the app.

## Project structure

```
src/
  app/
    api/generate/     AI project invention (auth, rate limit, validated JSON)
    api/chatbot/      project-aware assistant
    inventory/        parts catalog + your inventory
    discovery/        project matching + AI invention
    projects/[id]/    project detail, bill of materials, assistant
    community/        community page (in progress)
    login/            auth
    components/       Navbar, chatbot
  lib/
    matching.ts       single source of truth for "how ready am I?"
    InventoryContext  inventory + AI project state (localStorage)
    serverAuth.ts     verifies Supabase tokens in API routes
    rateLimit.ts      Upstash Redis limiter with in-memory fallback
    authFetch.ts      fetch wrapper that attaches the user's token
    supabaseClient.ts Supabase client
```

## Roadmap

- Move projects and inventory fully to Supabase (remove remaining mock data)
- Cloud-synced inventory per user
- Working community feature (posts, comments, likes)