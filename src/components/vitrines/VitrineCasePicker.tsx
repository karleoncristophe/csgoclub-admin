import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LayoutGrid,
  Package,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { TextBadge } from '@/components/StatusPill'
import { ThemeText } from '@/components/ui/ThemeText'
import type { LootCase } from '@/redux/store/api/cases/api.cases'
import type { CaseVitrine } from '@/redux/store/api/case-vitrines/api.case-vitrines'

type VitrineCasePickerProps = {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  cases: LootCase[]
  vitrines: CaseVitrine[]
  disabled?: boolean
  isHero?: boolean
  currentVitrineId?: string | null
}

function formatCasePrice(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function moveId(ids: string[], fromId: string, toId: string) {
  if (fromId === toId) return ids
  const from = ids.indexOf(fromId)
  const to = ids.indexOf(toId)
  if (from < 0 || to < 0) return ids
  const next = [...ids]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function swapIndex(ids: string[], index: number, delta: -1 | 1) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= ids.length) return ids
  const next = [...ids]
  const current = next[index]
  next[index] = next[nextIndex]
  next[nextIndex] = current
  return next
}

function CaseThumb({
  imageUrl,
  name,
  className = 'h-12 w-12',
}: {
  imageUrl?: string
  name: string
  className?: string
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary ${className}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain p-1" />
      ) : (
        <Package className="h-5 w-5 text-zinc-400" />
      )}
      <span className="sr-only">{name}</span>
    </div>
  )
}

export function VitrineCasePicker({
  selectedIds,
  onChange,
  cases,
  vitrines,
  disabled = false,
  isHero = false,
  currentVitrineId = null,
}: VitrineCasePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [draftIds, setDraftIds] = useState(selectedIds)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  useEffect(() => {
    if (open) return
    setDraftIds(selectedIds)
  }, [open, selectedIds])

  const caseById = useMemo(
    () => new Map(cases.map((lootCase) => [lootCase._id, lootCase])),
    [cases],
  )
  const vitrineNameById = useMemo(
    () => new Map(vitrines.map((vitrine) => [vitrine._id, vitrine.name])),
    [vitrines],
  )

  const selectedCases = draftIds
    .map((id) => caseById.get(id))
    .filter((item): item is LootCase => Boolean(item))

  const query = search.trim().toLowerCase()
  const catalogCases = useMemo(() => {
    return [...cases]
      .filter((lootCase) => {
        if (!query) return true
        return `${lootCase.name} ${lootCase.slug}`.toLowerCase().includes(query)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [cases, query])

  const otherVitrineId = (lootCase: LootCase) => {
    if (!lootCase.vitrineId) return null
    if (String(lootCase.vitrineId) === String(currentVitrineId ?? '')) return null
    return String(lootCase.vitrineId)
  }

  const canSelect = (lootCase: LootCase) => isHero || !otherVitrineId(lootCase)

  const toggleCase = (lootCase: LootCase) => {
    if (disabled || !canSelect(lootCase)) return
    setDraftIds((current) =>
      current.includes(lootCase._id)
        ? current.filter((id) => id !== lootCase._id)
        : [...current, lootCase._id],
    )
  }

  const applyAndClose = () => {
    onChange(draftIds)
    setOpen(false)
    setSearch('')
    setDraggingId(null)
    setOverId(null)
  }

  const closeWithoutApply = () => {
    if (disabled) return
    setDraftIds(selectedIds)
    setOpen(false)
    setSearch('')
    setDraggingId(null)
    setOverId(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
            {isHero ? 'Caixas no hero da home' : 'Caixas nesta vitrine'}
          </ThemeText>
          <ThemeText as="p" tone="faint" className="mt-1 text-xs leading-relaxed">
            {isHero
              ? 'Qualquer caixa do catálogo. A ordem da lista é a ordem na faixa da home.'
              : 'Clique para escolher. Segure e arraste no modal para mudar a ordem no site.'}
          </ThemeText>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={disabled}
          onClick={() => {
            setDraftIds(selectedIds)
            setOpen(true)
          }}
        >
          <LayoutGrid className="h-4 w-4" />
          {selectedIds.length ? `Gerenciar caixas · ${selectedIds.length}` : 'Escolher caixas'}
        </Button>
      </div>

      {selectedIds.length === 0 ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setDraftIds(selectedIds)
            setOpen(true)
          }}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center transition hover:border-accent/40 hover:bg-accent-soft/30 disabled:opacity-60"
        >
          <Package className="h-7 w-7 text-zinc-400" />
          <ThemeText as="p" tone="secondary" className="text-sm">
            Nenhuma caixa nesta vitrine. Abra o catálogo para escolher.
          </ThemeText>
        </button>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {selectedIds.map((id, index) => {
            const lootCase = caseById.get(id)
            if (!lootCase) return null
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setDraftIds(selectedIds)
                  setOpen(true)
                }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface-secondary px-3 py-2 text-left transition hover:border-accent/40 disabled:opacity-60"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                  {index + 1}
                </span>
                <CaseThumb imageUrl={lootCase.imageUrl} name={lootCase.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {lootCase.name}
                  </span>
                  <span className="block text-xs text-muted">
                    {formatCasePrice(lootCase.price, lootCase.currency)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!next) closeWithoutApply()
        }}
        title="Escolher caixas"
        description="Clique para adicionar ou remover. Segure o card selecionado e arraste — ou use as setas — para a ordem no site."
        size="full"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeWithoutApply} disabled={disabled}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyAndClose} disabled={disabled}>
              Usar {draftIds.length} {draftIds.length === 1 ? 'caixa' : 'caixas'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Buscar caixa"
            name="vitrine-case-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou slug…"
            endAdornment={<Search className="h-4 w-4 text-zinc-400" />}
          />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <ThemeText as="h3" tone="primary" className="text-sm font-semibold">
                Ordem no site
              </ThemeText>
              <ThemeText as="p" tone="faint" className="text-xs">
                {selectedCases.length
                  ? 'Segure e arraste o card, ou use as setas'
                  : 'Nenhuma caixa selecionada ainda'}
              </ThemeText>
            </div>

            {selectedCases.length ? (
              <ul className="space-y-2">
                {selectedCases.map((lootCase, index) => {
                  const isDragging = draggingId === lootCase._id
                  const isOver = overId === lootCase._id && draggingId !== lootCase._id

                  return (
                    <li
                      key={lootCase._id}
                      draggable={!disabled}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', lootCase._id)
                        setDraggingId(lootCase._id)
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        if (draggingId && draggingId !== lootCase._id) {
                          setOverId(lootCase._id)
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const fromId = event.dataTransfer.getData('text/plain') || draggingId
                        if (fromId) setDraftIds((current) => moveId(current, fromId, lootCase._id))
                        setDraggingId(null)
                        setOverId(null)
                      }}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setOverId(null)
                      }}
                      className={`flex touch-none select-none items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                        isDragging
                          ? 'cursor-grabbing border-accent/50 bg-accent-soft opacity-70'
                          : isOver
                            ? 'cursor-grab border-accent bg-accent-soft/60'
                            : 'cursor-grab border-border bg-surface-secondary'
                      }`}
                    >
                      <GripVertical className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                        {index + 1}
                      </span>
                      <CaseThumb imageUrl={lootCase.imageUrl} name={lootCase.name} />
                      <div className="min-w-0 flex-1">
                        <ThemeText as="p" tone="primary" className="truncate text-sm font-medium">
                          {lootCase.name}
                        </ThemeText>
                        <ThemeText as="p" tone="faint" className="text-xs">
                          {formatCasePrice(lootCase.price, lootCase.currency)}
                          {lootCase.active ? '' : ' · inativa'}
                        </ThemeText>
                      </div>
                      <div
                        className="flex shrink-0 items-center gap-0.5"
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <IconButton
                          label="Subir"
                          disabled={disabled || index === 0}
                          onClick={() =>
                            setDraftIds((current) => swapIndex(current, index, -1))
                          }
                        >
                          <ChevronUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Descer"
                          disabled={disabled || index === selectedCases.length - 1}
                          onClick={() =>
                            setDraftIds((current) => swapIndex(current, index, 1))
                          }
                        >
                          <ChevronDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Remover"
                          variant="danger"
                          disabled={disabled}
                          onClick={() =>
                            setDraftIds((current) =>
                              current.filter((id) => id !== lootCase._id),
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                <ThemeText as="p" tone="secondary" className="text-sm">
                  Escolha caixas no catálogo abaixo.
                </ThemeText>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <ThemeText as="h3" tone="primary" className="text-sm font-semibold">
              Todas as caixas
            </ThemeText>

            {catalogCases.length === 0 ? (
              <ThemeText as="p" tone="secondary" className="py-6 text-center text-sm">
                {cases.length === 0
                  ? 'Nenhuma caixa cadastrada ainda.'
                  : 'Nenhuma caixa encontrada para esta busca.'}
              </ThemeText>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {catalogCases.map((lootCase) => {
                  const selected = draftIds.includes(lootCase._id)
                  const lockedVitrineId = otherVitrineId(lootCase)
                  const locked = Boolean(lockedVitrineId) && !isHero
                  const lockedName = lockedVitrineId
                    ? vitrineNameById.get(lockedVitrineId)
                    : null

                  return (
                    <button
                      key={lootCase._id}
                      type="button"
                      disabled={disabled || locked}
                      onClick={() => toggleCase(lootCase)}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                        selected
                          ? 'border-accent/50 bg-accent-soft'
                          : locked
                            ? 'cursor-not-allowed border-border opacity-60'
                            : 'border-border hover:border-accent/40 hover:bg-surface-secondary'
                      }`}
                    >
                      <CaseThumb imageUrl={lootCase.imageUrl} name={lootCase.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {lootCase.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-muted">
                            {formatCasePrice(lootCase.price, lootCase.currency)}
                          </span>
                          {!lootCase.active ? <TextBadge>Inativa</TextBadge> : null}
                          {lockedName ? (
                            <TextBadge>
                              {locked ? `Em ${lockedName}` : `Também em ${lockedName}`}
                            </TextBadge>
                          ) : null}
                        </span>
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-accent bg-accent text-white'
                            : 'border-border text-transparent'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </Modal>
    </div>
  )
}
