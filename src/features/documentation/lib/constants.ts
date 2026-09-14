import {
  ArrowLeftRight,
  BookOpenText,
  Calculator,
  Crosshair,
  Gem,
  HelpCircle,
  Package,
  Settings,
  Swords,
  TicketPercent,
  Users,
  Wallet,
} from 'lucide-react'
import {
  ARENA_PROGRESS_ENUMS,
  ARENA_SCRIPT_ENUMS,
  BATTLE_FORMAT_ENUMS,
  BATTLE_MODE_ENUMS,
  CAMBIO_PROVIDER_ENUMS,
  CASE_EDITOR_FIELDS,
  CURRENCY_ENUMS,
  DEPOSIT_CREDIT_FIELDS,
  DROP_METHOD_ENUMS,
  ECONOMY_PANEL_FIELDS,
  INVENTORY_STATUS_ENUMS,
  UPGRADE_FORMULA_FIELDS,
  UPGRADE_RULE_ENUMS,
  USER_TYPE_ENUMS,
  WALLET_BALANCE_ENUMS,
} from '@/features/documentation/lib/documentationReference'
import type { DocumentationCategory, DocumentationItem } from './types'

export const DOCUMENTATION_DATA: DocumentationItem[] = [
  // ── Visão geral ──────────────────────────────────────────
  {
    id: 'overview-1',
    category: 'visao-geral',
    question: 'Para que serve este painel?',
    answer:
      'O CS2Club Admin é a cozinha da plataforma: você monta caixas, opera modos de jogo (upgrade, arena, battles), acompanha usuários e configura câmbio e pagamentos.\n\nTudo que o jogador vê no site passa por regras definidas aqui ou no backend — esta documentação resume essas regras no tom operacional.',
    bullets: [
      'Catálogo: skins, categorias (taxa), vitrines e banners.',
      'Economia: caixas, banco virtual, upgrade, arena e battles.',
      'Financeiro: câmbio, APIs de pagamento, depósitos e cupons.',
      'Pessoas: usuários, influencers, inventário e KYC.',
    ],
    tags: ['visão geral', 'painel', 'operação'],
  },
  {
    id: 'overview-2',
    category: 'visao-geral',
    question: 'Qual é o fluxo principal do produto?',
    answer:
      'O jogador deposita (Pix/cripto) → joga com saldo nas carteiras BRL/USD/EUR → abre caixas, faz upgrade, joga arena ou entra em battles → guarda skins no inventário do site ou converte em saldo.\n\nCada modo tem economia própria. Não misture: caixa usa margem + banco virtual; upgrade usa fator 71; arena injeta preço cheio na crate; battle isola o bot do banco.',
    bullets: [
      'Produção vs Dev: visão do painel separa jogadores reais de influencers/teste.',
      'Três carteiras por usuário; a ativa é a que gasta e recebe conversões.',
      'Câmbio entra quando moedas diferem (depósito, FX entre carteiras, cobrança de caixa).',
    ],
    tags: ['fluxo', 'visão geral', 'carteira', 'modos'],
  },
  {
    id: 'overview-3',
    category: 'visao-geral',
    question: 'Quais telas uso no dia a dia?',
    answer:
      'Operação diária: Dashboard (métricas), Caixas, Usuários, Depósitos e Aberturas.\n\nConfiguração: Categorias, Câmbio (cotação + APIs), Cupons, Vitrines/Banners.\n\nModos: Battles (bots + histórico), Arena (crates, preços, plays). Documentação (esta página) é a referência rápida.',
    bullets: [
      'Câmbio → aba Câmbio (reserva FX) e aba APIs de pagamento (XGate/Woovi).',
      'Battles → bots e battles recentes; create de bot no modal.',
      'Arena → crates por raridade, preço global da jogada, histórico de plays.',
    ],
    tags: ['telas', 'navegação', 'operação'],
  },

  // ── Caixas e economia ────────────────────────────────────
  {
    id: 've-1',
    category: 'caixas-economia',
    question: 'O que é valor esperado (VE)?',
    answer:
      'É a média de quanto a caixa devolve em skins se milhares de pessoas abrirem.\n\nNão é o que uma pessoa ganha na próxima abertura — é a média de longo prazo.\n\nExemplo: skin de $10 com 1% de chance contribui $0,10 ao VE. Some todos os itens ativos e você tem o VE total.',
    bullets: [
      'VE_item = preço ao vivo do catálogo × (chance / 100).',
      'VE alto → caixa “pesada” → preço de abertura maior.',
      'Itens desligados ou com 0% não entram na conta.',
    ],
    tags: ['valor esperado', 'VE', 'economia', 'caixa'],
  },
  {
    id: 've-2',
    category: 'caixas-economia',
    question: 'Como o preço da caixa é definido?',
    answer:
      'Você escolhe uma margem alvo. O sistema sugere: preço de tabela = VE × (1 + margem%).\n\nCom VE $0,15 e margem 30%, a sugestão fica ~$0,195. Depois você pode aplicar desconto sobre a tabela para o preço final da vitrine.\n\nMargem real = (preço final − VE) / VE. Se o final ficar abaixo do VE, a casa perde no design — o painel avisa.',
    bullets: [
      'Preço de tabela = referência de catálogo.',
      'Preço final = o que o jogador paga de verdade.',
      'Injeção no banco por abertura = preço ÷ (1 + margem alvo).',
    ],
    enumGroups: [ECONOMY_PANEL_FIELDS],
    tags: ['preço', 'margem', 'desconto', 'caixa'],
  },
  {
    id: 'drop-1',
    category: 'caixas-economia',
    question: 'O que significa “elegível” na tabela de itens?',
    answer:
      'É a pergunta: “esta skin pode sair agora?”\n\nChance (Drop %) = peso na roleta. Elegível = o banco virtual consegue pagar o item neste momento.\n\nItem que custa até o preço da abertura sai sempre. Item mais caro só libera quando o saldo do banco ≥ valor de mercado dele.',
    bullets: [
      'Elegível = Sim → pode sair nesta abertura.',
      'Não (banco) → item caro; aguarda o banco acumular.',
      'Pool 4/6 → quatro liberados, dois travados agora.',
    ],
    enumGroups: [CASE_EDITOR_FIELDS],
    tags: ['elegível', 'drop', 'banco virtual', 'saldo'],
  },
  {
    id: 'drop-2',
    category: 'caixas-economia',
    question: 'Como funciona o motor de drop na prática?',
    answer:
      'Toda abertura injeta o valor esperado no banco e sorteia por chance entre o pool.\n\nSe o item sorteado estiver travado, o sistema refaz o sorteio só entre elegíveis (re-roll), mantendo pesos relativos. Se ninguém estiver liberado, entrega o mais barato (fallback).',
    bullets: [
      'Sorteio ponderado pelas chances que você definiu.',
      'Item travado tem chance zero no re-roll.',
      'Fallback só se nenhum item estiver liberado.',
    ],
    enumGroups: [DROP_METHOD_ENUMS],
    tags: ['motor de drop', 're-roll', 'fallback', 'sorteio'],
  },
  {
    id: 'drop-3',
    category: 'caixas-economia',
    question: 'O que é o banco virtual da caixa?',
    answer:
      'É a reserva que decide quais itens podem sair. A cada abertura humana o sistema injeta preço ÷ (1 + margem alvo).\n\nQuando alguém ganha um item, o valor exato sai do banco. Se o saldo cair, itens caros travam de novo até novas aberturas recomporem o saldo.\n\nInfluencer usa ledger de teste separado. Caixas no mesmo economyPoolId compartilham o banco.',
    bullets: [
      'Injeção = openPrice / (1 + margem%).',
      'bankDelta = injeção − valor do item entregue.',
      'Item ≤ preço da abertura: sempre elegível.',
      'Bot de battle: bankDelta = 0 (não mexe no banco).',
    ],
    tags: ['banco virtual', 'saldo', 'valor esperado', 'pool', 'battle'],
  },
  {
    id: 'drop-4',
    category: 'caixas-economia',
    question: 'Onde vejo quanto uma caixa faturou e o que está liberado?',
    answer:
      'Na lista de Caixas, abra os Detalhes. A tela mostra faturamento, prêmios, lucro, margem realizada, saldo do banco, próximo item a liberar e tabela item a item.\n\nO gráfico dos últimos 30 dias compara o que entrou com o que saiu em prêmios. A visão Produção/Dev filtra aberturas reais vs teste.',
    bullets: [
      'Chance real ao lado da configurada revela desvios.',
      'Barra de progresso = quanto do banco exigido já está coberto.',
      'Botão Aberturas abre o histórico filtrado por esta caixa.',
    ],
    tags: ['detalhes', 'faturamento', 'banco virtual', 'elegível', 'caixa'],
  },
  {
    id: 'case-1',
    category: 'caixas-economia',
    question: 'Como criar uma caixa passo a passo?',
    answer:
      '1) Nome, slug, moeda e imagem.\n\n2) Busque skins e adicione na tabela.\n\n3) Ajuste Drop %.\n\n4) Revise VE, pool elegível e margem.\n\n5) Defina tabela, desconto e preço final.\n\n6) Salve sem alertas vermelhos.',
    bullets: [
      '“Usar sugerido” aplica o preço de tabela automático.',
      'Soma das chances deve fechar ~100% (com tolerância).',
      'Precisa existir ao menos um item ≤ preço da abertura.',
    ],
    tags: ['criar caixa', 'editor', 'passo a passo'],
  },
  {
    id: 'case-3',
    category: 'caixas-economia',
    question: 'Por que um item caro não sai mesmo com chance configurada?',
    answer:
      'Chance coloca o item na roleta; o banco decide se ele pode sair agora.\n\nNuma caixa de $0,21 com Charm de $33, o item só libera quando o banco alcançar $33 — mesmo com 0,1% no papel.',
    bullets: [
      'Injeção pequena → item caro demora mais.',
      'Muitas aberturas → libera mais cedo.',
      'Alguém ganhou o caro → banco esvazia e trava de novo.',
    ],
    tags: ['item caro', 'chance', 'banco virtual', 'saldo'],
  },

  // ── Upgrade ──────────────────────────────────────────────
  {
    id: 'upgrade-1',
    category: 'upgrade',
    question: 'Como funciona o upgrade?',
    answer:
      'O jogador aposta skins do inventário (e opcionalmente saldo) contra uma skin alvo do catálogo.\n\nO valor do alvo usa o preço com taxa da categoria. A roleta decide vitória ou derrota: ganhou → fica com o alvo; perdeu → queima a aposta.\n\nA chance já embute a margem da casa via fator fixo 71 — estilo csgo.net.',
    bullets: [
      'Stake = soma dos itens apostados (+ cash da carteira, se houver).',
      'Alvo = priceWithTax do catálogo (base × (1 + taxa%)).',
      'Vitória entrega o alvo; derrota consome o stake.',
    ],
    tags: ['upgrade', 'chance', 'roleta', 'fator 71'],
  },
  {
    id: 'upgrade-2',
    category: 'upgrade',
    question: 'Como a chance do upgrade é calculada?',
    answer:
      'chance% = (valor apostado ÷ valor do alvo) × 71, limitada entre 1% e 95%.\n\nExemplo: aposta 100 em alvo 1000 → (100/1000) × 71 = 7,1%.\n\nO pool tem 100.000 tickets; tickets de vitória = floor(chance%/100 × 100.000). O ponteiro sorteia um ticket — se cair na faixa win, ganha.',
    fields: UPGRADE_FORMULA_FIELDS,
    enumGroups: [UPGRADE_RULE_ENUMS],
    tags: ['upgrade', 'cálculo', 'chance', 'tickets', '71'],
  },
  {
    id: 'upgrade-3',
    category: 'upgrade',
    question: 'As faixas de derrota mudam a probabilidade?',
    answer:
      'Não. As faixas (muito perto, perto, meio, longe) só redistribuem onde o ponteiro para no arco perdido — para a animação não ficar sempre “colada” na borda.\n\nP(vitória) continua sendo exatamente a chance% calculada. Não use as faixas para “ajustar margem”.',
    bullets: [
      'Só estética / UX da roleta.',
      'Margem da casa = fator 71 + teto 95%.',
      'Abaixo de 1% o upgrade nem abre.',
    ],
    tags: ['upgrade', 'derrota', 'roleta', 'margem'],
  },
  {
    id: 'upgrade-4',
    category: 'upgrade',
    question: 'Como sugerir um alvo para uma chance desejada?',
    answer:
      'Inversa da fórmula: alvo ideal = (aposta × 71) ÷ chance desejada.\n\nSe o jogador tem 50 de stake e quer ~10% de chance, o alvo ideal fica perto de 355. O site usa isso para filtrar skins do catálogo na faixa certa.',
    tags: ['upgrade', 'alvo ideal', 'catálogo', 'chance'],
  },
  {
    id: 'upgrade-5',
    category: 'upgrade',
    question: 'Como o painel calcula o resultado financeiro do Upgrade?',
    answer:
      'O painel considera somente upgrades concluídos. Primeiro calcula o resultado de cada jogada; depois soma os valores do período e só então calcula os percentuais agregados. Isso evita médias de margem distorcidas.\n\nValor apostado = valor das skins consumidas + saldo utilizado. Valor entregue = valor da skin alvo somente quando o jogador vence. Resultado bruto da plataforma = valor apostado − valor entregue.\n\nNa derrota, o valor entregue é zero e o resultado bruto equivale ao valor apostado. Na vitória, o alvo é contabilizado integralmente como valor entregue, mesmo que ainda permaneça no inventário do site.',
    fields: [
      {
        name: 'totalStaked',
        label: 'Valor total apostado',
        description:
          'Soma de sourceTotal de todas as jogadas: skins consumidas + saldo real + saldo bônus efetivamente utilizados.',
      },
      {
        name: 'totalPayout',
        label: 'Valor entregue aos vencedores',
        description:
          'Soma do valor das skins alvo nas vitórias. Jogadas perdidas contribuem com zero para essa soma.',
      },
      {
        name: 'grossProfit',
        label: 'Resultado bruto da plataforma',
        description:
          'totalStaked − totalPayout. Positivo indica resultado favorável à plataforma; negativo indica que o valor entregue superou o valor apostado.',
      },
      {
        name: 'marginPercent',
        label: 'Margem bruta do período',
        description:
          '(grossProfit ÷ totalStaked) × 100. O percentual é calculado sobre os totais do período, não pela média das margens individuais.',
      },
      {
        name: 'rtpPercent',
        label: 'Percentual devolvido aos jogadores (RTP real)',
        description:
          '(totalPayout ÷ totalStaked) × 100. Mostra quanto do valor apostado retornou em skins alvo.',
      },
    ],
    bullets: [
      'Vitória: payout = valor do alvo; resultado = aposta − alvo.',
      'Derrota: payout = zero; resultado = valor integral da aposta.',
      'É resultado bruto nominal do jogo: não desconta gateway, saque, compra, venda ou outros custos operacionais.',
    ],
    tags: ['upgrade', 'métricas', 'lucro', 'margem', 'RTP', 'resultado bruto'],
  },
  {
    id: 'upgrade-6',
    category: 'upgrade',
    question: 'Qual é a diferença entre vitórias obtidas, chance média e vitórias esperadas?',
    answer:
      'Vitórias obtidas é a contagem do que realmente aconteceu nos sorteios. Percentual de tentativas vencidas = vitórias obtidas ÷ total de tentativas × 100. Chance média é a média das probabilidades registradas nas tentativas; ela não é uma nota mínima para validar uma vitória. Uma tentativa com 43,77% pode vencer ou perder normalmente.\n\nExemplo: se houve 2 tentativas e 1 venceu, o painel mostra 1 vitória e 50% das tentativas vencidas. Se as chances dessas duas tentativas eram 40% e 47,54%, a chance média foi 43,77%. Os 50% descrevem o resultado que aconteceu; os 43,77% descrevem a probabilidade média antes dos sorteios.\n\nNo detalhe da skin, percentual sorteado é a posição aleatória obtida entre 0% e 100%. A faixa vencedora começa em 0% e termina na chance daquela tentativa. Por exemplo, com chance de 43,77%, um sorteio de 22% vence e um sorteio de 70% perde.\n\nA projeção usa a chance registrada em cada upgrade, sem alterar o sorteio. Para cada jogada: entrega projetada = valor do alvo × (chance% ÷ 100). Resultado projetado = valor apostado − entrega projetada. No período, vitórias esperadas = soma de chance% ÷ 100. É uma referência estatística de longo prazo, não uma garantia para um recorte pequeno.',
    fields: [
      {
        name: 'fairValuePercent',
        label: 'Percentual sorteado na tentativa',
        description:
          'Número aleatório entre 0% e 100% usado para resolver a tentativa. Vence quando fica entre 0% e chancePercent.',
      },
      {
        name: 'expectedPayout',
        label: 'Valor projetado de entrega',
        description:
          'Soma de targetValue × chancePercent ÷ 100 para todas as jogadas do filtro.',
      },
      {
        name: 'expectedProfit',
        label: 'Resultado bruto projetado',
        description:
          'totalStaked − expectedPayout. É a referência estatística para o período selecionado.',
      },
      {
        name: 'expectedWins',
        label: 'Vitórias esperadas no longo prazo',
        description:
          'Soma de chancePercent ÷ 100. Pode ser decimal porque representa expectativa estatística.',
      },
      {
        name: 'luckDeltaPercent',
        label: 'Diferença entre o percentual vencido e a chance média',
        description:
          'Percentual de tentativas vencidas − chance média dos sorteios. Positivo significa mais vitórias que a referência estatística; negativo significa menos.',
      },
    ],
    bullets: [
      'A chance não precisa ser de 50% ou mais para uma tentativa vencer.',
      'A projeção serve para comparação de longo prazo, não para prever a próxima jogada.',
      'A auditoria por faixa agrupa jogadas de 1–10%, 10–25%, 25–50%, 50–75% e 75–95%.',
      'Amostras pequenas podem ficar bem acima ou abaixo da projeção sem indicar erro no sorteio.',
    ],
    tags: ['upgrade', 'projeção', 'probabilidade', 'vitórias esperadas', 'auditoria'],
  },
  {
    id: 'upgrade-7',
    category: 'upgrade',
    question: 'Como o painel trata BRL, USD, EUR e as visões Produção/Dev?',
    answer:
      'Cada relatório seleciona uma única moeda nativa. BRL, USD e EUR nunca são somados nem convertidos dentro das métricas do Upgrade. Ao trocar a moeda, todo o recorte é recalculado somente com jogadas registradas naquela carteira.\n\nA visão Produção inclui jogadores padrão. A visão Dev inclui contas influencer/teste. O período, a busca e o filtro de resultado são aplicados antes das somas, portanto cards, gráfico, desempenho por skin e histórico sempre representam o mesmo recorte.',
    bullets: [
      'Não compare totais de moedas diferentes como se fossem o mesmo valor.',
      'Trocar Produção/Dev isola os usuários antes de calcular as métricas.',
      'Somente jogadas liquidadas, com chance calculada maior que zero, entram no relatório.',
    ],
    tags: ['upgrade', 'BRL', 'USD', 'EUR', 'produção', 'dev', 'filtros'],
  },

  // ── Arena ────────────────────────────────────────────────
  {
    id: 'arena-1',
    category: 'arena',
    question: 'Como funciona a Arena de jogo?',
    answer:
      'O jogador paga a entrada (preço da jogada ou ticket), entra na partida Unity e destrói alvos. A cada 5 destroys de uma raridade, recebe 1 crate daquela raridade.\n\nA moeda da carteira é congelada na entrada. O script da partida sorteia o grupo COMMON (94%), RARE (5%) ou JACKPOT (1%).',
    bullets: [
      'Preço = lista − desconto (BRL/USD/EUR), configurável no admin.',
      'Pagamento: carteira primeiro; ticket cobre o restante quando aplicável.',
      'Duração ~40s + grace; disconnect tem grace curto antes de forfeit.',
    ],
    enumGroups: [ARENA_SCRIPT_ENUMS, ARENA_PROGRESS_ENUMS],
    tags: ['arena', 'partida', 'progresso', 'crate', 'ticket'],
  },
  {
    id: 'arena-2',
    category: 'arena',
    question: 'Como a crate da Arena sorteia e paga?',
    answer:
      'A abertura da crate usa elegibilidade parecida com a das caixas, mas sem margem: cada open injeta o preço cheio no banco daquela moeda (BRL/USD/EUR separados).\n\nO pool de tickets é 10.000.000 (mais fino que o das caixas). O prêmio credita só na moeda congelada da partida — sem fallback de FX cruzado.\n\nDiferente das caixas comuns, os valores da crate são gravados e não acompanham o catálogo.',
    bullets: [
      'Injeção = openPrice (inteiro), não preço ÷ (1+margem).',
      'Bancos por moeda: bankBalanceBrl / Usd / Eur.',
      'Só uma crate ativa por raridade no admin.',
      'Valor da crate é fixo; caixa comum é ao vivo.',
    ],
    tags: ['arena', 'crate', 'banco', 'elegível', 'sorteio'],
  },
  {
    id: 'arena-3',
    category: 'arena',
    question: 'O que configuro no admin da Arena?',
    answer:
      'Crates: nome, raridade, cor, itens e chances (soma 100%). Preço da jogada é global por moeda na listagem.\n\nPlays: histórico de partidas (entrada, resultado, crates ganhas). O Aim Trainer (Unity) troca um launch token por JWT para jogar.',
    bullets: [
      'Crate ativa precisa de itens habilitados somando 100%.',
      'Itens e chances da crate vêm do admin. A vitrine tem um valor padrão por raridade (ex.: Common BRL 1).',
      'Use a visão Dev para plays de influencer.',
    ],
    tags: ['arena', 'admin', 'crate', 'preço', 'plays'],
  },

  // ── Battles ──────────────────────────────────────────────
  {
    id: 'battle-modes',
    category: 'battles',
    question: 'Como funcionam modos e formatos de battle?',
    answer:
      'Modo classic: maior valor total de drops vence. Modo crazy: menor valor vence.\n\nFormatos: solo (FFA), 2v2 e 3v3. Em times, soma-se o valor do time; o pot humano é dividido entre os assentos humanos vencedores.',
    enumGroups: [BATTLE_MODE_ENUMS, BATTLE_FORMAT_ENUMS],
    tags: ['battle', 'classic', 'crazy', '2v2', '3v3'],
  },
  {
    id: 'battle-settle',
    category: 'battles',
    question: 'Como o pot é dividido no fim da battle?',
    answer:
      'Humanos vencedores recebem os drops via divisão greedy por valor: a próxima skin mais cara vai para quem está com menos valor acumulado — equilibrando as fatias.\n\nEmpate entre humanos: o pot é repartido entre os empatados. Se o bot vence, o pot humano fica com a casa (não distribui skins aos players).',
    bullets: [
      'Só assentos humanos entram no payout.',
      'Bot nunca “paga” o banco da caixa nem gera receita/payout nas métricas.',
      'Cancelar lobby/countdown/running reembolsa o escrow dos humanos.',
    ],
    tags: ['battle', 'settlement', 'pot', 'empate', 'bot'],
  },
  {
    id: 'battle-1',
    category: 'battles',
    question: 'Como funciona o bot de case battle?',
    answer:
      'O bot sorteia com a mesma elegibilidade do jogador (mesmo snapshot de banco e chances liberadas).\n\nO prêmio do bot não altera o banco da caixa — bankDelta = 0; receita, payout e opens continuam só humanos.\n\nEle tem saldo próprio (começa em 1.000.000): cada rodada debita o preço; quando acaba, recarrega para 1M. Peso = chance de ser escolhido na vaga.',
    bullets: [
      'Elegibilidade igual ao player no sorteio.',
      'Prêmio do bot não mexe no banco.',
      'Create de bot no modal (foto, nome, peso).',
      'Se o bot vence, pot humano fica com a casa.',
    ],
    tags: ['battle', 'bot', 'banco virtual', 'saldo'],
  },

  // ── Câmbio e pagamentos ──────────────────────────────────
  {
    id: 'cambio-1',
    category: 'cambio-pagamentos',
    question: 'Como funciona o câmbio da plataforma?',
    answer:
      'Todas as cotações são em base USD. Converter BRL→EUR (ou qualquer par) passa pelo pivô dólar.\n\nA SkinsBack é sempre tentada primeiro (alinha com o catálogo). Se falhar, entra a API de reserva que você marcou em Câmbio: AwesomeAPI ou Frankfurter.\n\nA cotação não segue o Google — cada provedor tem a própria tabela. Isso não é bug.',
    enumGroups: [CAMBIO_PROVIDER_ENUMS],
    tags: ['câmbio', 'FX', 'skinsback', 'cotação', 'USD'],
  },
  {
    id: 'cambio-2',
    category: 'cambio-pagamentos',
    question: 'Onde o câmbio entra na operação?',
    answer:
      'Depósitos: valor pago (Pix BRL ou cripto USD) vira crédito na moeda da carteira.\n\nMovimentação FX entre carteiras do usuário: zera a origem e credita o destino pela cotação do momento.\n\nCobrança de caixa: se a carteira ativa ≠ moeda da caixa, converte o preço antes de debitar.',
    bullets: [
      'Snapshot de valor da skin no drop também usa as taxas do momento.',
      'Arena congela a moeda na entrada — prêmio não faz FX cruzado depois.',
      'Tela Câmbio: aba Câmbio (reserva) + aba APIs de pagamento.',
    ],
    tags: ['câmbio', 'depósito', 'carteira', 'caixa', 'arena'],
  },
  {
    id: 'payment-1',
    category: 'cambio-pagamentos',
    question: 'Como funcionam as APIs de pagamento?',
    answer:
      'Pix via Woovi e cripto via XGate. As chaves ficam criptografadas no backend — o admin só vê máscaras e pode rotacionar segredos.\n\nCada provedor tem cashback % opcional e teto por moeda da carteira (BRL/USD/EUR). Histórico de Pix e cripto fica em Depósitos.',
    bullets: [
      'Woovi: produção vs sandbox pela URL da API.',
      'XGate: credenciais de cripto.',
      'Nunca grave chave em texto puro em ticket ou print.',
    ],
    tags: ['pagamento', 'woovi', 'xgate', 'pix', 'cripto', 'cashback'],
  },

  // ── Cupons e depósitos ───────────────────────────────────
  {
    id: 'deposit-1',
    category: 'cupons-depositos',
    question: 'Como o crédito do depósito é calculado?',
    answer:
      'O valor pago é convertido para a moeda da carteira. Em cima disso entram cashback e bônus de cupom.\n\nTotal = pago convertido + cashback (com teto) + bônus do cupom (USD → carteira).',
    fields: DEPOSIT_CREDIT_FIELDS,
    tags: ['depósito', 'cashback', 'cupom', 'crédito'],
  },
  {
    id: 'coupon-1',
    category: 'cupons-depositos',
    question: 'Como funcionam os cupons?',
    answer:
      'Cupom tem dono influencer, código, validade e tipo de recompensa. Percentual e tickets são iguais em todas as carteiras; valores em dinheiro são definidos por moeda — sem câmbio no valor fixo do cupom.\n\nMuitos tipos (desconto de caixa, bônus de chance no upgrade, etc.) podem estar marcados como futuro no catálogo — use só os ativos em produção.',
    bullets: [
      'Create/edição no modal da tela Cupons.',
      'Influencer dono é buscado sempre no sandbox de influencers.',
      'Depósito: cupom soma bônus USD convertido na carteira.',
    ],
    tags: ['cupom', 'influencer', 'recompensa', 'depósito'],
  },

  // ── Usuários e inventário ────────────────────────────────
  {
    id: 'users-1',
    category: 'usuarios-inventario',
    question: 'Qual a diferença entre usuário padrão e influencer?',
    answer:
      'Usuário padrão joga com saldo real — depósito e ganhos seguem regras de saque.\n\nInfluencer é conta de teste/demo: joga com saldo bônus, não saca, e as aberturas vão para o ledger de teste (visão Dev).',
    enumGroups: [USER_TYPE_ENUMS],
    tags: ['usuário', 'influencer', 'teste'],
  },
  {
    id: 'users-2',
    category: 'usuarios-inventario',
    question: 'O que é saldo real vs saldo bônus?',
    answer:
      'Saldo real = dinheiro de depósito, sacável. Saldo bônus = crédito de influencer, não sacável.\n\nGastos (caixa, battle, arena, upgrade) consomem bônus primeiro na carteira ativa. “Total para caixas” = real + bônus; “Sacável” = só real.',
    enumGroups: [WALLET_BALANCE_ENUMS],
    tags: ['saldo', 'bônus', 'carteira', 'saque'],
  },
  {
    id: 'users-3',
    category: 'usuarios-inventario',
    question: 'Como funciona o inventário do site?',
    answer:
      'Skin guardada após abertura vai ao inventário do site (não é o inventário Steam).\n\nCada item guarda snapshot de valor (USD/BRL/EUR) no momento do drop — não muda se o mercado oscilar. Converter credita o valor na moeda da carteira (real ou bônus, conforme o tipo de usuário).',
    bullets: [
      'Ativo = ainda na plataforma.',
      'Convertido = virou saldo; não volta.',
      'Admin lista só inventário do site.',
    ],
    enumGroups: [INVENTORY_STATUS_ENUMS],
    tags: ['inventário', 'skin', 'converter', 'valor fixo'],
  },
  {
    id: 'users-5',
    category: 'usuarios-inventario',
    question: 'Como funcionam as três carteiras?',
    answer:
      'Cada usuário tem BRL, USD e EUR separados. Trocar a moeda no perfil só escolhe a carteira ativa — não converte sozinho.\n\nPara mover valor entre moedas, o fluxo de FX zera a origem e credita o destino pela cotação do momento (usa a cadeia de câmbio).',
    bullets: [
      'Compras debitam só a carteira ativa.',
      'Crédito de influencer entra na moeda escolhida.',
      'Bônus nunca é sacável.',
    ],
    tags: ['carteira', 'moeda', 'FX', 'influencer'],
  },

  // ── Skins e catálogo ─────────────────────────────────────
  {
    id: 'skins-1',
    category: 'skins-catalogo',
    question: 'De onde vêm os preços das skins?',
    answer:
      'Do catálogo SkinsBack. Cada skin tem preço base; a taxa da categoria de arma gera o preço com taxa.\n\npriceWithTax = base × (1 + taxPercent/100). Nas caixas comuns esse valor é ao vivo: se o mercado mudar, VE e preço da caixa acompanham. Valor fixo/congelado é só nas crates da Arena e no inventário depois do drop.',
    bullets: [
      'Preço base = bruto da API.',
      '“All” é fallback quando o tipo de arma não casa.',
      'Caixa comum = preço flexível do catálogo. Crate da Arena = valor congelado.',
    ],
    tags: ['preço', 'skinsback', 'taxa', 'catálogo'],
  },
  {
    id: 'skins-2',
    category: 'skins-catalogo',
    question: 'Para que servem as categorias de arma?',
    answer:
      'Cada tipo (Rifle, Knife, etc.) tem taxa %. É a alavanca de margem por família de item sem editar skin a skin.\n\nTaxa 0% = sem acréscimo; 10% = +10% sobre a base.',
    tags: ['categorias', 'taxa', 'arma', 'preço'],
  },
  {
    id: 'skins-3',
    category: 'skins-catalogo',
    question: 'Como funciona a moeda no painel?',
    answer:
      'Três contextos: (1) moeda do admin em Configurações — como você vê preços; (2) moeda da caixa — cobrança e VE; (3) moeda da carteira do usuário — conversão e crédito.',
    enumGroups: [CURRENCY_ENUMS],
    tags: ['moeda', 'BRL', 'USD', 'EUR'],
  },

  // ── Operação ─────────────────────────────────────────────
  {
    id: 'operacao-1',
    category: 'operacao',
    question: 'O que cada número do painel de economia significa?',
    answer:
      'O bloco “Economia da caixa (tempo real)” responde: “esta caixa fecha a conta?” e “quantos itens podem sair neste preço?” enquanto você edita.',
    enumGroups: [ECONOMY_PANEL_FIELDS],
    tags: ['economia', 'painel', 'VE', 'margem'],
  },
  {
    id: 'operacao-2',
    category: 'operacao',
    question: 'Por que não consigo salvar a caixa?',
    answer:
      'Bloqueios comuns: soma das chances longe de 100%; nenhum item ≤ preço da abertura; preço final < VE (margem negativa); item ativo sem preço válido.',
    bullets: [
      'Leia o banner vermelho.',
      'Ícone ? nos campos abre ajuda rápida.',
      'Inclua filler barato ou aumente o preço.',
    ],
    tags: ['salvar', 'validação', 'erro', 'caixa'],
  },
  {
    id: 'operacao-3',
    category: 'operacao',
    question: 'Tolerância, banco exigido e margem alvo — qual a diferença?',
    answer:
      'Tolerância = folga matemática na soma das chances.\n\nBanco exigido = saldo necessário para liberar aquela skin cara.\n\nMargem alvo = meta da caixa: sugere preço e define a injeção (preço ÷ (1 + margem)).',
    enumGroups: [CASE_EDITOR_FIELDS],
    tags: ['tolerância', 'banco virtual', 'margem', 'campos'],
  },
  {
    id: 'operacao-prod-dev',
    category: 'operacao',
    question: 'O que muda entre visão Produção e Dev?',
    answer:
      'Produção: usuários padrão, aberturas reais, depósitos e faturamento reais. Influencers ficam de fora das listagens.\n\nDev: influencers e testes — aberturas e créditos bônus no ledger de teste, sem misturar com produção. Use Dev para demos e QA.',
    bullets: [
      'Toggle no topo do painel (ambiente de dados).',
      'Métricas do dashboard respeitam a visão ativa.',
      'Cupom: busca de influencer ignora a visão e lista influencers do servidor.',
    ],
    tags: ['produção', 'dev', 'sandbox', 'influencer', 'métricas'],
  },
]

export const DOCUMENTATION_CATEGORIES: Array<{
  id: DocumentationCategory
  label: string
  icon: typeof BookOpenText
}> = [
  { id: 'all', label: 'Todas', icon: HelpCircle },
  { id: 'visao-geral', label: 'Visão geral', icon: BookOpenText },
  { id: 'caixas-economia', label: 'Caixas e economia', icon: Package },
  { id: 'upgrade', label: 'Upgrade', icon: Calculator },
  { id: 'arena', label: 'Arena', icon: Crosshair },
  { id: 'battles', label: 'Battles', icon: Swords },
  { id: 'cambio-pagamentos', label: 'Câmbio e pagamentos', icon: ArrowLeftRight },
  { id: 'cupons-depositos', label: 'Cupons e depósitos', icon: TicketPercent },
  { id: 'usuarios-inventario', label: 'Usuários e inventário', icon: Users },
  { id: 'skins-catalogo', label: 'Skins e catálogo', icon: Gem },
  { id: 'operacao', label: 'Operação', icon: Settings },
]

export const DOCUMENTATION_POPULAR_TAGS = [
  'valor esperado',
  'banco virtual',
  'upgrade',
  'fator 71',
  'arena',
  'battle',
  'bot',
  'câmbio',
  'depósito',
  'cashback',
  'cupom',
  'influencer',
  'carteira',
  'elegível',
]

export const DOCUMENTATION_SUMMARY = [
  {
    label: 'Caixas',
    category: 'caixas-economia' as const,
    value:
      'VE → margem → preço → injeção no banco → sorteio com elegibilidade / re-roll / fallback',
    icon: Package,
  },
  {
    label: 'Upgrade',
    category: 'upgrade' as const,
    value:
      'Chance = (aposta ÷ alvo) × 71, entre 1% e 95%. Pool de 100k tickets; faixas de derrota só visuais',
    icon: Calculator,
  },
  {
    label: 'Arena e battles',
    category: 'arena' as const,
    value:
      'Arena: 5 destroys → crate, banco sem margem. Battle: classic/crazy, bot com bankDelta 0',
    icon: Crosshair,
  },
  {
    label: 'Câmbio e carteira',
    category: 'cambio-pagamentos' as const,
    value:
      'FX via pivô USD (SkinsBack → reserva). Três carteiras; bônus gasta primeiro; só real saca',
    icon: Wallet,
  },
]
