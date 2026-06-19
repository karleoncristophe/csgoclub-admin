export type DocumentationCategory =
  | 'all'
  | 'visao-geral'
  | 'caixas-economia'
  | 'usuarios-inventario'
  | 'skins-catalogo'
  | 'operacao'

export type DocumentationEnumEntry = {
  code: string
  label: string
  hint?: string
}

export type DocumentationEnumGroup = {
  title: string
  description?: string
  entries: DocumentationEnumEntry[]
}

export type DocumentationField = {
  name: string
  label: string
  description: string
}

export type DocumentationItem = {
  id: string
  category: DocumentationCategory
  question: string
  answer: string
  bullets?: string[]
  fields?: DocumentationField[]
  enumGroups?: DocumentationEnumGroup[]
  tags?: string[]
}
