import { Package } from 'lucide-react'
import { ThemeText } from '@/components/ui/ThemeText'

type CaseListImageProps = {
  name: string
  imageUrl?: string | null
}

export function CaseListImage({ name, imageUrl }: CaseListImageProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 object-cover dark:border-zinc-700 dark:bg-zinc-900"
      />
    )
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
      aria-hidden
    >
      <Package className="h-5 w-5" />
      <span className="sr-only">{name}</span>
    </div>
  )
}

export function CaseListNameCell({
  name,
  slug,
  imageUrl,
}: CaseListImageProps & { slug: string }) {
  return (
    <div className="flex items-center gap-3">
      <CaseListImage name={name} imageUrl={imageUrl} />
      <div className="min-w-0">
        <ThemeText tone="primary" className="truncate font-medium">
          {name}
        </ThemeText>
        <ThemeText tone="faint" className="truncate text-xs">
          {slug}
        </ThemeText>
      </div>
    </div>
  )
}
