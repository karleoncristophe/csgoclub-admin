import type { DocumentationEnumGroup, DocumentationField } from './types'

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
      hint: 'Soma do saldo real + bônus disponível. Gastos consomem bônus primeiro.',
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

export const UPGRADE_FORMULA_FIELDS: DocumentationField[] = [
  {
    name: 'chancePercent',
    label: 'Chance de vitória',
    description:
      '(valor apostado ÷ valor do alvo) × 71, limitada entre 1% e 95%. Ex.: aposta 100 em alvo 1000 → 7,1%.',
  },
  {
    name: 'idealTarget',
    label: 'Alvo ideal',
    description:
      'Inversa da fórmula: (aposta × 71) ÷ chance desejada. Serve para sugerir skin alvo com a % que o jogador quer.',
  },
  {
    name: 'winTickets',
    label: 'Tickets de vitória',
    description:
      'Pool de 100.000 tickets. Vitória = floor(chance% / 100 × 100.000). O ponteiro cai num ticket; se estiver na faixa win, ganha.',
  },
]

export const UPGRADE_RULE_ENUMS: DocumentationEnumGroup = {
  title: 'Regras rápidas do upgrade',
  entries: [
    {
      code: 'Fator 71',
      label: 'Margem embutida na roleta',
      hint: 'Já inclui a vantagem da casa — não some margem extra em cima.',
    },
    {
      code: 'Mín. 1%',
      label: 'Piso para jogar',
      hint: 'Abaixo de 1% o upgrade não abre.',
    },
    {
      code: 'Máx. 95%',
      label: 'Teto absoluto',
      hint: 'Mesmo apostando acima do alvo, a chance não passa de 95%.',
    },
    {
      code: 'Faixas de derrota',
      label: 'Só visual',
      hint: 'Redistribuem onde o ponteiro para no arco perdido — não mudam P(vitória).',
    },
  ],
}

export const ARENA_SCRIPT_ENUMS: DocumentationEnumGroup = {
  title: 'Pesos do script da partida',
  description: 'Sorteio do grupo de raridade da partida (soma 100):',
  entries: [
    {
      code: 'COMMON',
      label: '94%',
      hint: 'Partida comum — progresso mais frequente em crates baratas.',
    },
    {
      code: 'RARE',
      label: '5%',
      hint: 'Partida rara.',
    },
    {
      code: 'JACKPOT',
      label: '1%',
      hint: 'Partida jackpot — raridades altas no script.',
    },
  ],
}

export const ARENA_PROGRESS_ENUMS: DocumentationEnumGroup = {
  title: 'Progresso → crate',
  entries: [
    {
      code: '5 destroys',
      label: '1 crate',
      hint: 'A cada 5 alvos destruídos daquela raridade, o jogador recebe 1 crate da mesma raridade.',
    },
    {
      code: 'Preço da jogada',
      label: 'Lista − desconto',
      hint: 'Cobrado na carteira (ou ticket). Moeda congelada na entrada da partida.',
    },
    {
      code: 'Banco da crate',
      label: 'Sem margem',
      hint: 'Cada abertura injeta o preço cheio (não divide por 1+margem como nas caixas).',
    },
  ],
}

export const BATTLE_MODE_ENUMS: DocumentationEnumGroup = {
  title: 'Modos de battle',
  entries: [
    {
      code: 'classic',
      label: 'Clássico',
      hint: 'Ganha quem (ou o time que) acumula o maior valor total de drops.',
    },
    {
      code: 'crazy',
      label: 'Crazy',
      hint: 'Ganha quem acumula o menor valor — inverte a lógica.',
    },
  ],
}

export const BATTLE_FORMAT_ENUMS: DocumentationEnumGroup = {
  title: 'Formatos',
  entries: [
    {
      code: 'solo / FFA',
      label: 'Todos contra todos',
      hint: 'Cada assento compete sozinho.',
    },
    {
      code: '2v2',
      label: 'Dois times',
      hint: 'Soma os drops do time; vitória coletiva.',
    },
    {
      code: '3v3',
      label: 'Dois times de três',
      hint: 'Mesma lógica de time, com seis assentos.',
    },
  ],
}

export const CAMBIO_PROVIDER_ENUMS: DocumentationEnumGroup = {
  title: 'Cadeia de câmbio',
  description: 'Ordem de tentativa das cotações (todas em base USD):',
  entries: [
    {
      code: 'SkinsBack',
      label: 'Principal (sempre primeiro)',
      hint: 'Mesma cotação do catálogo — casa e jogador não se desalinham.',
    },
    {
      code: 'AwesomeAPI / Frankfurter',
      label: 'Reserva',
      hint: 'Só entram se a SkinsBack falhar. A reserva ativa é a marcada em Câmbio.',
    },
  ],
}

export const DEPOSIT_CREDIT_FIELDS: DocumentationField[] = [
  {
    name: 'paidWallet',
    label: 'Pago na carteira',
    description: 'Valor pago convertido para a moeda da carteira via câmbio (pivô USD).',
  },
  {
    name: 'cashbackWallet',
    label: 'Cashback',
    description:
      'percentual × valor creditado, limitado ao teto por moeda (BRL/USD/EUR) configurado na API de pagamento.',
  },
  {
    name: 'couponWallet',
    label: 'Bônus do cupom',
    description: 'Bônus em USD do cupom convertido para a carteira e somado ao crédito.',
  },
  {
    name: 'totalWallet',
    label: 'Total creditado',
    description: 'paidWallet + cashback + cupom.',
  },
]
