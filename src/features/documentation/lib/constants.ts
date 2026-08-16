import {
  BookOpenText,
  Calculator,
  Coins,
  Gem,
  HelpCircle,
  Layers,
  Package,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import {
  CASE_EDITOR_FIELDS,
  CURRENCY_ENUMS,
  DROP_METHOD_ENUMS,
  ECONOMY_PANEL_FIELDS,
  INVENTORY_STATUS_ENUMS,
  USER_TYPE_ENUMS,
  WALLET_BALANCE_ENUMS,
} from '@/features/documentation/lib/documentationReference'
import type { DocumentationCategory, DocumentationItem } from './types'

export const DOCUMENTATION_DATA: DocumentationItem[] = [
  {
    id: 'overview-1',
    category: 'visao-geral',
    question: 'Para que serve este painel?',
    answer:
      'O CS2Club Admin é onde você monta as caixas de skins, acompanha usuários, confere preços do catálogo e opera o dia a dia da plataforma.\n\nPense nele como a “cozinha” do site: aqui você define o cardápio (itens e chances), o preço de cada caixa e acompanha o que os jogadores ganham.',
    bullets: [
      'Caixas: montar, precificar e publicar.',
      'Usuários: saldo, tipo de conta e inventário.',
      'Skins: catálogo com preços reais da SkinsBack.',
      'Categorias: taxa por tipo de arma.',
    ],
    tags: ['visão geral', 'painel', 'operação'],
  },
  {
    id: 'overview-2',
    category: 'visao-geral',
    question: 'Qual é o fluxo de uma caixa, do início ao fim?',
    answer:
      '1) Você escolhe as skins e define as chances.\n\n2) O sistema calcula quanto a caixa “devolve” em média (valor esperado).\n\n3) Você define o preço que o jogador paga para abrir.\n\n4) Na abertura, o valor esperado entra no banco virtual da caixa e o motor sorteia entre os itens que o banco consegue pagar.\n\n5) O jogador guarda a skin no inventário do site ou converte em saldo.',
    bullets: [
      'Montar itens → calcular valor médio → definir preço → abrir → inventário ou saldo.',
      'Cada caixa tem moeda e banco virtual próprios.',
      'O banco virtual acumula o valor esperado e paga os itens entregues.',
    ],
    tags: ['fluxo', 'caixa', 'visão geral'],
  },
  {
    id: 'overview-3',
    category: 'visao-geral',
    question: 'Quais telas uso no dia a dia?',
    answer:
      'Depende da sua função, mas o caminho mais comum é: Caixas (criar e revisar), Usuários (suporte e influencers), Skins (conferir preços) e Documentação (esta página).\n\nConfigurações serve para país e moeda padrão do painel.',
    bullets: [
      'Caixas → criar, editar, ativar/desativar.',
      'Usuários → saldo, influencer, inventário do site.',
      'Skins → buscar itens e ver preço com taxa.',
      'Categorias → ajustar taxa por tipo de arma.',
    ],
    tags: ['telas', 'navegação', 'operação'],
  },
  {
    id: 've-1',
    category: 'caixas-economia',
    question: 'O que é valor esperado (VE)?',
    answer:
      'É a média de quanto a caixa devolve em skins se milhares de pessoas abrirem.\n\nNão é o que uma pessoa vai ganhar na próxima abertura — é a média de longo prazo.\n\nExemplo simples: uma skin de $10 com 1% de chance contribui $0,10 ao VE. Some todas as skins e você tem o VE total da caixa.',
    bullets: [
      'VE alto → caixa “pesada” em valor → preço de abertura tende a ser maior.',
      'VE baixo → caixa barata, mas quase sempre skins de centavos.',
      'Itens desligados ou com 0% de chance não entram na conta.',
    ],
    tags: ['valor esperado', 'VE', 'economia', 'caixa'],
  },
  {
    id: 've-2',
    category: 'caixas-economia',
    question: 'Como o preço da caixa é definido?',
    answer:
      'Você escolhe uma margem alvo (ex.: 30% de lucro). O sistema sugere um preço com base no VE.\n\nNa prática: preço sugerido = VE × (1 + margem). Com VE de $0,15 e margem de 30%, a sugestão fica em $0,195.\n\nVocê ainda pode aplicar desconto sobre o preço de tabela para chegar no preço final da vitrine.',
    bullets: [
      'Preço de tabela = referência “de catálogo”.',
      'Preço final = o que o jogador paga de verdade.',
      'Se o preço final ficar abaixo do VE, a casa perde no design — o painel avisa.',
    ],
    enumGroups: [ECONOMY_PANEL_FIELDS],
    tags: ['preço', 'margem', 'desconto', 'caixa'],
  },
  {
    id: 'drop-1',
    category: 'caixas-economia',
    question: 'O que significa “elegível” na tabela de itens?',
    answer:
      'É a pergunta: “esta skin pode sair agora?”\n\nNão confunda com a chance (Drop %). A chance diz o peso no sorteio; elegível diz se o banco virtual da caixa consegue pagar o item neste momento.\n\nItem que custa até o preço da abertura sai sempre — a própria abertura paga por ele. Item mais caro aparece como “Não (banco)” até o saldo alcançar o valor de mercado exato dele.',
    bullets: [
      'Elegível = Sim → pode sair nesta abertura.',
      'Não (banco) → item mais caro que a abertura; aguarda o banco acumular.',
      'Pool 4/6 → quatro itens liberados, dois travados agora.',
    ],
    enumGroups: [CASE_EDITOR_FIELDS],
    tags: ['elegível', 'drop', 'banco virtual', 'saldo'],
  },
  {
    id: 'drop-2',
    category: 'caixas-economia',
    question: 'Como funciona o motor de drop na prática?',
    answer:
      'Não é sorteio puro. Toda abertura injeta o valor esperado no banco virtual e o sistema sorteia por chance entre o pool inteiro.\n\nSe o item sorteado não estiver liberado pelo banco, o sorteio é refeito só entre os elegíveis, mantendo o peso relativo de cada um (re-roll). Se nada estiver liberado, entrega o item mais barato (fallback).\n\nPor isso você pode ver 100 aberturas “Direto” com filler — o sorteio acertou algo já liberado.',
    bullets: [
      'Sorteio ponderado pelas chances que você definiu.',
      'Item travado pelo banco tem chance zero — não entra no re-roll.',
      'Fallback só acontece se nenhum item estiver liberado.',
    ],
    enumGroups: [DROP_METHOD_ENUMS],
    tags: ['motor de drop', 're-roll', 'fallback', 'sorteio'],
  },
  {
    id: 'drop-3',
    category: 'caixas-economia',
    question: 'O que é o banco virtual da caixa?',
    answer:
      'É a reserva que decide quais itens podem sair. A cada abertura o sistema injeta nele o valor esperado — o preço pago dividido por (1 + margem alvo). Com margem de 30%, injeta preço ÷ 1,30.\n\nO saldo é acumulativo: conforme sobe, os itens mais caros que o preço da abertura vão sendo liberados, do mais barato para o mais caro, assim que o saldo alcança o valor de mercado exato de cada um.\n\nQuando alguém ganha um item, o valor exato dele sai do banco. Se o saldo cair abaixo do preço de outros itens caros, eles voltam a travar na hora e só liberam quando novas aberturas recompuserem o saldo.\n\nNo painel do influencer o banco de teste é separado do banco real.',
    bullets: [
      'Injeção por abertura = preço ÷ (1 + margem alvo).',
      'Item até o preço da abertura sai sempre; mais caro exige saldo ≥ valor dele.',
      'Ganhar um item retira o valor exato do banco.',
      'Bot de battle só retira do banco (não paga abertura); o saldo para em zero.',
    ],
    tags: ['banco virtual', 'saldo', 'valor esperado', 'item caro', 'bot', 'battle'],
  },
  {
    id: 'drop-4',
    category: 'caixas-economia',
    question: 'Onde vejo quanto uma caixa faturou e o que está liberado?',
    answer:
      'Na lista de Caixas, clique no nome da caixa ou no ícone de gráfico para abrir os Detalhes.\n\nA tela mostra o faturamento e os prêmios pagos, o lucro e a margem realizada, o saldo atual do banco virtual, qual item está mais perto de liberar e uma tabela item a item com quantas vezes cada skin já saiu, quanto ela já pagou em prêmios e a situação dela no banco.\n\nO gráfico dos últimos 30 dias compara o que entrou (barra) com o que saiu em prêmios (linha).',
    bullets: [
      'Os números respeitam a visão: Produção mostra aberturas reais, Dev mostra as de teste.',
      'Chance real ao lado da chance configurada revela desvios do sorteio.',
      'A barra de progresso por item mostra quanto do saldo exigido o banco já cobre.',
      'O botão Aberturas abre o histórico já filtrado por esta caixa.',
    ],
    tags: ['detalhes', 'faturamento', 'banco virtual', 'elegível', 'caixa'],
  },
  {
    id: 'battle-1',
    category: 'caixas-economia',
    question: 'Como funciona o bot de case battle?',
    answer:
      'O bot sorteia com a mesma elegibilidade do jogador (mesmo banco virtual e mesmas chances liberadas).\n\nO prêmio do bot não altera o banco da caixa — não injeta, não retira e não zera o saldo. Receita, payout e totalOpens continuam só das aberturas humanas.\n\nEle tem saldo próprio (começa em 1.000.000): cada rodada debita o preço; quando acaba, recarrega para 1.000.000. Se o bot vencer a battle, o pot humano fica com a casa.',
    bullets: [
      'Elegibilidade igual ao player no sorteio.',
      'Prêmio do bot não mexe no banco da caixa.',
      'Saldo do bot: paga a abertura; recarrega para 1M quando acaba.',
      'Receita / payout / totalOpens só contam abertura humana.',
    ],
    tags: ['battle', 'bot', 'banco virtual', 'saldo', 'caixa'],
  },
  {
    id: 'case-1',
    category: 'caixas-economia',
    question: 'Como criar uma caixa passo a passo?',
    answer:
      '1) Preencha nome, slug, moeda e imagem.\n\n2) Busque skins no catálogo e adicione na tabela.\n\n3) Ajuste as chances (Drop %) de cada item.\n\n4) Revise o painel de economia — VE, pool elegível e margem.\n\n5) Defina preço de tabela, desconto e preço final.\n\n6) Salve quando não houver alertas vermelhos.',
    bullets: [
      'Use “Usar sugerido” para preço de tabela automático.',
      'Confira se a soma das chances fecha em 100%.',
      'Preset justo no editor ajuda a montar caixa de vitrine rápido.',
    ],
    tags: ['criar caixa', 'editor', 'passo a passo'],
  },
  {
    id: 'case-2',
    category: 'caixas-economia',
    question: 'Para que serve o preset de teste no editor?',
    answer:
      'É um atalho para montar uma caixa de demonstração com skins de preços parecidos e chances balanceadas.\n\nServe para testar o painel e mostrar o produto — não substitui uma caixa de produção pensada para o seu público.\n\nCaixas antigas de teste (filler barato + item caro de vitrine) ainda podem existir no banco; o preset novo é mais justo para demo.',
    tags: ['preset', 'teste', 'dev', 'editor'],
  },
  {
    id: 'case-3',
    category: 'caixas-economia',
    question: 'Por que um item caro não sai mesmo com chance configurada?',
    answer:
      'Porque chance e liberação são coisas diferentes.\n\nA chance coloca o item na roleta. O banco virtual decide se ele pode sair agora.\n\nNuma caixa de $0,21 com Charm de $33, o item só libera quando o banco alcançar os $33 — mesmo que ele tenha 0,1% de chance no papel. A coluna “Banco exigido” mostra o valor e a estimativa de aberturas.',
    bullets: [
      'Injeção pequena por abertura → item caro demora mais para liberar.',
      'Banco já cheio (muitas aberturas) → item caro pode sair mais cedo.',
      'Alguém ganhou o item caro → o banco esvazia e ele trava de novo.',
    ],
    tags: ['item caro', 'chance', 'banco virtual', 'saldo'],
  },
  {
    id: 'users-1',
    category: 'usuarios-inventario',
    question: 'Qual a diferença entre usuário padrão e influencer?',
    answer:
      'Usuário padrão joga com saldo real — o que deposita e o que ganha segue as regras normais de saque.\n\nInfluencer é conta de teste/demo: abre caixas com saldo bônus fake, não saca, e serve para gravar, mostrar a plataforma ou testar economia sem dinheiro real.',
    enumGroups: [USER_TYPE_ENUMS],
    tags: ['usuário', 'influencer', 'afiliado', 'teste'],
  },
  {
    id: 'users-2',
    category: 'usuarios-inventario',
    question: 'O que é saldo real vs saldo bônus?',
    answer:
      'Saldo real é dinheiro de verdade na carteira — veio de depósito e pode ser sacado conforme as regras do site.\n\nSaldo bônus é crédito fictício para influencers. Abre caixas, mas não vira saque.\n\n“Total para caixas” mostra quanto a pessoa pode gastar abrindo (real + bônus). “Sacável” mostra só o real.',
    enumGroups: [WALLET_BALANCE_ENUMS],
    tags: ['saldo', 'bônus', 'carteira', 'saque'],
  },
  {
    id: 'users-3',
    category: 'usuarios-inventario',
    question: 'Como funciona o inventário do site?',
    answer:
      'Quando o jogador ganha uma skin e escolhe guardar, ela vai para o inventário do site — separado do inventário Steam.\n\nCada item guarda o valor fixo do momento em que foi ganho (em USD, BRL e EUR). Esse valor não muda se o preço de mercado oscilar depois.\n\nNo admin você vê itens agrupados (ex.: +99 unidades da mesma skin) e o total em valor.',
    bullets: [
      'Ativo = ainda na plataforma, não virou saldo.',
      'Convertido = jogador trocou por dinheiro na carteira.',
      'Totais aparecem na moeda da carteira do usuário.',
    ],
    enumGroups: [INVENTORY_STATUS_ENUMS],
    tags: ['inventário', 'skin', 'guardar', 'valor fixo'],
  },
  {
    id: 'users-4',
    category: 'usuarios-inventario',
    question: 'O que acontece quando o jogador converte um item?',
    answer:
      'O item sai do inventário e o valor fixo (na moeda da carteira do usuário) entra como saldo.\n\nInfluencer recebe em saldo bônus. Jogador padrão recebe em saldo real.\n\nA conversão usa o snapshot de moedas gravado no momento do drop — não recalcula com cotação de hoje.',
    bullets: [
      'Valor congelado no drop = previsibilidade para o jogador.',
      'Moeda da carteira define em qual moeda credita.',
      'Item convertido não volta ao inventário.',
    ],
    tags: ['converter', 'saldo', 'carteira', 'inventário'],
  },
  {
    id: 'users-5',
    category: 'usuarios-inventario',
    question: 'Como testar aberturas em lote para influencer?',
    answer:
      'Na ficha do usuário influencer, use o painel “Abrir caixa de teste”. Escolha a caixa, quantidade (até 100) e destino:\n\n• Inventário — itens vão para o inventário do site.\n• Converter — valor credita direto no saldo bônus.\n\nO resultado mostra resumo de drops, margem fake, banco de teste e lista agrupada dos itens.',
    bullets: [
      'Só influencers têm abertura em lote.',
      'O banco virtual de teste é separado do banco real da caixa.',
      'Útil para simular sessões longas de abertura.',
    ],
    tags: ['influencer', 'lote', 'teste', 'abertura'],
  },
  {
    id: 'users-6',
    category: 'usuarios-inventario',
    question: 'Inventário Steam e inventário do site são a mesma coisa?',
    answer:
      'Não. O inventário Steam mostra o que a pessoa tem na conta Steam, com preços de referência da SkinsBack.\n\nO inventário do site mostra apenas skins ganhas em aberturas de caixa na plataforma — e só entram no saldo quando o jogador converte.\n\nSão duas listas com propósitos diferentes na ficha do usuário.',
    tags: ['steam', 'inventário', 'skins', 'usuário'],
  },
  {
    id: 'skins-1',
    category: 'skins-catalogo',
    question: 'De onde vêm os preços das skins?',
    answer:
      'Do catálogo SkinsBack, integrado ao painel. Cada skin tem preço base e, quando aplicável, taxa da categoria de arma.\n\nAo montar uma caixa, o sistema busca o preço atualizado. O valor fica gravado na caixa como snapshot — se o mercado mudar, você pode atualizar recarregando itens.',
    bullets: [
      'Preço base = valor bruto da API.',
      'Preço com taxa = base + % da categoria (Rifle, Pistol, etc.).',
      'Modo VE define se o cálculo usa base ou com taxa.',
    ],
    tags: ['preço', 'skinsback', 'catálogo', 'taxa'],
  },
  {
    id: 'skins-2',
    category: 'skins-catalogo',
    question: 'Para que servem as categorias de arma?',
    answer:
      'Cada tipo (Rifle, Pistol, Faca, etc.) pode ter uma taxa percentual. Essa taxa aumenta o preço exibido no catálogo e, quando configurado, entra no cálculo do valor esperado da caixa.\n\nÉ uma forma de ajustar margem por tipo de item sem editar skin por skin.',
    bullets: [
      'Taxa 0% = sem acréscimo.',
      'Taxa 10% = +10% sobre o preço base.',
      '“All” é fallback para itens sem tipo identificado.',
    ],
    tags: ['categorias', 'taxa', 'arma', 'preço'],
  },
  {
    id: 'skins-3',
    category: 'skins-catalogo',
    question: 'Como funciona a moeda no painel?',
    answer:
      'Existem três contextos que às vezes confundem:\n\n1) Moeda do admin (Configurações) — como você vê preços ao navegar.\n\n2) Moeda da caixa — o que o jogador paga e o que os itens usam naquela caixa.\n\n3) Moeda da carteira do usuário — em que moeda ele recebe ao converter itens.',
    enumGroups: [CURRENCY_ENUMS],
    tags: ['moeda', 'BRL', 'USD', 'EUR', 'configurações'],
  },
  {
    id: 'skins-4',
    category: 'skins-catalogo',
    question: 'Como buscar skins no catálogo?',
    answer:
      'Na página Skins, use busca por nome, filtro de tipo de arma, raridade e faixa de preço. A moeda do filtro segue a preferência do painel.\n\nNo editor de caixas, a busca funciona parecido: clique na skin para adicionar direto na tabela.',
    bullets: [
      'Detalhe da skin mostra imagem, raridade e descrição quando disponível.',
      'Preços mudam com o mercado — revise caixas antigas periodicamente.',
    ],
    tags: ['busca', 'catálogo', 'skins', 'filtro'],
  },
  {
    id: 'operacao-1',
    category: 'operacao',
    question: 'O que cada número do painel de economia significa?',
    answer:
      'O bloco “Economia da caixa (tempo real)” é o seu painel de controle antes de publicar. Ele reage enquanto você edita chances e preços.\n\nUse-o para responder: “esta caixa fecha a conta?” e “quantos itens podem sair neste preço?”',
    enumGroups: [ECONOMY_PANEL_FIELDS],
    tags: ['economia', 'painel', 'VE', 'margem'],
  },
  {
    id: 'operacao-2',
    category: 'operacao',
    question: 'Por que não consigo salvar a caixa?',
    answer:
      'O sistema bloqueia quando algo está inconsistente. Os motivos mais comuns:\n\n• Soma das chances longe de 100%.\n• Nenhum item cabe no preço da abertura (a caixa não pagaria nem a primeira abertura).\n• Preço final menor que o valor esperado (margem negativa).\n• Item ativo sem preço válido no catálogo.',
    bullets: [
      'Leia o banner vermelho — ele lista o que corrigir.',
      'Ícone ? ao lado dos campos abre ajuda rápida no editor.',
      'Inclua um item mais barato que o preço da abertura ou aumente o preço.',
    ],
    tags: ['salvar', 'validação', 'erro', 'caixa'],
  },
  {
    id: 'operacao-3',
    category: 'operacao',
    question: 'Tolerância, banco exigido e margem alvo — qual a diferença?',
    answer:
      'São três coisas com nomes parecidos, mas funções diferentes.\n\nTolerância = folga matemática para a soma das chances fechar em 100%.\n\nBanco exigido = saldo que o banco virtual precisa ter para aquela skin poder sair (o valor de mercado dela, quando ela custa mais que a abertura).\n\nMargem alvo = meta da caixa inteira: define o preço sugerido e quanto entra no banco por abertura.',
    enumGroups: [CASE_EDITOR_FIELDS],
    tags: ['tolerância', 'banco virtual', 'margem', 'chance', 'campos'],
  },
  {
    id: 'operacao-4',
    category: 'operacao',
    question: 'Onde encontro ajuda rápida nos campos do editor?',
    answer:
      'Ao lado de vários campos do editor de caixas há um botão ?. Ele abre uma explicação curta daquele campo específico.\n\nEsta página de documentação é a referência completa — use a busca acima quando quiser entender o fluxo inteiro ou tirar dúvida de suporte.',
    tags: ['ajuda', 'editor', 'campos', 'suporte'],
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
  { id: 'usuarios-inventario', label: 'Usuários e inventário', icon: Users },
  { id: 'skins-catalogo', label: 'Skins e catálogo', icon: Gem },
  { id: 'operacao', label: 'Operação', icon: Settings },
]

export const DOCUMENTATION_POPULAR_TAGS = [
  'valor esperado',
  'margem',
  'drop',
  'caixa',
  'influencer',
  'inventário',
  'saldo',
  'banco virtual',
  'skins',
  'elegível',
  'battle',
  'bot',
]

export const DOCUMENTATION_SUMMARY = [
  {
    label: 'Fluxo da caixa',
    value:
      'Escolher skins → definir chances → calcular valor médio → precificar → abrir → inventário ou saldo',
    icon: Package,
  },
  {
    label: 'Valor esperado',
    value:
      'Média do que a caixa devolve por abertura — base para preço sugerido e margem',
    icon: Calculator,
  },
  {
    label: 'Motor de drop',
    value:
      'Sorteio por chance + regras de margem + re-roll + item de segurança (fallback)',
    icon: Coins,
  },
  {
    label: 'Carteira e inventário',
    value:
      'Saldo real vs bônus; inventário do site com valor fixo; conversão na moeda do usuário',
    icon: Wallet,
  },
]
