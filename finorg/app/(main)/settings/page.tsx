import { ApiKeySection } from "./api-key-section"
import Link from "next/link"
import { Camera, Settings2 } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          API de IA, regras de classificação e parâmetros do sistema
        </p>
      </div>

      <ApiKeySection />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Classificação</h2>
        <Link
          href="/settings/rules"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Settings2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Regras de classificação</p>
              <p className="text-xs text-muted-foreground">Gerencie padrões que têm prioridade sobre a IA</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">→</span>
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Snapshot Mobile</h2>
        <Link
          href="/settings/snapshot"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Configurações do Snapshot</p>
              <p className="text-xs text-muted-foreground">Privacidade, senha e token Vercel para deploy</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">→</span>
        </Link>
      </div>
    </div>
  )
}

