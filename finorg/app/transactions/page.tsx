import { Upload, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TransactionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Importação e classificação com IA</p>
        </div>
        <Link
          href="/transactions/import"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Importar CSV
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          {
            title: "Importar extrato",
            desc: "Nubank, XP ou Bitybank — detecção automática",
            href: "/transactions/import",
          },
          {
            title: "Revisar importações",
            desc: "Corrija classificações com baixa confiança",
            href: "/transactions",
          },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
