import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Link2, RotateCcw } from 'lucide-react'
import { Button, Switch } from '@heroui/react'
import { ThemeControls } from '@/components/ui/ThemeControls'
import { Tooltip } from '@/components/ui/Tooltip'
import { PageTitle } from '@/components/ui/Title'
import { useTheme } from '@/theme/ThemeContext'
import { DEFAULT_APPEARANCE } from '@/theme/themeConfig'
import { themeShareSearchParams, themeShareUrl } from '@/theme/themeSearchParams'
import { ThemeComponentsLab } from './ThemeComponentsLab'

export default function ThemeBuilderPage() {
  const [copied, setCopied] = useState(false)
  const { appearance, setAppearance, theme, vibrantPalette, setVibrantPalette } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const search = themeShareSearchParams(appearance, theme, vibrantPalette).toString()
    if (location.search.replace(/^\?/, '') === search) return
    navigate({ pathname: location.pathname, search }, { replace: true })
  }, [appearance, theme, vibrantPalette, location.pathname, location.search, navigate])

  async function copyShareLink() {
    const url = themeShareUrl(appearance, theme, vibrantPalette)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      window.prompt('Copie o link da configuração', url)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle subtitle="Ajuste acento, fonte e raios. O link copia a configuração atual.">
          Tema
        </PageTitle>
        <div className="flex items-center gap-1.5">
          <Tooltip
            className="hidden sm:inline-flex"
            content="Satura success, warning e danger — pills Ativo/Inativo, botão perigo, chips e gráficos"
            placement="bottom"
          >
            <Switch
              aria-label="Paleta vibrante"
              className="hidden sm:flex"
              isSelected={vibrantPalette}
              onChange={setVibrantPalette}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <span className="hidden text-xs text-muted lg:inline">Vibrante</span>
              </Switch.Content>
            </Switch>
          </Tooltip>
          <Tooltip content="Copiar link da configuração" placement="bottom">
            <Button
              isIconOnly
              aria-label="Copiar link da configuração"
              size="sm"
              variant="tertiary"
              onPress={() => void copyShareLink()}
            >
              {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
            </Button>
          </Tooltip>
          <Tooltip content="Restaurar tema padrão" placement="bottom">
            <Button
              isIconOnly
              aria-label="Restaurar tema padrão"
              size="sm"
              variant="tertiary"
              onPress={() => {
                setAppearance(DEFAULT_APPEARANCE)
                setVibrantPalette(false)
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <ThemeComponentsLab />

      <div className="mt-6 min-w-0">
        <ThemeControls />
      </div>

      {copied ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-overlay px-4 py-2.5 text-sm font-medium text-overlay-foreground shadow-overlay"
        >
          Link da configuração copiado
        </div>
      ) : null}
    </div>
  )
}
