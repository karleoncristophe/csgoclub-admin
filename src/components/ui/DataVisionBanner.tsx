import { useIsSandboxDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { ThemeText } from '@/components/ui/ThemeText'
import { userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

export function DataVisionBanner() {
  const isSandbox = useIsSandboxDataEnvironment()

  return (
    <div
      className={
        isSandbox ? userStatCardSpaciousClass.amber : userStatCardSpaciousClass.brand
      }
    >
      <ThemeText as="p" tone="primary" className="text-sm font-medium">
        {isSandbox ? 'Contando só influencer' : 'Contando só produção'}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-1 text-xs leading-relaxed">
        {isSandbox
          ? 'Aberturas, battles, arena, upgrade e swap ignoram o user normal. Catálogo (preço, skins, vitrines) é o mesmo dos dois lados.'
          : 'Testes de influencer não entram nestes números. Catálogo (preço, skins, vitrines) é o mesmo dos dois lados.'}
      </ThemeText>
    </div>
  )
}
