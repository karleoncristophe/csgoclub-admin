import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Check,
  Send,
  Sparkles,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, type SkinsCurrency } from '@/constants/skinsCurrency'
import {
  useGetAiAssistantStatusQuery,
  useSendCaseAssistantMessageMutation,
  type AiCaseAssistantContext,
  type AiCaseDraft,
  type AiChatMessage,
} from '@/redux/store/api/ai/api.ai'
import { getErrorMessage } from '@/utils/getErrorMessage'

const THINKING_PHRASES = [
  'Consultando o catálogo de skins...',
  'Comparando preços e raridades...',
  'Distribuindo as chances de drop...',
  'Fechando o Valor Esperado da caixa...',
]

const STARTER_PROMPTS = [
  'Vou colar a tabela de skins de outra caixa. Monta uma igual aqui.',
  'Monta uma caixa de R$ 25 com foco em pistolas, 100% de chance somando.',
  'Adiciona a AK-47 Redline Field-Tested na lista com 0,5% de chance.',
  'Reequilibra as chances para a soma fechar em 100%.',
]

type ChatEntry = {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolTrace?: Array<{ name: string; summary: string }>
  draft?: AiCaseDraft | null
  isError?: boolean
}

export type CaseAiAssistantDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: AiCaseAssistantContext
  currency: SkinsCurrency
  onApplyDraft: (draft: AiCaseDraft) => void
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function ThinkingBubble() {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((index) => (index + 1) % THINKING_PHRASES.length)
    }, 2200)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        <Bot className="h-4 w-4" aria-hidden />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="flex gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" />
          </span>
          <ThemeText as="span" tone="secondary" className="text-xs">
            {THINKING_PHRASES[phraseIndex]}
          </ThemeText>
        </div>
      </div>
    </div>
  )
}

function DraftCard({
  draft,
  currency,
  onApply,
  applied,
}: {
  draft: AiCaseDraft
  currency: SkinsCurrency
  onApply: () => void
  applied: boolean
}) {
  const topItems = draft.items.slice(0, 5)

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <ThemeText as="span" tone="faint" className="block text-[10px] uppercase tracking-wide">
            Itens
          </ThemeText>
          <ThemeText as="span" tone="primary" className="text-sm font-semibold">
            {draft.items.length}
          </ThemeText>
        </div>
        <div>
          <ThemeText as="span" tone="faint" className="block text-[10px] uppercase tracking-wide">
            Soma chances
          </ThemeText>
          <ThemeText as="span" tone="primary" className="text-sm font-semibold">
            {draft.probabilitySum}%
          </ThemeText>
        </div>
        <div>
          <ThemeText as="span" tone="faint" className="block text-[10px] uppercase tracking-wide">
            Valor da caixa
          </ThemeText>
          <ThemeText as="span" tone="primary" className="text-sm font-semibold">
            {formatSkinsPrice(draft.expectedValue, currency)}
          </ThemeText>
        </div>
      </div>

      <ul className="space-y-1">
        {topItems.map((item) => (
          <li key={item.skinName} className="flex items-center gap-2">
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="h-6 w-8 shrink-0 rounded object-contain"
                loading="lazy"
              />
            ) : null}
            <ThemeText as="span" tone="secondary" className="min-w-0 flex-1 truncate text-xs">
              {item.skinName}
            </ThemeText>
            <ThemeText as="span" tone="muted" className="shrink-0 text-[11px] tabular-nums">
              {item.probability}%
            </ThemeText>
          </li>
        ))}
        {draft.items.length > topItems.length ? (
          <li>
            <ThemeText as="span" tone="faint" className="text-[11px]">
              + {draft.items.length - topItems.length} item(ns)
            </ThemeText>
          </li>
        ) : null}
      </ul>

      {draft.warnings.length > 0 ? (
        <ul className="space-y-1">
          {draft.warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-1.5">
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"
                aria-hidden
              />
              <ThemeText as="span" tone="warning" className="text-[11px]">
                {warning}
              </ThemeText>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant={applied ? 'secondary' : 'primary'}
        className="w-full"
        onClick={onApply}
      >
        {applied ? (
          <>
            <Check className="h-4 w-4" aria-hidden />
            Aplicar de novo
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden />
            Aplicar no formulário
          </>
        )}
      </Button>
    </div>
  )
}

export function CaseAiAssistantDrawer({
  open,
  onOpenChange,
  context,
  currency,
  onApplyDraft,
}: CaseAiAssistantDrawerProps) {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [appliedDraftId, setAppliedDraftId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: status } = useGetAiAssistantStatusQuery(undefined, { skip: !open })
  const [sendMessage, { isLoading }] = useSendCaseAssistantMessageMutation()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries, isLoading, open])

  const disabled = status?.enabled === false

  const history = useMemo<AiChatMessage[]>(
    () =>
      entries
        .filter((entry) => !entry.isError)
        .map((entry) => ({ role: entry.role, content: entry.content })),
    [entries],
  )

  const submit = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading || disabled) return

    const userEntry: ChatEntry = { id: createId(), role: 'user', content: trimmed }
    setEntries((current) => [...current, userEntry])
    setInput('')

    try {
      const reply = await sendMessage({
        messages: [...history, { role: 'user', content: trimmed }],
        context,
      }).unwrap()

      setEntries((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: reply.assistantMessage,
          toolTrace: reply.toolTrace,
          draft: reply.draft,
        },
      ])
    } catch (error) {
      setEntries((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: getErrorMessage(error),
          isError: true,
        },
      ])
    }
  }

  const handleApply = (entry: ChatEntry) => {
    if (!entry.draft) return
    onApplyDraft(entry.draft)
    setAppliedDraftId(entry.id)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-zinc-950/60"
        aria-label="Fechar assistente"
        onClick={() => onOpenChange(false)}
      />

      <Surface
        variant="sideDrawer"
        role="dialog"
        aria-modal="true"
        aria-label="Assistente de caixas"
        className="relative z-10 !max-w-xl !overflow-hidden"
      >
        <Surface
          variant="sideDrawerHeader"
          className="flex shrink-0 items-start justify-between gap-3 !px-5 !py-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <ThemeText as="h2" tone="primary" className="text-base font-semibold">
                Assistente de caixas
              </ThemeText>
              <ThemeText as="p" tone="faint" className="truncate text-xs">
                {status?.model
                  ? `Busca skins reais no catálogo · ${status.model}`
                  : 'Busca skins reais no catálogo'}
              </ThemeText>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {entries.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Limpar conversa"
                onClick={() => {
                  setEntries([])
                  setAppliedDraftId(null)
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Fechar"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </Surface>

        <div className="scrollbar-list min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {disabled ? (
            <Surface variant="errorBanner">
              O assistente não está configurado. Defina `OPENAI_API_KEY` no
              servidor da API e reinicie o backend.
            </Surface>
          ) : null}

          {entries.length === 0 && !disabled ? (
            <div className="space-y-3">
              <ThemeText as="p" tone="secondary" className="text-sm">
                Me diga o que você quer na caixa, ou cole a tabela de skins de
                outra caixa. Eu busco tudo no catálogo real, monto as chances e
                devolvo a proposta pronta para aplicar no formulário.
              </ThemeText>
              <div className="space-y-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-xs text-zinc-600 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
                    onClick={() => void submit(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {entries.map((entry) => {
            const isUser = entry.role === 'user'
            return (
              <div
                key={entry.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isUser
                      ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" aria-hidden />
                  ) : (
                    <Bot className="h-4 w-4" aria-hidden />
                  )}
                </div>

                <div className={`min-w-0 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block w-full rounded-2xl border px-4 py-3 text-left ${
                      isUser
                        ? 'rounded-tr-sm border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10'
                        : entry.isError
                          ? 'rounded-tl-sm border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40'
                          : 'rounded-tl-sm border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <ThemeText
                      as="p"
                      tone={entry.isError ? 'danger' : 'primary'}
                      className="whitespace-pre-wrap text-sm leading-relaxed"
                    >
                      {entry.content}
                    </ThemeText>

                    {entry.toolTrace?.length ? (
                      <ul className="mt-2 space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                        {entry.toolTrace.map((tool, index) => (
                          <li
                            key={`${entry.id}-${tool.name}-${index}`}
                            className="flex items-center gap-1.5"
                          >
                            <Wrench className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden />
                            <ThemeText as="span" tone="faint" className="text-[11px]">
                              {tool.summary}
                            </ThemeText>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {entry.draft ? (
                      <DraftCard
                        draft={entry.draft}
                        currency={currency}
                        applied={appliedDraftId === entry.id}
                        onApply={() => handleApply(entry)}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}

          {isLoading ? <ThinkingBubble /> : null}
          <div ref={messagesEndRef} />
        </div>

        <Surface
          variant="sideDrawerFooter"
          className="shrink-0 !justify-stretch !px-5 !py-4"
        >
          <div className="flex w-full items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void submit(input)
                }
              }}
              rows={2}
              maxLength={12000}
              disabled={disabled || isLoading}
              placeholder="Peça uma caixa, cole a tabela de skins de outro site ou mande um link"
              className="scrollbar-list max-h-32 min-h-[56px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
            <Button
              type="button"
              className="h-[56px] w-12 shrink-0 p-0"
              isLoading={isLoading}
              disabled={disabled || isLoading || !input.trim()}
              aria-label="Enviar"
              onClick={() => void submit(input)}
            >
              {isLoading ? null : <Send className="h-4 w-4" aria-hidden />}
            </Button>
          </div>
        </Surface>
      </Surface>
    </div>
  )
}
