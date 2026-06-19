import type { DocumentationEnumGroup } from './types'

export const DROP_METHOD_ENUMS: DocumentationEnumGroup = {
  title: 'Como o item foi entregue',
  description:
    'Aparece nos testes de abertura e na auditoria. Ajuda a entender se o sorteio foi direto ou se o sistema precisou ajustar o resultado.',
  entries: [
    {
      code: 'Direto',
      label: 'Sorteio aceito de primeira',
      hint: 'O item sorteado já podia sair com as regras atuais.',
    },
    {
      code: 'Re-roll',
      label: 'Novo sorteio',
      hint: 'O primeiro item não podia sair; o sistema sorteou de novo.',
    },
    {
      code: 'Fallback',
      label: 'Item de segurança',
      hint: 'Depois de várias tentativas, entregou o item barato elegível.',
    },
  ],
}

export const USER_TYPE_ENUMS: DocumentationEnumGroup = {
  title: 'Tipos de usuário',
  entries: [
    {
      code: 'Padrão',
      label: 'Jogador normal',
      hint: 'Usa saldo real. Pode sacar o que ganhar, conforme regras do site.',
    },
    {
      code: 'Influencer',
      label: 'Afiliado de teste',
      hint: 'Abre caixas com saldo bônus fake. Não saca. Serve para demonstrar e testar.',
    },
  ],
}

export const WALLET_BALANCE_ENUMS: DocumentationEnumGroup = {
  title: 'Tipos de saldo',
  entries: [
    {
      code: 'Saldo real',
      label: 'Dinheiro de verdade',
      hint: 'Vem de depósito. Pode ser sacado.',
    },
    {
      code: 'Saldo bônus',
      label: 'Crédito de teste',
      hint: 'Só para influencers. Abre caixa, mas não vira saque.',
    },
    {
      code: 'Total para caixas',
      label: 'Quanto pode gastar abrindo',
      hint: 'Soma do saldo real + bônus disponível.',
    },
    {
      code: 'Sacável',
      label: 'Quanto pode retirar',
      hint: 'Apenas o saldo real — nunca o bônus.',
    },
  ],
}

export const INVENTORY_STATUS_ENUMS: DocumentationEnumGroup = {
  title: 'Status do item no inventário do site',
  entries: [
    {
      code: 'Ativo',
      label: 'Guardado na plataforma',
      hint: 'O jogador ainda não converteu em saldo.',
    },
    {
      code: 'Convertido',
      label: 'Virou saldo',
      hint: 'O valor fixo do item foi creditado na carteira.',
    },
  ],
}

export const CURRENCY_ENUMS: DocumentationEnumGroup = {
  title: 'Moedas suportadas',
  description:
    'O painel, as caixas e a carteira do usuário podem usar moedas diferentes. Veja cada contexto abaixo.',
  entries: [
    {
      code: 'BRL',
      label: 'Real brasileiro',
      hint: 'Padrão no Brasil. Formato pt-BR.',
    },
    {
      code: 'USD',
      label: 'Dólar americano',
      hint: 'Comum em testes e referência internacional.',
    },
    {
      code: 'EUR',
      label: 'Euro',
      hint: 'Usado para países da zona euro.',
    },
  ],
}

export const ECONOMY_PANEL_FIELDS: DocumentationEnumGroup = {
  title: 'Números do painel de economia',
  description: 'O que cada card do editor de caixas está te contando:',
  entries: [
    {
      code: 'VE',
      label: 'Valor esperado',
      hint: 'Quanto a caixa devolve em média por abertura, no papel.',
    },
    {
      code: 'Preço sugerido',
      label: 'Sugestão automática',
      hint: 'Baseado no VE + margem alvo que você definiu.',
    },
    {
      code: 'Pool elegível',
      label: 'Itens que podem sair agora',
      hint: 'Ex.: 4/6 = quatro skins liberadas, duas ainda bloqueadas.',
    },
    {
      code: 'Margem real',
      label: 'Lucro no design',
      hint: 'Diferença entre preço da caixa e VE — antes de abrir de verdade.',
    },
    {
      code: 'Ledger',
      label: 'Histórico real de aberturas',
      hint: 'Quanto já entrou e quanto já saiu em skins nas aberturas reais.',
    },
  ],
}

export const CASE_EDITOR_FIELDS: DocumentationEnumGroup = {
  title: 'Campos mais usados no editor',
  entries: [
    {
      code: 'Drop %',
      label: 'Chance no sorteio',
      hint: 'Peso de cada skin na roleta. Não é garantia se estiver bloqueada.',
    },
    {
      code: 'Margem mín.',
      label: 'Proteção por item',
      hint: 'Impede entregar aquela skin se quebrar o lucro mínimo.',
    },
    {
      code: 'Margem alvo',
      label: 'Lucro desejado da caixa',
      hint: 'Usada para sugerir o preço de abertura.',
    },
    {
      code: 'Elegível',
      label: 'Pode sair agora?',
      hint: 'Sim = liberada. Não (ledger) = item caro aguardando histórico.',
    },
    {
      code: 'Tolerância',
      label: 'Folga na soma das chances',
      hint: 'Não tem relação com lucro — só validação matemática.',
    },
  ],
}
