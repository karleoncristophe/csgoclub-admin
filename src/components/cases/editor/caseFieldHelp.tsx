import type { ReactNode } from 'react'

export type CaseFieldHelpEntry = {
  title: string
  description: string
  details: ReactNode
}

function HelpSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  )
}

export const CASE_FIELD_HELP = {
  name: {
    title: 'Nome da caixa',
    description: 'Nome que aparece no site e no painel.',
    details: (
      <>
        <p>É o título da caixa para o jogador. Ex.: <strong>Neon Queen</strong>, <strong>Caixa AK</strong>.</p>
        <HelpSection title="Dica">
          <p>Use um nome curto e fácil de lembrar. Se você não editar o slug, ele é gerado automaticamente a partir do nome.</p>
        </HelpSection>
      </>
    ),
  },
  slug: {
    title: 'Slug',
    description: 'Identificador na URL — só letras minúsculas, números e hífens.',
    details: (
      <>
        <p>É o “endereço” da caixa no site. Ex.: <code>neon-queen</code> vira algo como <code>/cases/neon-queen</code>.</p>
        <HelpSection title="Regras">
          <p>Sem espaços, sem acentos, sem caracteres especiais. Depois que a caixa existe, mudar o slug pode quebrar links antigos.</p>
        </HelpSection>
      </>
    ),
  },
  currency: {
    title: 'Moeda da caixa',
    description: 'Moeda usada nos preços dos itens e no preço de abertura.',
    details: (
      <>
        <p>Define se os valores são em <strong>Real (BRL)</strong>, <strong>Dólar (USD)</strong> ou <strong>Euro (EUR)</strong>.</p>
        <HelpSection title="Importante">
          <p>Os preços das skins vêm do catálogo SkinsBack na moeda escolhida. Trocar a moeda recalcula os valores dos itens já adicionados.</p>
        </HelpSection>
        <HelpSection title="Diferente da moeda do admin">
          <p>A moeda nas Configurações do painel só muda como você <em>vê</em> preços no catálogo. A moeda da caixa é o que o jogador paga ao abrir.</p>
        </HelpSection>
      </>
    ),
  },
  valueMode: {
    title: 'Valor no cálculo do VE',
    description: 'Qual preço da skin entra na matemática da caixa.',
    details: (
      <>
        <p>
          <strong>Com taxa de categoria</strong> — usa o preço já com a taxa da categoria de arma (recomendado).
        </p>
        <p>
          <strong>Preço base SkinsBack</strong> — usa só o preço bruto da API, sem a taxa da categoria.
        </p>
        <HelpSection title="Por que isso importa">
          <p>O VE (valor esperado) e o preço sugerido da caixa mudam conforme essa opção. Mantenha o mesmo critério para todos os itens da caixa.</p>
        </HelpSection>
      </>
    ),
  },
  description: {
    title: 'Descrição',
    description: 'Texto opcional exibido na vitrine da caixa.',
    details: (
      <p>Pode ser vazio. Use para explicar o tema da caixa, promoções ou avisos. Não afeta drops nem preços.</p>
    ),
  },
  caseImage: {
    title: 'Imagem da caixa',
    description: 'Foto/arte que o jogador vê na lista e na página da caixa.',
    details: (
      <>
        <p>Faça upload, recorte se quiser, ou remova para usar só o nome. A imagem não muda chances nem economia.</p>
        <HelpSection title="Formato">
          <p>JPEG, PNG ou WebP. Tamanho máximo conforme limite do upload do sistema.</p>
        </HelpSection>
      </>
    ),
  },
  active: {
    title: 'Caixa ativa',
    description: 'Se a caixa aparece no site para os jogadores.',
    details: (
      <>
        <p><strong>Marcado</strong> — jogadores podem ver e abrir (se o site já publica caixas).</p>
        <p><strong>Desmarcado</strong> — caixa fica só no admin; útil para montar e testar antes de lançar.</p>
      </>
    ),
  },
  dropPercent: {
    title: 'Drop %',
    description: 'Chance de design do item no sorteio — não é a chance final se o item está bloqueado.',
    details: (
      <>
        <p>É o peso do item na tabela. Ex.: <strong>0,013%</strong> = muito raro; <strong>98%</strong> = quase sempre.</p>
        <HelpSection title="Não é garantia de cair">
          <p>
            Se a coluna <strong>Elegível</strong> está <strong>Não</strong>, esse item <strong>não pode sair</strong> no preço atual da caixa — mesmo com drop baixo. O motor bloqueia itens que quebrariam a margem.
          </p>
        </HelpSection>
        <HelpSection title="Soma das chances">
          <p>A soma dos drops dos itens <strong>ativos</strong> deve ficar perto da <strong>Meta soma chances</strong> (geralmente 100%), com uma folga das tolerâncias.</p>
        </HelpSection>
      </>
    ),
  },
  probabilityTolerance: {
    title: 'Tolerância',
    description: 'Folga permitida na soma das chances — não é margem de lucro.',
    details: (
      <>
        <p>Valor pequeno (padrão <strong>0,0001</strong>). Soma de todos os itens ativos vira a folga total na validação.</p>
        <HelpSection title="Exemplo simples">
          <p>6 itens com tolerância 0,0001 → folga total ±0,0006%. A soma dos drops pode ser 99,9994% até 100,0006% e ainda passar na validação.</p>
        </HelpSection>
        <HelpSection title="Por que existe">
          <p>Chances como 0,013% e 98,979% são difíceis de fechar exatamente em 100%. A tolerância evita erro por arredondamento.</p>
        </HelpSection>
      </>
    ),
  },
  minMarginPercent: {
    title: 'Margem mín.',
    description: 'Lucro mínimo exigido se ESTE item for o resultado da abertura.',
    details: (
      <>
        <p>Margem = quanto a casa “ganha” na abertura: <strong>(preço da caixa − valor da skin) ÷ preço da caixa</strong>.</p>
        <HelpSection title="Exemplo">
          <p>Caixa $0,21 e skin $72 → margem negativa gigante. Com margem mín. 30%, esse item fica <strong>inelegível</strong> e não cai.</p>
        </HelpSection>
        <HelpSection title="Diferente da margem alvo">
          <p><strong>Margem alvo</strong> define o preço sugerido da caixa. <strong>Margem mín.</strong> é por item — protege contra um drop caro que drenaria o caixa.</p>
        </HelpSection>
      </>
    ),
  },
  itemEnabled: {
    title: 'Ativo',
    description: 'Item entra no pool de design (chances e VE). Desligado = ignorado.',
    details: (
      <>
        <p><strong>Ativo</strong> — conta na soma de chances, no VE e pode participar do sorteio (se elegível).</p>
        <p><strong>Desativado</strong> — como se o item não existisse na caixa; não cai e não entra na soma de %.</p>
      </>
    ),
  },
  itemEligible: {
    title: 'Elegível',
    description: 'Se o item PODE ser entregue agora, com o preço e margens atuais.',
    details: (
      <>
        <p><strong>Sim</strong> — pode sair no sorteio (respeitando o Drop %).</p>
        <p><strong>Não</strong> — bloqueado por margem; chance real de receber = <strong>zero</strong> até subir o preço ou ajustar margens.</p>
        <HelpSection title="Como o sistema decide">
          <p>Checa margem da abertura atual e margem acumulada do ledger da caixa. Item caro em caixa barata quase sempre fica Não.</p>
        </HelpSection>
      </>
    ),
  },
  itemValue: {
    title: 'Valor do item',
    description: 'Preço da skin usado nos cálculos (com ou sem taxa, conforme o modo VE).',
    details: (
      <p>Vem do catálogo SkinsBack na moeda da caixa. Não edita aqui — muda se troca moeda, modo VE ou atualiza preços no catálogo.</p>
    ),
  },
  itemVe: {
    title: 'VE do item',
    description: 'Contribuição deste item ao valor esperado total da caixa.',
    details: (
      <>
        <p>Fórmula: <strong>Valor × (Drop % ÷ 100)</strong>. Ex.: skin $10 com 1% drop → VE item = $0,10.</p>
        <p>A soma de todos os VE dos itens ativos = <strong>VE total</strong> da caixa.</p>
      </>
    ),
  },
  targetMarginPercent: {
    title: 'Margem alvo (%)',
    description: 'Lucro que você quer ter em cima do VE — usado para sugerir o preço.',
    details: (
      <>
        <p>Preço sugerido = <strong>VE ÷ (1 − margem)</strong>. Com VE $0,15 e margem 30% → sugerido ≈ $0,21.</p>
        <HelpSection title="Não bloqueia drops">
          <p>Isso só ajuda a calcular preço. Quem bloqueia item caro é a <strong>margem mín.</strong> de cada linha.</p>
        </HelpSection>
      </>
    ),
  },
  probabilityTargetPercent: {
    title: 'Meta soma chances (%)',
    description: 'Total que a soma dos Drop % dos itens ativos deve atingir.',
    details: (
      <>
        <p>Quase sempre <strong>100%</strong> — 100% do “peso” do sorteio distribuído entre os itens.</p>
        <HelpSection title="Validação">
          <p>O sistema compara a soma real com a meta ± soma das tolerâncias. Fora disso, não deixa salvar.</p>
        </HelpSection>
      </>
    ),
  },
  listPrice: {
    title: 'Preço de tabela',
    description: 'Preço “de catálogo” antes do desconto na vitrine.',
    details: (
      <>
        <p>Valor de referência. O jogador pode ver o desconto em cima deste preço no <strong>Preço final</strong>.</p>
        <HelpSection title="Usar sugerido">
          <p>Botão abaixo recalcula com base no VE e na margem alvo — útil para não errar na matemática.</p>
        </HelpSection>
      </>
    ),
  },
  discountPercent: {
    title: 'Desconto no preço final (%)',
    description: 'Porcentagem tirada do preço de tabela para a vitrine.',
    details: (
      <>
        <p>Ex.: tabela $10 e desconto 20% → final $8. <strong>0%</strong> = sem desconto.</p>
        <p>Não muda drops; só o que o jogador paga e, por consequência, quais itens ficam elegíveis.</p>
      </>
    ),
  },
  price: {
    title: 'Preço final (vitrine)',
    description: 'O que o jogador realmente paga para abrir a caixa.',
    details: (
      <>
        <p>É o valor que entra no motor de drop e no ledger. Precisa ser ≥ VE para não ter margem negativa no design.</p>
        <HelpSection title="Aplicar desconto">
          <p>Botão abaixo aplica tabela − desconto automaticamente.</p>
        </HelpSection>
        <HelpSection title="Preço baixo = só skins baratas">
          <p>Com preço muito baixo, só itens baratos ficam elegíveis — os caros aparecem na vitrine mas não caem.</p>
        </HelpSection>
      </>
    ),
  },
} satisfies Record<string, CaseFieldHelpEntry>

export type CaseFieldHelpKey = keyof typeof CASE_FIELD_HELP

export function caseFieldProps(key: CaseFieldHelpKey) {
  const help = CASE_FIELD_HELP[key]
  return {
    description: help.description,
    fieldHelp: { title: help.title, content: help.details },
  }
}
