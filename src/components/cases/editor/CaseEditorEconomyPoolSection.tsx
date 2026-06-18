import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { CaseListImage } from '@/components/cases/CaseListImage'
import { Pagination } from '@/components/ui/Pagination'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import useDebounce from '@/hooks/useDebounce'
import type { CaseEconomyLedger } from '@/redux/store/api/cases/api.cases'

const CASE_POOL_PAGE_SIZE = 12

const casePoolCardClass = {
  selected:
    'border-brand-500 bg-brand-50/90 shadow-sm shadow-brand-500/10 ' +
    'dark:border-brand-400/50 dark:bg-brand-500/10 dark:shadow-brand-500/5 dark:ring-1 dark:ring-brand-400/20',
  default:
    'border-zinc-200 bg-white hover:border-brand-300 hover:bg-brand-50/40 ' +
    'dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-brand-700 dark:hover:bg-brand-950/30',
} as const

const casePoolCheckClass = {
  selected:
    'border-brand-500 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-500',
  default:
    'border-zinc-200 bg-zinc-50 text-transparent dark:border-zinc-600 dark:bg-zinc-800/80',
} as const

export type CaseEconomyPoolOption = {
  _id: string
  name: string
  slug: string
  imageUrl?: string
  active: boolean
  price: number
}

type CaseEditorEconomyPoolSectionProps = {
  currency: SkinsCurrency
  currentCaseId?: string
  sharedCaseIds: string[]
  availableCases: CaseEconomyPoolOption[]
  economyLedger?: CaseEconomyLedger
  onSharedCaseIdsChange: (ids: string[]) => void
}

export function CaseEditorEconomyPoolSection({
  currency,
  currentCaseId,
  sharedCaseIds,
  availableCases,
  economyLedger,
  onSharedCaseIdsChange,
}: CaseEditorEconomyPoolSectionProps) {
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const listAnchorRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchInput.trim().toLowerCase(), 300)

  const selectableCases = useMemo(
    () => availableCases.filter((item) => item._id !== currentCaseId),
    [availableCases, currentCaseId],
  )

  const filteredCases = useMemo(() => {
    if (!debouncedSearch) return selectableCases
    return selectableCases.filter((lootCase) => {
      const haystack = `${lootCase.name} ${lootCase.slug}`.toLowerCase()
      return haystack.includes(debouncedSearch)
    })
  }, [selectableCases, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / CASE_POOL_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart =
    filteredCases.length === 0 ? 0 : (currentPage - 1) * CASE_POOL_PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * CASE_POOL_PAGE_SIZE, filteredCases.length)

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * CASE_POOL_PAGE_SIZE
    return filteredCases.slice(start, start + CASE_POOL_PAGE_SIZE)
  }, [filteredCases, currentPage])

  const selectedCases = useMemo(
    () => selectableCases.filter((item) => sharedCaseIds.includes(item._id)),
    [selectableCases, sharedCaseIds],
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const toggleCase = (caseId: string) => {
    if (sharedCaseIds.includes(caseId)) {
      onSharedCaseIdsChange(sharedCaseIds.filter((id) => id !== caseId))
      return
    }
    onSharedCaseIdsChange([...sharedCaseIds, caseId])
  }

  const removeCase = (caseId: string) => {
    onSharedCaseIdsChange(sharedCaseIds.filter((id) => id !== caseId))
  }

  return (
    <Surface variant="card" className="!p-6">
      <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
        Margem acumulada compartilhada
      </ThemeText>
      <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
        Aberturas reais das caixas selecionadas entram no mesmo ledger. Clique nas caixas abaixo
        para adicionar ou remover do grupo.
      </ThemeText>

      {economyLedger ? (
        <div className="mb-4 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-3">
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Receita acumulada
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(economyLedger.totalRevenue, currency)}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Payout acumulado
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(economyLedger.totalPayout, currency)}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Aberturas reais
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
              {economyLedger.totalRealOpens ?? 0}
            </ThemeText>
          </div>
        </div>
      ) : null}

      {selectedCases.length > 0 ? (
        <div className="mb-4">
          <ThemeText tone="label" className="mb-2 text-xs uppercase">
            Selecionadas ({selectedCases.length})
          </ThemeText>
          <div className="flex flex-wrap gap-2">
            {selectedCases.map((lootCase) => (
              <span
                key={lootCase._id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <span className="truncate">{lootCase.name}</span>
                <button
                  type="button"
                  onClick={() => removeCase(lootCase._id)}
                  className="rounded-md p-0.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
                  aria-label={`Remover ${lootCase.name}`}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <ThemeText as="p" tone="faint" className="mb-4 text-xs">
          Nenhuma outra caixa selecionada — ledger isolado nesta caixa.
        </ThemeText>
      )}

      {selectableCases.length === 0 ? (
        <ThemeText tone="secondary" className="text-sm">
          Crie outras caixas para habilitar o compartilhamento de margem.
        </ThemeText>
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar caixa por nome ou slug..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              autoComplete="off"
            />
          </div>

          {filteredCases.length === 0 ? (
            <ThemeText tone="secondary" className="text-sm">
              Nenhuma caixa encontrada com esse filtro.
            </ThemeText>
          ) : (
            <>
              <ThemeText tone="label" className="mb-3 text-xs">
                {pageStart}–{pageEnd} de {filteredCases.length} caixas
              </ThemeText>

              <div
                ref={listAnchorRef}
                className="scroll-mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {paginatedCases.map((lootCase) => {
                  const selected = sharedCaseIds.includes(lootCase._id)
                  return (
                    <button
                      key={lootCase._id}
                      type="button"
                      onClick={() => toggleCase(lootCase._id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                        selected ? casePoolCardClass.selected : casePoolCardClass.default
                      }`}
                    >
                      <CaseListImage name={lootCase.name} imageUrl={lootCase.imageUrl} />
                      <div className="min-w-0 flex-1">
                        <ThemeText
                          tone="primary"
                          className={`line-clamp-2 text-xs font-semibold ${
                            selected ? 'text-zinc-900 dark:text-zinc-50' : ''
                          }`}
                        >
                          {lootCase.name}
                        </ThemeText>
                        <ThemeText
                          tone="secondary"
                          className={`mt-0.5 truncate text-[11px] ${
                            selected ? 'text-zinc-600 dark:text-zinc-300' : ''
                          }`}
                        >
                          {lootCase.slug}
                        </ThemeText>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={
                              selected
                                ? 'inline-flex rounded-full bg-zinc-200/90 px-2 py-0.5 text-[10px] font-medium text-zinc-800 ring-1 ring-inset ring-zinc-400/20 dark:bg-zinc-700/90 dark:text-zinc-100 dark:ring-zinc-500/30'
                                : 'inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 ring-1 ring-inset ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600/35'
                            }
                          >
                            {lootCase.active ? 'Ativa' : 'Inativa'}
                          </span>
                          <ThemeText
                            tone="secondary"
                            className={`text-[11px] font-medium ${
                              selected ? 'text-zinc-700 dark:text-zinc-200' : ''
                            }`}
                          >
                            {formatSkinsPrice(lootCase.price, currency)}
                          </ThemeText>
                        </div>
                      </div>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                          selected ? casePoolCheckClass.selected : casePoolCheckClass.default
                        }`}
                        aria-hidden
                      >
                        {selected ? <Check className="h-4 w-4" /> : null}
                      </span>
                    </button>
                  )
                })}
              </div>

              <Pagination
                className="mt-6"
                page={currentPage}
                totalPages={totalPages}
                scrollTargetRef={listAnchorRef}
                onPageChange={(next) =>
                  setPage(Math.min(Math.max(next, 1), totalPages))
                }
              />
            </>
          )}
        </>
      )}
    </Surface>
  )
}
