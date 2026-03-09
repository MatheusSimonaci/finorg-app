'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function DreamAchievedPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    const timer = setTimeout(() => router.push('/dreams'), 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
        <span className="text-8xl">🎉</span>
        <CheckCircle2 className="h-16 w-16 text-yellow-500" />
        <h1 className="text-3xl font-bold tracking-tight">Parabéns!</h1>
        <p className="text-lg text-muted-foreground max-w-sm">
          Você realizou mais um sonho! Cada conquista é a prova de que a disciplina financeira vale a pena.
        </p>
        <p className="text-sm text-muted-foreground mt-2">Redirecionando em 5 segundos…</p>
        <button
          onClick={() => router.push('/dreams')}
          className="mt-2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Ver meus sonhos
        </button>
      </div>
    </div>
  )
}
