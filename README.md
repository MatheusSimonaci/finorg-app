# Finorg — Personal Finance Management

A personal finance app built with **Next.js 15**, **Prisma**, **SQLite** and **AI-powered transaction categorization**.

## Features

- **Transaction Import** — CSV upload with automatic AI categorization
- **Budget Dashboard** — Monthly budget tracking with alerts
- **Investment Portfolio** — Asset allocation and rebalancing
- **Dreams System** — Goal-based savings planning
- **Emergency Reserve** — Reserve monitoring and asset designation
- **Financial Projections** — Net worth projections and cash flow simulator
- **Mobile Snapshot** — Privacy-first shareable financial summaries

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | Prisma ORM + SQLite |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| AI | OpenAI API (categorization) |
| CSV | PapaParse |

## Getting Started

```bash
# Install dependencies
cd finorg
npm install

# Set up database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `finorg/.env.example` to `finorg/.env` and fill in your values:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=your_key_here
```

## Project Structure

```
finorg/          # Next.js application
  app/           # App Router pages
  components/    # UI components (finance + shadcn/ui)
  lib/           # Database client, utilities
  prisma/        # Schema, migrations, seed

docs/
  stories/       # Development stories (AIOS workflow)
  prd/           # Product requirement documents
```

## Development Workflow

This project uses [AIOS](https://github.com/synkra/aios) for story-driven development. Stories are tracked in `docs/stories/`.

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run build        # Production build
```
