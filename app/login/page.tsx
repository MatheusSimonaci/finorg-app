import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { Shield } from 'lucide-react'

export default async function LoginPage() {
  const signInUrl = await getSignInUrl()

  return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center">
      {/* Top accent line */}
      <div className="fixed top-0 inset-x-0 h-px bg-primary/40" />

      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="flex items-center justify-center w-14 h-14 rounded bg-primary/10 border border-primary/30 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-primary tracking-[0.3em] uppercase">
              FINORG
            </p>
            <p className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
              Sistema Financeiro Pessoal
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded p-8 space-y-6">
          {/* Corner brackets */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-3 h-3 border-t border-l border-primary/30" />
            <div className="absolute -bottom-4 -right-4 w-3 h-3 border-b border-r border-primary/30" />

            <div className="space-y-2 mb-6">
              <h1 className="text-base font-semibold text-foreground tracking-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-muted-foreground">
                Acesse sua conta para continuar
              </p>
            </div>

            <a
              href={signInUrl}
              className="block w-full text-center py-3 px-4 rounded bg-primary text-primary-foreground text-xs font-bold tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors"
            >
              Entrar
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-6 tracking-wider">
          Autenticação segura por{' '}
          <span className="text-primary/60">WorkOS</span>
          {' · '}
          <span className="opacity-40">FinOrg App v1.0</span>
        </p>
      </div>
    </div>
  )
}
