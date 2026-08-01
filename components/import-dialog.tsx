"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { bulkImportItems, type ItemInput } from "@/app/actions/inventory"
import { Download, FileSpreadsheet, UploadCloud, X } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

// Mapeia variações de nomes de coluna para os campos do sistema
const COLUMN_ALIASES: Record<keyof ItemInput, string[]> = {
  name: ["nome", "item", "descricao", "descrição", "produto", "peca", "peça"],
  reference: ["referencia", "referência", "ref", "codigo", "código", "cod"],
  category: ["categoria", "grupo", "tipo"],
  manufacturer: ["fabricante", "marca", "fornecedor"],
  quantity: ["quantidade", "qtd", "qtde", "estoque", "quant"],
  minQuantity: ["minimo", "mínimo", "qtd minima", "qtd mínima", "estoque minimo", "min"],
  unitPrice: ["preco", "preço", "valor", "preco unitario", "preço unitário", "custo"],
  location: ["localizacao", "localização", "local", "prateleira", "endereco", "endereço"],
}

function normalize(s: string) {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function parseNumber(val: unknown): number {
  if (typeof val === "number") return val
  if (!val) return 0
  const s = String(val).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function mapRows(raw: Record<string, unknown>[]): ItemInput[] {
  if (raw.length === 0) return []
  const headers = Object.keys(raw[0])

  // Resolve qual coluna corresponde a cada campo
  const fieldToHeader: Partial<Record<keyof ItemInput, string>> = {}
  for (const field of Object.keys(COLUMN_ALIASES) as (keyof ItemInput)[]) {
    const aliases = COLUMN_ALIASES[field]
    const found = headers.find((h) => aliases.includes(normalize(h)))
    if (found) fieldToHeader[field] = found
  }

  return raw.map((row) => ({
    name: fieldToHeader.name ? String(row[fieldToHeader.name] ?? "").trim() : "",
    reference: fieldToHeader.reference ? String(row[fieldToHeader.reference] ?? "").trim() : "",
    category: fieldToHeader.category ? String(row[fieldToHeader.category] ?? "").trim() : "",
    manufacturer: fieldToHeader.manufacturer
      ? String(row[fieldToHeader.manufacturer] ?? "").trim()
      : "",
    quantity: fieldToHeader.quantity ? parseNumber(row[fieldToHeader.quantity]) : 0,
    minQuantity: fieldToHeader.minQuantity ? parseNumber(row[fieldToHeader.minQuantity]) : 0,
    unitPrice: fieldToHeader.unitPrice ? parseNumber(row[fieldToHeader.unitPrice]) : 0,
    location: fieldToHeader.location ? String(row[fieldToHeader.location] ?? "").trim() : "",
  }))
}

export function ImportDialog({ open, onOpenChange, onImported }: Props) {
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ItemInput[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFileName(null)
    setParsed([])
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleClose(o: boolean) {
    if (!o) reset()
    onOpenChange(o)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
      const mapped = mapRows(raw).filter((r) => r.name)
      if (mapped.length === 0) {
        toast.error("Não foi possível reconhecer itens. Verifique se há uma coluna de nome.")
        return
      }
      setFileName(file.name)
      setParsed(mapped)
      toast.success(`${mapped.length} itens reconhecidos`)
    } catch {
      toast.error("Erro ao ler o arquivo. Use .xlsx, .xls ou .csv")
    }
  }

  function handleImport() {
    if (parsed.length === 0) return
    startTransition(async () => {
      try {
        const count = await bulkImportItems(parsed)
        toast.success(`${count} itens importados com sucesso`)
        reset()
        onOpenChange(false)
        onImported()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao importar")
      }
    })
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        Nome: "Filtro de óleo",
        Referência: "FLT-001",
        Categoria: "Filtros",
        Fabricante: "MANN",
        Quantidade: 10,
        "Qtd Mínima": 4,
        Preço: 35.9,
        Localização: "Prateleira A-01",
      },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Estoque")
    XLSX.writeFile(wb, "modelo-estoque.xlsx")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Planilha de Estoque</DialogTitle>
          <DialogDescription>
            Envie um arquivo Excel (.xlsx, .xls) ou CSV com os itens do estoque. As colunas são
            reconhecidas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-foreground">Não sabe como formatar?</p>
              <p className="text-muted-foreground">Baixe nosso modelo de planilha.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Baixar modelo
            </Button>
          </div>

          {parsed.length === 0 ? (
            <label
              htmlFor="import-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">Clique para selecionar o arquivo</p>
              <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</p>
              <input
                id="import-file"
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={handleFile}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsed.length} itens prontos para importar
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remover arquivo</span>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleImport} disabled={parsed.length === 0 || isPending}>
            {isPending ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
