export default function InvestmentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Investimentos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Portfólio e alocação de ativos</p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Em desenvolvimento</p>
        <p className="text-xs text-muted-foreground">
          Stories 3.1 a 3.5 — Cadastro, visão de alocação, configuração e relatório de aportes
        </p>
      </div>
    </div>
  )
}
