import type { DocumentationEnumGroup } from './types'

export const DROP_METHOD_ENUMS: DocumentationEnumGroup = {
  title: 'Como o item foi entregue',
  description:
    'Aparece nos testes de abertura e na auditoria. Ajuda a entender se o sorteio foi direto ou se o sistema precisou ajustar o resultado.',
  entries: [
    {
      code: 'Direto',
      label: 'Sorteio aceito de primeira',
      hint: 'O item sorteado estava elegível: cabia no preço ou o banco cobria o valor dele.',
    },
    {
      code: 'Re-roll',
      label: 'Novo sorteio',
      hint: 'O item sorteado estava travado pelo banco; o sistema sorteou de novo só entre os elegíveis.',
    },
    {
      code: 'Fallback',
      label: 'Item de segurança',
      hint: 'Nenhum item estava elegível; entregou o mais barato do pool.',
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
      hint: 'Baseado no VE × (1 + margem alvo) que você definiu.',
    },
    {
      code: 'Pool elegível',
      label: 'Itens que podem sair agora',
      hint: 'Ex.: 4/6 = quatro skins liberadas, duas ainda esperando o banco.',
    },
    {
      code: 'Margem',
      label: 'Margem alvo do editor',
      hint: 'A mesma % que você definiu em Preço e margem — usada para sugerir o preço (VE × (1 + margem)).',
    },
    {
      code: 'Banco virtual',
      label: 'Saldo acumulado da caixa',
      hint:
        'Cada abertura injeta o VE; cada item caro ganho retira o valor dele. É esse saldo que libera ou trava as skins mais caras.',
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
      code: 'Banco exigido',
      label: 'Saldo necessário para liberar',
      hint: 'Item mais caro que a abertura só sai quando o banco tem o valor de mercado dele.',
    },
    {
      code: 'Margem alvo',
      label: 'Lucro desejado da caixa',
      hint: 'Sugere o preço e define quanto entra no banco por abertura (preço ÷ (1 + margem)).',
    },
    {
      code: 'Elegível',
      label: 'Pode sair agora?',
      hint: 'Sim = liberada. Não (banco) = item caro esperando o saldo acumular.',
    },
    {
      code: 'Tolerância',
      label: 'Folga na soma das chances',
      hint: 'Não tem relação com lucro — só validação matemática.',
    },
  ],
}
