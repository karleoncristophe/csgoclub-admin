import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { TextBadge } from '@/components/StatusPill'
import { listTable } from '@/components/ui/listTable'
import { formatSkinsPrice } from '@/constants/skinsCurrency'
import { useGetCasesQuery } from '@/redux/store/api/cases/api.cases'
import { getErrorMessage } from '@/utils/getErrorMessage'

export default function CasesPage() {
  const { data = [], isLoading, isError, error } = useGetCasesQuery()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle="Caixas de drop com economia calculada em tempo real (estilo CSGONet).">
          Caixas
        </PageTitle>
        <Link
          to="/dashboard/cases/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova caixa
        </Link>
      </div>

      <Surface variant="card" className="!p-6">
        {isLoading ? (
          <ThemeText tone="secondary" className="text-sm">
            Carregando caixas...
          </ThemeText>
        ) : null}

        {isError ? (
          <Surface variant="errorBanner">{getErrorMessage(error)}</Surface>
        ) : null}

        {!isLoading && data.length === 0 ? (
          <ThemeText tone="secondary" className="text-sm">
            Nenhuma caixa criada ainda.
          </ThemeText>
        ) : null}

        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.headRow}>
                  <th className={listTable.th}>Nome</th>
                  <th className={listTable.th}>Preço</th>
                  <th className={listTable.th}>VE</th>
                  <th className={listTable.th}>Margem</th>
                  <th className={listTable.th}>Itens</th>
                  <th className={listTable.th}>Aberturas</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th} />
                </tr>
              </thead>
              <tbody>
                {data.map((lootCase) => (
                  <tr key={lootCase._id} className={listTable.bodyRow}>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="font-medium">
                        {lootCase.name}
                      </ThemeText>
                      <ThemeText tone="faint" className="text-xs">
                        {lootCase.slug}
                      </ThemeText>
                    </td>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="text-sm font-medium">
                        {formatSkinsPrice(lootCase.price, lootCase.currency)}
                      </ThemeText>
                      {lootCase.discountPercent > 0 ? (
                        <ThemeText tone="faint" className="text-xs line-through">
                          {formatSkinsPrice(lootCase.listPrice, lootCase.currency)}
                        </ThemeText>
                      ) : null}
                    </td>
                    <td className={listTable.td}>
                      {formatSkinsPrice(lootCase.expectedValue, lootCase.currency)}
                    </td>
                    <td className={listTable.td}>{lootCase.realMarginPercent.toFixed(2)}%</td>
                    <td className={listTable.td}>{lootCase.items.length}</td>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="text-sm">
                        {lootCase.totalOpens}
                      </ThemeText>
                      {lootCase.totalTestOpens > 0 ? (
                        <ThemeText tone="faint" className="text-xs">
                          +{lootCase.totalTestOpens} teste
                        </ThemeText>
                      ) : null}
                    </td>
                    <td className={listTable.td}>
                      <TextBadge>
                        {lootCase.active ? 'Ativa' : 'Inativa'}
                      </TextBadge>
                    </td>
                    <td className={listTable.td}>
                      <Link
                        to={`/dashboard/cases/${lootCase._id}`}
                        className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Surface>
    </div>
  )
}
