import { CsvUpload } from "@/components/finance/csv-upload"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ImportPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Importar Extrato</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Qualquer banco ou corretora — a IA mapeia automaticamente
          </p>
        </div>
      </div>

      <CsvUpload />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">Como funciona</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Formatos conhecidos (Nubank, XP, Bitybank) são detectados automaticamente.</p>
          <p>Qualquer outro banco ou corretora é mapeado pela IA — você revisa antes de confirmar.</p>
          <p>Aceita CSV, XLS e XLSX.</p>
        </div>
      </div>
    </div>
  )
}
