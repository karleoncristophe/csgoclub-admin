# Resultados dos testes — caixas e Upgrade

Consolidado em 15/09/2026. Este relatório não certifica a margem real de todas as caixas.

## Testes de cálculo e contratos

Última execução local: **49 testes aprovados, 10 suítes**, em 1,482 s. No backend:

```sh
pnpm exec jest --runInBand --watchman=false src/modules/case/utils case-financial-regression case-bank-isolation weapon-category-tax swap-minimum
```

Arquivos principais no backend:

| Arquivo | O que verifica |
| --- | --- |
| src/modules/case/utils/case-fixed-economics.util.spec.ts | VE, margem, preço fixo, itens desativados e moedas |
| src/modules/case/case-financial-regression.spec.ts | Preço público versus cobrança calculada, prêmio versus snapshot, fixação nas três moedas e exclusão lógica |
| src/modules/case/case-bank-isolation.spec.ts | Banco próprio do influencer, isolamento da produção e migração conferida |
| src/modules/case/utils/case-live-catalog.util.spec.ts | Atualização de valores do catálogo nos itens |
| src/modules/case/utils/case-pricing-migration.util.spec.ts | Migração de preços legados e idempotência |
| src/modules/case/utils/case-open-charge.util.spec.ts | Cobrança por moeda/quantidade |
| src/modules/case/utils/case-odds-period.util.spec.ts | Período de chances |
| src/modules/case/utils/upgrade-ticket.util.spec.ts | Fórmula da chance, limites das zonas e tickets válidos |
| src/modules/weapon-category/weapon-category-tax.spec.ts | Taxa atual, efeito no VE/margem e respeito à fixação |
| src/modules/swap/utils/swap-minimum-value.util.spec.ts | Mínimo de Swap entre moedas |

Exemplos determinísticos aprovados:

| Cenário | VE esperado | Preço final | Margem sobre VE |
| --- | --- | --- | --- |
| Item de 10 com chance de 100%; outro item desativado | 10 | 12 | 20% |
| Item de 0,01 a 60% + item de 0,02 a 40% | 0,014 | 0,02 | 42,8571% |
| Catálogo 100 com taxa de 25%, sem fixação | 125 | 150 | 20% |
| Catálogo sobe para 999, preço da caixa permanece 117 | 999 | 117 | −88,2883% |

Esses exemplos confirmam que o código aplica a fórmula, inclusive margem negativa. Não significam que as caixas reais têm esses valores nem que uma sequência de sorteios produzirá exatamente essa margem.

## Sorteios do Upgrade

Simulação anterior: 100.000 tickets por chance com o sorteador corrigido. Foi executada por comando inline no terminal, **não por um arquivo específico persistido de simulação**. O teste unitário upgrade-ticket.util.spec.ts não executa estes 400.000 sorteios automaticamente. Resultados registrados naquela execução:

| Chance | Tentativas | Vitórias | Derrotas | Frequência observada |
| --- | --- | --- | --- | --- |
| 1% | 100.000 | 1.057 | 98.943 | 1,057% |
| 10% | 100.000 | 10.092 | 89.908 | 10,092% |
| 25% | 100.000 | 24.975 | 75.025 | 24,975% |
| 50% | 100.000 | 49.919 | 50.081 | 49,919% |

As frequências ficaram próximas das probabilidades propostas. O ensaio não registrou custos de cada skin nem receita/payout por caixa: portanto, **não é o relatório de margem solicitado na reunião**. Tampouco certifica sozinho um protocolo provably fair verificável pelo jogador.

## Como deve ser conferida a margem

- Margem de design sobre VE: (preço − VE) / VE × 100.
- Resultado realizado: receita efetiva − valor efetivamente entregue.
- Margem realizada sobre receita: resultado / receita × 100.
- Mesmo sem restrições de banco, 30% sobre VE equivale a aproximadamente 23,08% sobre receita, e não a 30%. Comparações precisam usar o mesmo denominador.
- Elegibilidade, rerolls, fallback, banco inicial e variância dos itens alteram a distribuição realizada. Influencer deve usar o mesmo motor e um banco independente por caixa.

## Pendência prioritária

Ainda falta um simulador/relatório reproduzível por caixa e por skin usando o motor real, sem gravar compras: snapshot de configuração/câmbio, tentativas, probabilidades, vitórias por item, receita, payout, margem esperada/realizada, desvio, rerolls/fallbacks e banco final. A auditoria atual do banco usa itens armazenados e não substitui essa simulação com catálogo atual.

Não há base para afirmar ainda que todas as caixas estão dentro da margem desejada. Veja o plano consolidado para a ordem das validações restantes.
