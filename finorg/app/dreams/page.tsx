export default function DreamsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Sonhos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Metas financeiras, progresso e prazo estimado
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Em desenvolvimento</p>
        <p className="text-xs text-muted-foreground">
          Stories 4.1 a 4.5 — Cadastro, cálculo de acumulação, modo sonho ativo e realização
        </p>
      </div>
    </div>
  )
}
