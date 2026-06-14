import { Surface } from '@/components/ui/Surface'
import { Select } from '@/components/ui/Select'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import {
  ADMIN_COUNTRY_OPTIONS,
  countryLabel,
  currencyForCountry,
} from '@/constants/countryCurrency'
import {
  formatSkinsPrice,
  SKINS_CURRENCY_OPTIONS,
  SkinsCurrency,
} from '@/constants/skinsCurrency'
import { useAdminPreferences } from '@/theme/AdminPreferencesContext'

export default function SettingsPage() {
  const { countryCode, skinsCurrency, setCountryCode, setSkinsCurrency } =
    useAdminPreferences()

  const suggestedCurrency = currencyForCountry(countryCode)

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Preferências do painel administrativo.">
        Configurações
      </PageTitle>

      <Surface variant="card" className="!p-6">
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Regional
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
          Define a moeda padrão usada no catálogo de skins, inventários e novas caixas.
          Ao escolher o país, a moeda é sugerida automaticamente; países sem mapeamento
          usam Real (BRL).
        </ThemeText>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="País"
            name="countryCode"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {ADMIN_COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            label="Moeda padrão do admin"
            name="skinsCurrency"
            value={skinsCurrency}
            onChange={(e) => setSkinsCurrency(e.target.value as SkinsCurrency)}
          >
            {SKINS_CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Surface variant="settingsPanel" className="mt-6 !p-4">
          <ThemeText as="p" tone="label" className="mb-2 text-xs uppercase tracking-wide">
            Resumo
          </ThemeText>
          <ThemeText as="p" tone="primary" className="text-sm">
            País: <strong>{countryLabel(countryCode)}</strong>
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Moeda sugerida pelo país:{' '}
            <strong>{SKINS_CURRENCY_OPTIONS.find((o) => o.value === suggestedCurrency)?.label}</strong>
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Moeda ativa no admin:{' '}
            <strong>{SKINS_CURRENCY_OPTIONS.find((o) => o.value === skinsCurrency)?.label}</strong>
          </ThemeText>
          <ThemeText as="p" tone="faint" className="mt-2 text-xs">
            Exemplo de formatação: {formatSkinsPrice(1234.56, skinsCurrency)}
          </ThemeText>
        </Surface>
      </Surface>
    </div>
  )
}
