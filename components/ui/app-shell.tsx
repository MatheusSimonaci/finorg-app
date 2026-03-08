'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  LineChart,
  Settings,
  Moon,
  Sun,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/budget', label: 'Orçamento', icon: PieChart },
  { href: '/investments', label: 'Investimentos', icon: TrendingUp },
  { href: '/dreams', label: 'Sonhos', icon: Sparkles },
  { href: '/reserve', label: 'Reserva', icon: ShieldCheck },
  { href: '/projections', label: 'Projeções', icon: LineChart },
]
function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
  mobile = false,
}: {
  href: string
  label: string
  icon: React.ElementType
  pathname: string
  mobile?: boolean
}) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  if (mobile) {
    return (
      <Link
        href={href}
        className={cn(
          'flex flex-col items-center gap-0.5 px-3 py-2 rounded text-xs font-medium transition-colors flex-shrink-0',
          isActive
            ? 'text-primary'
            : 'text-sidebar-muted hover:text-sidebar-foreground',
        )}
      >
        <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
        <span className="truncate max-w-[56px] text-center">{label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-sidebar-accent text-primary border-l-2 border-primary/80'
          : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border-l-2 border-transparent',
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'stroke-[2px]')} />
      {label}
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch: theme is unknown during SSR
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <div className="flex min-h-svh bg-background">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-sidebar-border bg-sidebar sticky top-0 h-screen overflow-y-auto">
        {/* Yellow accent top line */}
        <div className="h-px bg-primary/40" />

        {/* Logo — Wayne Industries */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 border border-primary/30 text-primary flex-shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-primary tracking-[0.2em] truncate uppercase">
              FINORG
            </span>
            <span className="block text-[9px] text-sidebar-muted leading-none tracking-[0.12em] uppercase">
              Wayne Industries
            </span>
          </div>
        </div>

        <div className="px-3 mb-1">
          <div className="h-px bg-sidebar-border" />
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-sidebar-border pt-3">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all duration-150',
              pathname.startsWith('/settings')
                ? 'bg-sidebar-accent text-primary'
                : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
            )}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            Configurações
          </Link>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>

          {/* SISTEMA ONLINE indicator */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-income animate-pulse flex-shrink-0" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-sidebar-muted">
              Sistema Online
            </span>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-h-svh min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-primary/10 border border-primary/30 text-primary">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary tracking-[0.18em] uppercase leading-none">FINORG</span>
              <span className="text-[8px] text-muted-foreground tracking-[0.1em] uppercase leading-none">Wayne Industries</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/settings"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* ─── Batcomputer Status Ticker ─── */}
        <div className="hidden dark:flex border-b border-border/40 h-6 items-center bg-card/40 flex-shrink-0 ticker-track">
          <div className="ticker-inner font-mono text-[8px] tracking-[0.16em] uppercase select-none">
            {[0, 1].map((i) => (
              <span key={i} className="inline-flex items-center gap-5 pr-5 text-holo/38">
                <span><span className="text-income/55">&#9679;</span> FINORG BCv.978</span>
                <span className="text-primary/25">&#9656;</span>
                <span>ENC: AES-256-Q</span>
                <span className="text-primary/25">&#9656;</span>
                <span>BATCOMPUTER: ONLINE</span>
                <span className="text-primary/25">&#9656;</span>
                <span className="text-primary/45">STATUS: AUTORIZADO</span>
                <span className="text-primary/25">&#9656;</span>
                <span>USUÁRIO: B.WAYNE</span>
                <span className="text-primary/25">&#9656;</span>
                <span>MODO: TÁTICO</span>
                <span className="text-primary/25">&#9656;</span>
                <span>PROTOCOLO: ARKHAM</span>
                <span className="text-primary/25">&#9656;</span>
                <span className="text-primary/38">WAYNE IND. — CONFIDENCIAL</span>
                <span className="text-primary/25">&#9656;</span>
                <span>GOTHAM CITY • BATCAVERNA</span>
                <span className="text-primary/25">&#9656;</span>
              </span>
            ))}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      {/* ─── Mobile bottom nav ─── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-sidebar-border bg-sidebar/95 backdrop-blur-sm safe-area-inset-bottom">
        <div
          className="flex items-center px-2 py-1 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} mobile />
          ))}
        </div>
      </nav>
    </div>
  )
}
