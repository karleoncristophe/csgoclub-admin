import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { linkBrand, listTable } from '@/components/ui/listTable'
import { StatusPill, TextBadge } from '@/components/StatusPill'
import useDebounce from '@/hooks/useDebounce'
import { labelFilterBoolean, labelUserAppRole } from '@/i18n/enumLabels'
import { useGetUsersQuery } from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const
const DEFAULT_PAGE_SIZE = 20

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function parseActiveFilter(value: string): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE)

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  const safePage = Math.max(page, 1)

  const { data, isLoading, isFetching, isError, error } = useGetUsersQuery({
    page: safePage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
    role: roleFilter ? (roleFilter as 'ADMIN' | 'USER') : undefined,
    active: parseActiveFilter(activeFilter),
    includeDeleted: includeDeleted || undefined,
  })

  const users = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const currentPage = Math.min(safePage, totalPages)
  const pageLimit = data?.limit ?? itemsPerPage
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageLimit + 1
  const pageEnd = Math.min(currentPage * pageLimit, total)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Usuários Steam com busca, filtros e paginação server-side.">
        Usuários
      </PageTitle>

      <Surface variant="card" className="!p-6 sm:!p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            label="Buscar"
            name="searchUser"
            placeholder="Nome, Steam ID ou _id..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              resetPage()
            }}
            autoComplete="off"
          />

          <Select
            label="Papel"
            name="role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              resetPage()
            }}
          >
            <option value="">Todos</option>
            <option value="USER">{labelUserAppRole('USER')}</option>
            <option value="ADMIN">{labelUserAppRole('ADMIN')}</option>
          </Select>

          <Select
            label="Ativo"
            name="active"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value)
              resetPage()
            }}
          >
            <option value="">Todos</option>
            <option value="true">{labelFilterBoolean('true')}</option>
            <option value="false">{labelFilterBoolean('false')}</option>
          </Select>

          <Select
            label="Itens por página"
            name="pageSize"
            value={String(itemsPerPage)}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              resetPage()
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>

          <div className="flex items-end pb-1">
            <Checkbox
              name="includeDeleted"
              label="Incluir removidos"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked)
                resetPage()
              }}
            />
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Surface variant="statTile" className="!p-4">
            <ThemeText as="p" tone="label" className="text-xs uppercase">
              Página atual
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
              {users.length}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-xs">
              itens ({pageStart}-{pageEnd}) · {pageLimit}/página
            </ThemeText>
          </Surface>
          <Surface variant="statTile" className="!p-4">
            <ThemeText as="p" tone="label" className="text-xs uppercase">
              Total filtrado
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
              {total}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-xs">
              páginas: {totalPages}
            </ThemeText>
          </Surface>
          <Surface variant="statTile" className="!p-4">
            <ThemeText as="p" tone="label" className="text-xs uppercase">
              Página
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
              {currentPage} / {totalPages}
            </ThemeText>
          </Surface>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            Carregando usuários...
          </div>
        ) : null}

        {isError ? (
          <p className={`mb-4 ${surfaceClass('errorBanner')}`}>
            {getErrorMessage(error)}
          </p>
        ) : null}

        {!isLoading && !isError ? (
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Usuário</th>
                  <th className={listTable.th}>Steam ID</th>
                  <th className={listTable.th}>Papel</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th}>Trade URL</th>
                  <th className={listTable.th}>Último login</th>
                  <th className={listTable.th}>Criado em</th>
                  <th className={listTable.th}>Ações</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={listTable.empty}>
                      Nenhum usuário encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className={listTable.tr}>
                      <td className={listTable.tdStrong}>
                        <div className="flex items-center gap-3">
                          {user.avatarMedium || user.avatar ? (
                            <img
                              src={user.avatarMedium ?? user.avatar}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                              loading="lazy"
                            />
                          ) : (
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              aria-hidden
                            >
                              {user.name?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          )}
                          <div className="min-w-0">
                            {user.profileUrl ? (
                              <a
                                href={user.profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                              >
                                {user.name}
                              </a>
                            ) : (
                              <span className="truncate">{user.name}</span>
                            )}
                            <ThemeText as="p" tone="faint" className="truncate text-xs">
                              {user._id}
                            </ThemeText>
                          </div>
                        </div>
                      </td>
                      <td className={listTable.tdMuted}>{user.steamId}</td>
                      <td className={listTable.td}>
                        <TextBadge>{labelUserAppRole(user.role)}</TextBadge>
                      </td>
                      <td className={listTable.td}>
                        <StatusPill active={user.active} deleted={user.deleted} />
                      </td>
                      <td className={listTable.td}>
                        {user.tradePartner ? (
                          <TextBadge>Configurada</TextBadge>
                        ) : (
                          <ThemeText as="span" tone="faint" className="text-xs">
                            —
                          </ThemeText>
                        )}
                      </td>
                      <td className={listTable.tdMuted}>
                        {formatDateTime(user.lastLoginAt)}
                      </td>
                      <td className={listTable.tdMuted}>
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className={listTable.td}>
                        <Link to={`/dashboard/users/${user._id}`} className={linkBrand}>
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        <Pagination
          className="mt-6"
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(next) => setPage(Math.min(Math.max(next, 1), totalPages))}
        />

        {isFetching && !isLoading ? (
          <ThemeText as="p" tone="faint" className="mt-3 text-center text-xs">
            Atualizando página...
          </ThemeText>
        ) : null}
      </Surface>
    </div>
  )
}
