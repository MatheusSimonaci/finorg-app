'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Sparkles,
  Settings,
  Moon,
  Sun,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/budget', label: 'Orçamento', icon: PieChart },
  { href: '/investments', label: 'Investimentos', icon: TrendingUp },
  { href: '/dreams', label: 'Sonhos', icon: Sparkles },
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
          'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
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
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-sidebar-accent text-primary'
          : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'stroke-[2px]')} />
      {label}
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex min-h-svh bg-background">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-sidebar-border bg-sidebar sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold text-sidebar-foreground tracking-tight truncate">
              FinOrg
            </span>
            <span className="block text-[10px] text-sidebar-muted leading-none">
              Finanças Pessoais
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
        <div className="px-3 pb-5 space-y-0.5 border-t border-sidebar-border pt-3">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/settings')
                ? 'bg-sidebar-accent text-primary'
                : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
            )}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            Configurações
          </Link>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-h-svh min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-foreground">FinOrg</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? (
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

        {/* Page content */}
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      {/* ─── Mobile bottom nav ─── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-sidebar-border bg-sidebar/95 backdrop-blur-sm safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} mobile />
          ))}
        </div>
      </nav>
    </div>
  )
}
