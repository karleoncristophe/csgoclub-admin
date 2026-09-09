import { Link } from 'react-router-dom'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'

const UPGRADE_CALCULATION_HELP = {
  title: 'Como os números do Upgrade são calculados?',
  content: (
    <div className="space-y-4">
      <p>
        O painel usa somente upgrades concluídos. Cada moeda é calculada
        separadamente: valores em BRL, USD e EUR nunca são somados entre si.
      </p>

      <div className="space-y-2 rounded-xl border border-border bg-surface-secondary p-3">
        <p><strong>Valor apostado</strong> = skins consumidas + saldo utilizado.</p>
        <p><strong>Valor entregue</strong> = valor da skin alvo quando o jogador vence; na derrota é zero.</p>
        <p><strong>Resultado bruto da plataforma</strong> = valor apostado − valor entregue.</p>
        <p><strong>Margem bruta</strong> = resultado bruto ÷ valor apostado × 100.</p>
        <p><strong>RTP real</strong> = valor entregue ÷ valor apostado × 100.</p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-surface-secondary p-3">
        <p><strong>Entrega projetada da jogada</strong> = valor do alvo × chance ÷ 100.</p>
        <p><strong>Resultado projetado</strong> = valor apostado − entrega projetada.</p>
        <p><strong>Vitórias obtidas</strong> = quantidade de sorteios efetivamente vencidos.</p>
        <p><strong>Percentual de tentativas vencidas</strong> = vitórias obtidas ÷ total de tentativas × 100.</p>
        <p><strong>Chance média dos sorteios</strong> = soma das chances registradas ÷ total de tentativas.</p>
        <p><strong>Percentual sorteado</strong> = posição aleatória obtida entre 0% e 100%. A tentativa vence quando esse número cai entre 0% e a chance de vitória.</p>
        <p><strong>Vitórias esperadas</strong> = soma da chance de cada tentativa ÷ 100. É uma referência de longo prazo, não uma meta mínima.</p>
        <p><strong>Diferença financeira</strong> = resultado bruto que ocorreu − resultado bruto esperado pelas probabilidades.</p>
      </div>

      <p>
        Uma tentativa com 43,77% pode vencer ou perder. Esse percentual é a
        probabilidade daquele sorteio, e não uma pontuação que precisa chegar a
        50% para a vitória ser válida.
      </p>

      <p>
        Exemplo: em uma vitória com aposta de R$ 71 e alvo de R$ 100, a
        plataforma recebeu R$ 71, entregou R$ 100 e teve resultado bruto de
        −R$ 29. Em uma derrota com a mesma aposta, recebeu R$ 71, não entregou
        skin e teve resultado bruto de R$ 71.
      </p>

      <p className="text-xs text-muted">
        Este é o resultado bruto nominal do jogo. Custos externos de compra,
        venda, saque, gateway ou operação não são descontados nessa conta.
      </p>

      <Link
        to="/dashboard/documentation?cat=upgrade"
        className="inline-flex font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        Abrir explicação completa na documentação
      </Link>
    </div>
  ),
}

export function UpgradePageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <FieldHelpButton
          fieldHelp={UPGRADE_CALCULATION_HELP}
          className="h-8 w-8"
        />
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        {subtitle}
      </p>
    </header>
  )
}
