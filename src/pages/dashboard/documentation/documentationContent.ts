import type { ReactNode } from 'react'

export type DocSection = {
  id: string
  title: string
  subtitle: string
  icon: ReactNode
  paragraphs: string[]
  bullets?: string[]
  enums?: Array<{
    label: string
    description?: string
    values: string[]
    details?: Array<{
      value: string
      meaning: string
    }>
  }>
}

export const DOC_SUMMARY_CARDS = [
  {
    label: 'Fluxo da caixa',
    value:
      'Montar itens → somar chances → calcular VE → definir preço → abertura com motor de margem → ledger acumulado',
  },
  {
    label: 'VE (valor esperado)',
    value:
      'Média do que a caixa “devolve” em skins por abertura — base para preço sugerido e margem real',
  },
  {
    label: 'Motor de drop',
    value:
      'Sorteio por chance + bloqueio por margem instantânea e acumulada + re-roll + fallback no item barato',
  },
  {
    label: 'Moeda',
    value: 'BRL, USD ou EUR — catálogo SkinsBack, caixa e preferência do admin podem usar moedas diferentes',
  },
]

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: 'Visão geral',
    subtitle: 'O que o painel CS2Club admin faz e como as partes se conectam.',
    icon: null,
    paragraphs: [
      'Este painel é onde você monta caixas de skins CS2 com preços reais do catálogo SkinsBack, define chances de drop, margens de lucro e publica para o site.',
      'O fluxo principal é: buscar skins no catálogo → adicionar na caixa → configurar Drop %, tolerância e margem de cada item → o sistema calcula o VE (valor esperado) → você define o preço de abertura → na hora que o jogador abre, o motor de drop decide qual skin entregar respeitando margem.',
      'Além das caixas, o admin gerencia categorias de arma (taxa por tipo de item), lista usuários e inventários, e configura a moeda padrão do painel.',
    ],
    bullets: [
      'Skins: catálogo com preço base + taxa de categoria.',
      'Caixas: economia por item, não só um “lucro global” solto.',
      'Categorias: taxa % aplicada ao preço base por tipo de arma.',
      'Configurações: país e moeda padrão para ver preços no admin.',
    ],
  },
  {
    id: 've',
    title: 'O que é VE (Valor Esperado)?',
    subtitle: 'A métrica central da economia da caixa — leia isso antes de tudo.',
    icon: null,
    paragraphs: [
      'VE significa Valor Esperado. Em palavras simples: se milhares de pessoas abrirem a caixa, quanto em média cada abertura “devolve” em valor de skin.',
      'Não é o que uma pessoa vai ganhar na próxima abertura. É a média matemática de longo prazo, baseada nas chances e nos preços que você configurou.',
      'Fórmula de cada item: VE do item = valor da skin × (Drop % ÷ 100). Exemplo: skin de $10,00 com Drop 1% → VE item = $10 × 0,01 = $0,10.',
      'VE total da caixa = soma do VE de todos os itens ativos. Exemplo com dois itens: $0,10 + $0,0099 = VE total ≈ $0,1099.',
      'O preço sugerido da caixa usa o VE total e a margem alvo: Preço sugerido = VE ÷ (1 − margem). Com VE $0,15 e margem 30% → sugerido = 0,15 ÷ 0,70 ≈ $0,21.',
      'Se o preço final fica abaixo do VE total, a casa perde dinheiro no design da caixa (margem negativa). O sistema avisa isso no painel de economia.',
    ],
    bullets: [
      'VE alto = caixa “carrega” muito valor nas skins → precisa de preço de abertura maior.',
      'VE baixo = caixa barata, mas o jogador quase sempre recebe skins de centavos.',
      'O VE usa os preços do catálogo na moeda da caixa (com ou sem taxa de categoria, conforme o modo VE).',
      'Itens desativados ou com Drop 0% não entram no VE.',
    ],
    enums: [
      {
        label: 'Exemplo numérico completo',
        description: 'Caixa com 2 itens — igual ao preset de teste:',
        values: ['Item caro 0,013%', 'Item barato 98,979%', 'VE ≈ $0,15', 'Preço $0,21 → margem ~29%'],
        details: [
          {
            value: 'SSG $72,53 × 0,013%',
            meaning: 'Contribui ~$0,009 ao VE (item caro, chance mínima).',
          },
          {
            value: 'Zeus $0,007 × 98,979%',
            meaning: 'Contribui ~$0,007 ao VE (item filler, chance gigante).',
          },
          {
            value: 'VE total',
            meaning: 'Soma de todos os itens ≈ $0,15 — é isso que a caixa “paga” em média.',
          },
          {
            value: 'Preço $0,21',
            meaning: 'Jogador paga $0,21; diferença (~$0,06) é o lucro de design antes do motor de margem por abertura.',
          },
        ],
      },
    ],
  },
  {
    id: 'drop-engine',
    title: 'Motor de drop (abertura real)',
    subtitle: 'O que acontece quando o jogador clica em abrir — passo a passo.',
    icon: null,
    paragraphs: [
      'O motor não é “sorteio puro”. Ele combina as chances que você definiu com regras de lucro para a casa não entregar skins caras quando o preço da caixa não permite.',
      'Passo 1 — Sorteio ponderado: o sistema rola um número usando os Drop % dos itens ativos (como uma roleta onde cada fatia tem o tamanho da chance).',
      'Passo 2 — Checagem de margem instantânea: só para itens com valor até o preço da caixa. Se o item sorteado custa mais que a abertura, a checagem passa para o ledger acumulado.',
      'Passo 3 — Checagem de margem acumulada: o sistema olha o ledger (receita das aberturas − payout em skins). Itens caros só saem quando o histórico + esta abertura mantém a margem alvo. Após um drop caro a margem cai e sobe de novo com novas aberturas.',
      'Passo 4 — Re-roll: se o item sorteado falhou, o motor tenta de novo (até cerca de 50 vezes) com as mesmas regras.',
      'Passo 5 — Fallback: se nada elegível sai no re-roll, entrega o item barato elegível (o “filler” da caixa).',
      'Por isso na tabela aparece Elegível Sim/Não: isso NÃO é a chance de drop. É se o item pode ser entregue agora. Drop % = chance no design; Elegível = pode sair na prática.',
    ],
    bullets: [
      'Item com Elegível Não (ledger) → item acima do preço da caixa aguardando margem acumulada.',
      'Pool elegível 2/6 = só 2 itens podem sair agora; os outros aguardam ledger ou preço maior.',
      'Ledger acumulado: receita total das aberturas reais − payout total em skins.',
      'Cada abertura gera auditoria: se houve re-roll, item original sorteado, método de resolução, margens.',
    ],
    enums: [
      {
        label: 'Margem instantânea vs acumulada',
        values: ['Instantânea', 'Acumulada', 'Elegível = ambas OK'],
        details: [
          {
            value: 'Instantânea',
            meaning: 'Só itens até o preço da caixa. (preço − valor) ÷ preço ≥ margem mín.',
          },
          {
            value: 'Acumulada',
            meaning: 'Itens acima do preço da caixa usam só o ledger: (receita + abertura − payout − valor) ÷ (receita + abertura).',
          },
          {
            value: 'Elegível',
            meaning: 'Sim se passa na regra aplicável (instantânea ou ledger) e na margem acumulada global.',
          },
        ],
      },
    ],
  },
  {
    id: 'case-creation',
    title: 'Como criar uma caixa (passo a passo)',
    subtitle: 'Fluxo recomendado no editor de caixas.',
    icon: null,
    paragraphs: [
      '1. Informações gerais — nome, slug, moeda da caixa, modo de cálculo do VE, imagem e se está ativa.',
      '2. Buscar skins — filtre por tipo, raridade ou nome; clique na skin para adicionar direto na tabela (sem modal).',
      '3. Tabela de itens — para cada skin: Drop %, tolerância, margem mín., confira Elegível.',
      '4. Preço da caixa — margem alvo, meta de chances, preço de tabela, desconto, preço final (vitrine).',
      '5. Economia em tempo real — confira VE, pool elegível, margem real e soma das chances antes de salvar.',
      '6. Salvar — o sistema valida soma de chances, margem negativa e se existe pelo menos um item elegível.',
    ],
    bullets: [
      'Use “Usar sugerido” para preço de tabela baseado no VE + margem alvo.',
      'Use “Aplicar desconto” para calcular o preço final a partir da tabela.',
      'Em dev, existe preset de caixa justa (6 skins, todos elegíveis) para montar vitrine de produção rápido.',
      'Cada caixa guarda sua própria moeda — independente da moeda padrão do admin.',
    ],
  },
  {
    id: 'case-fields-general',
    title: 'Campos — informações gerais',
    subtitle: 'O que cada campo da primeira seção do editor faz.',
    icon: null,
    paragraphs: [
      'Nome da caixa: título exibido ao jogador. Slug: identificador na URL (só minúsculas, números e hífens).',
      'Moeda da caixa: BRL, USD ou EUR — define preços dos itens e preço de abertura. Trocar moeda recalcula os itens já adicionados.',
      'Valor no cálculo do VE: “Com taxa de categoria” usa preço já com taxa da categoria de arma (recomendado). “Preço base” usa só o valor bruto SkinsBack.',
      'Descrição: texto opcional na vitrine. Imagem: upload com crop. Caixa ativa: se aparece no site para abertura.',
    ],
    enums: [
      {
        label: 'Campos',
        values: ['name', 'slug', 'currency', 'valueMode', 'description', 'image', 'active'],
        details: [
          { value: 'name / slug', meaning: 'Nome público e URL da caixa.' },
          { value: 'currency', meaning: 'Moeda de preços e abertura desta caixa específica.' },
          { value: 'valueMode', meaning: 'with_tax (com taxa) ou base (preço bruto) no VE.' },
          { value: 'active', meaning: 'Desligado = só no admin; ligado = visível no site.' },
        ],
      },
    ],
  },
  {
    id: 'case-fields-pricing',
    title: 'Campos — preço e margem da caixa',
    subtitle: 'Economia global da caixa (não por item).',
    icon: null,
    paragraphs: [
      'Margem alvo (%): lucro que você quer em cima do VE. Usado para calcular o preço sugerido. Ex.: 30% → preço = VE ÷ 0,70.',
      'Meta soma chances (%): total que os Drop % dos itens ativos devem somar — quase sempre 100%.',
      'Preço de tabela: referência “de catálogo” antes do desconto. Preço final (vitrine): o que o jogador paga — entra no motor de drop e no ledger.',
      'Desconto (%): redução aplicada sobre o preço de tabela para chegar no preço final.',
      'Margem real (design): (preço final − VE) ÷ preço final — o que o painel mostra em “Economia da caixa”. Diferente da margem mín. por item.',
    ],
    bullets: [
      'Preço final baixo → só skins baratas ficam elegíveis.',
      'Preço final menor que VE → margem negativa (alerta vermelho).',
      'listPriceManual / priceManual: se você digitou manualmente, o auto-cálculo não sobrescreve.',
    ],
  },
  {
    id: 'case-fields-items',
    title: 'Campos — tabela de itens',
    subtitle: 'Cada linha da caixa tem economia própria.',
    icon: null,
    paragraphs: [
      'Ativo: item entra na soma de chances, no VE e no sorteio. Desligado = ignorado.',
      'Valor: preço da skin no catálogo (com ou sem taxa, conforme modo VE). Não edita aqui.',
      'Drop %: chance de design no sorteio. Não é garantia de entrega se Elegível = Não.',
      'Tolerância: folga na validação da soma das chances (padrão 0,0001). Não é margem de lucro.',
      'Margem mín.: lucro mínimo exigido se ESTE item for o resultado. Protege contra drop caro em caixa barata.',
      'VE item: valor × drop ÷ 100 — contribuição desse item ao VE total.',
      'Elegível: pode ser entregue agora com preço e margens atuais. Não = bloqueado pelo motor.',
    ],
    enums: [
      {
        label: 'Tolerância vs margem — não confundir',
        values: ['Tolerância', 'Margem mín.', 'Margem alvo'],
        details: [
          {
            value: 'Tolerância',
            meaning: 'Folga na soma dos Drop % (ex.: 100% ± 0,0006%). Só validação matemática.',
          },
          {
            value: 'Margem mín.',
            meaning: 'Por item — bloqueia entrega se essa skin quebraria o lucro mínimo.',
          },
          {
            value: 'Margem alvo',
            meaning: 'Na caixa — sugere preço de abertura a partir do VE total.',
          },
        ],
      },
    ],
  },
  {
    id: 'categories',
    title: 'Categorias de arma (taxas)',
    subtitle: 'Por que existe a página Categorias e como afeta preços.',
    icon: null,
    paragraphs: [
      'Cada tipo de arma no catálogo (Rifle, Pistol, Knife, etc.) pode ter uma taxa percentual configurada no admin.',
      'O preço “com taxa” da skin = preço base SkinsBack + taxa da categoria. Essa taxa alimenta o catálogo e, quando o modo VE é “com taxa”, entra no cálculo do valor esperado.',
      'A categoria “All (sem tipo de arma)” é fallback para skins sem tipo identificado.',
      'Taxa em %: 0 = sem acréscimo; 10 = +10% sobre o preço base. Valores são usados na API SkinsBack ao listar o catálogo.',
    ],
    bullets: [
      'Sem categoria configurada, o sistema usa taxa 0% para tipos novos.',
      'Alterar taxa afeta preços futuros no catálogo — caixas já salvas precisam recarregar itens ou trocar moeda para atualizar.',
      'Categorias não definem drop % nem margem — só o preço de referência da skin.',
    ],
  },
  {
    id: 'currency',
    title: 'Moeda e configurações regionais',
    subtitle: 'Moeda do admin vs moeda da caixa vs moeda do catálogo.',
    icon: null,
    paragraphs: [
      'Configurações → Regional: define país e moeda padrão do painel (BRL, USD, EUR). Salva no navegador e sincroniza com Skins e inventário de usuários.',
      'País sugere moeda automaticamente (Brasil → BRL, EUA → USD, países UE → EUR). Países sem mapeamento usam Real (BRL) como fallback.',
      'Moeda da caixa (no editor): o que o jogador paga e o que os itens usam nessa caixa específica. Pode ser diferente da moeda do admin.',
      'Catálogo SkinsBack: sempre consultado na moeda escolhida. Formatação usa locale (pt-BR, en-US, de-DE). Inputs de preço usam máscara monetária (como Vittryne).',
    ],
    enums: [
      {
        label: 'Moedas suportadas',
        values: ['BRL', 'USD', 'EUR'],
        details: [
          { value: 'BRL', meaning: 'Real brasileiro — padrão e fallback.' },
          { value: 'USD', meaning: 'Dólar — EUA e países mapeados a USD.' },
          { value: 'EUR', meaning: 'Euro — países da zona euro no seletor de país.' },
        ],
      },
    ],
  },
  {
    id: 'skins-catalog',
    title: 'Skins e catálogo',
    subtitle: 'De onde vêm os preços e como buscar itens.',
    icon: null,
    paragraphs: [
      'A página Skins lista o catálogo SkinsBack com preço base, taxa de categoria e preço com taxa.',
      'Filtros: busca por nome, tipo de arma, raridade, faixa de preço (% do mínimo/máximo do resultado).',
      'Ao adicionar skin na caixa, o sistema busca preço atualizado na API. Raridade e imagem vêm do catálogo.',
      'Detalhe da skin (clique no item): mostra metadados, float, weapon type, descrição HTML da Steam quando disponível.',
    ],
    bullets: [
      'Moeda do filtro = moeda da consulta à API (use Configurações para padrão).',
      'Inventário de usuário: skins do Steam do jogador com preços SkinsBack na moeda selecionada.',
      'Preços mudam com o mercado — VE da caixa reflete o momento do cadastro até você atualizar.',
    ],
  },
  {
    id: 'economics-panel',
    title: 'Painel “Economia da caixa (tempo real)”',
    subtitle: 'O que cada número do resumo significa.',
    icon: null,
    paragraphs: [
      'Valor esperado (VE): soma ponderada dos itens — média de retorno por abertura no design.',
      'Preço sugerido: VE ÷ (1 − margem alvo). Botão “Usar sugerido” aplica na tabela.',
      'Pool elegível: quantos itens podem sair agora vs. total ativo. “X bloqueado(s) por margem” = itens na vitrine mas não entregáveis.',
      'Margem real (design): lucro percentual se o preço final e o VE se mantêm — (preço − VE) ÷ preço.',
      'Ledger acumulado: receita real das aberturas, payout real em skins, margem % histórica. Zeros = caixa nova ou só testes.',
      'Soma das chances: deve ficar na meta (geralmente 100%) ± soma das tolerâncias dos itens.',
    ],
    bullets: [
      'Alerta vermelho: preço < VE (margem negativa no design).',
      'Alerta amarelo: nenhum item elegível — caixa não pode operar com segurança no preço atual.',
      'Com desconto: mostra preço após desconto vs. tabela.',
    ],
  },
  {
    id: 'validation',
    title: 'Validações ao salvar',
    subtitle: 'Por que o sistema pode impedir salvar a caixa.',
    icon: null,
    paragraphs: [
      'Pelo menos um item ativo na caixa.',
      'Soma dos Drop % dos ativos ≈ meta (100%) dentro da folga das tolerâncias.',
      'Pelo menos um item elegível com preço e margens atuais.',
      'Preço de tabela e preço final > 0 quando há itens.',
      'Preço final não pode ser menor que VE (margem negativa).',
      'Itens ativos precisam ter preço válido no catálogo (base e com taxa > 0).',
    ],
    bullets: [
      'Corrija os erros listados no banner vermelho antes de salvar.',
      'Ícone ? ao lado dos campos abre ajuda rápida no editor.',
      'Esta página é a referência completa e detalhada.',
    ],
  },
]
