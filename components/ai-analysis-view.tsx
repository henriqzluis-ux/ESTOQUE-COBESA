"use client"

import { generateAiAnalysis } from "@/app/actions/ai-analysis"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { Sparkles, Loader2, Send } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const blocks: React.ReactNode[] = []
  let list: string[] = []

  function flushList(key: string) {
    if (list.length === 0) return
    blocks.push(
      <ul key={key} className="ml-1 flex flex-col gap-1.5">
        {list.map((li, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/90">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{li}</span>
          </li>
        ))}
      </ul>,
    )
    list = []
  }

  lines.forEach((raw, idx) => {
    const line = raw.trim()
    if (line.startsWith("## ")) {
      flushList(`l-${idx}`)
      blocks.push(
        <h3
          key={`h-${idx}`}
          className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary first:mt-0"
        >
          {line.replace(/^##\s*/, "")}
        </h3>,
      )
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      list.push(line.replace(/^[-*]\s*/, "").replace(/\*\*/g, ""))
    } else if (line) {
      flushList(`l-${idx}`)
      blocks.push(
        <p key={`p-${idx}`} className="text-sm leading-relaxed text-foreground/90">
          {line.replace(/\*\*/g, "")}
        </p>,
      )
    }
  })
  flushList("l-end")
  return blocks
}

export function AiAnalysisView() {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [pending, startTransition] = useTransition()

  function run(q?: string) {
    setError(null)
    startTransition(async () => {
      try {
        const res = await generateAiAnalysis(q)
        setAnalysis(res.analysis)
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Não foi possível gerar a análise. Tente novamente."
        setError(message)
        toast.error("Falha ao gerar a análise")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Análise IA"
        description="Insights inteligentes sobre estoque, frota e manutenções"
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Pergunte à IA sobre a operação
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Quais peças devo comprar com urgência? Qual veículo está gerando mais custo?"
            rows={2}
            className="flex-1 resize-none"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => run(question.trim() || undefined)}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Perguntar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQuestion("")
                run()
              }}
              disabled={pending}
            >
              <Sparkles className="h-4 w-4" />
              Análise geral
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {pending ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analisando os dados da operação...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Sparkles className="h-7 w-7 text-destructive" />
            </div>
            <p className="font-medium text-foreground">Análise indisponível</p>
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          </div>
        ) : analysis ? (
          <div className="flex flex-col gap-2">{renderMarkdown(analysis)}</div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <p className="font-medium text-foreground">
              Gere insights com inteligência artificial
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              A IA analisa seu estoque, frota e manutenções para apontar riscos,
              prioridades de compra e recomendações. Clique em &quot;Análise
              geral&quot; para começar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
