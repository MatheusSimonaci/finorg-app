export default function BudgetPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Orçamento</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Acompanhamento de gastos por categoria e % da renda
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Em desenvolvimento</p>
        <p className="text-xs text-muted-foreground">
          Stories 2.2 a 2.5 — Configuração por %, painel de orçamento, alertas, parcelas
        </p>
      </div>
    </div>
  )
}
