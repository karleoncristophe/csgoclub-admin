import { useMemo } from 'react'
import { sanitizeSkinDescriptionHtml } from '@/utils/skinDescriptionHtml'

type SkinDescriptionHtmlProps = {
  html?: string | null
  className?: string
}

export function SkinDescriptionHtml({ html, className = '' }: SkinDescriptionHtmlProps) {
  const safeHtml = useMemo(() => sanitizeSkinDescriptionHtml(html), [html])

  if (!safeHtml) return null

  return (
    <div
      className={`skin-description space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 [&_i]:italic ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
