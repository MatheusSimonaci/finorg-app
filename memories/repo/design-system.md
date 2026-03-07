# FinOrg Design System Reference

## Brand Reference
- **URL:** https://brand.aioxsquad.ai/
- **Style:** Dark-first, AI/tech aesthetic, modern fintech
- **Framework:** Tailwind v4 (CSS-first, no tailwind.config.ts)

## Color Palette (Applied in finorg/app/globals.css)
| Token | Light | Dark |
|-------|-------|------|
| `--background` | #f8f8fc | #0b0b10 |
| `--card` | #ffffff | #111118 |
| `--primary` (brand) | #7c3aed | #8b5cf6 |
| `--sidebar` | #ffffff | #080810 |
| `--income` | #10b981 | #34d399 |
| `--expense` | #ef4444 | #f87171 |
| `--investment` | #7c3aed | #a78bfa |
| `--reserve` | #3b82f6 | #60a5fa |
| `--warning` | #f59e0b | #fbbf24 |

## Dark mode
- Class-based via `next-themes` (`attribute="class"`, `defaultTheme="dark"`)
- Tailwind variant: `@custom-variant dark (&:where(.dark, .dark *))`

## Components Built
- `components/ui/app-shell.tsx` — sidebar (desktop) + bottom nav (mobile) with theme toggle
- `components/ui/progress-bar.tsx` — financial progress bar with overflow/danger state
- `components/finance/kpi-card.tsx` — metric card (income/expense/investment/reserve variants)
- `components/finance/empty-state.tsx` — empty page state with icon + CTA
- `components/finance/category-badge.tsx` — semantic badge for transaction categories

## Typography
- **Font:** Geist Sans (`--font-geist-sans`) for UI
- **Mono:** Geist Mono (`--font-geist-mono`) for financial numbers (use `font-mono tabular-nums`)

## Layout Pattern
- Sidebar: 240px fixed left (lg+), hidden on mobile
- Mobile: sticky top bar + fixed bottom nav (5 items)
- Pages: `<div className="p-6 space-y-6/8">` inside AppShell's `<main>`
- Bottom nav padding: `pb-24 lg:pb-0`

## Utility Naming (Tailwind v4)
- `bg-income`, `text-income`, `bg-income/10` etc. all work
- `bg-card`, `bg-muted`, `text-muted-foreground` — shadcn-compatible
- `bg-sidebar`, `text-sidebar-muted`, etc. — sidebar tokens

## Stories Advanced
- Story 1.1 AC4 (dark mode with next-themes) ✅
- Story 2.1 T2 (dashboard layout shell with month nav, KPI grid, budget progress, alerts) ✅
- Story 7.2 AC3 (dark mode support) — architecture in place ✅

