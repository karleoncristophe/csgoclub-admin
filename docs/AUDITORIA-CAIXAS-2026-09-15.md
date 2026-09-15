# Auditoria de caixas — 15/09/2026

Consulta somente leitura ao MongoDB configurado no backend local. Não foi iniciado o Nest para esta consulta, evitando seeds/jobs. Nenhum registro ou saldo foi modificado. Não foi confirmado que este banco é o ambiente de produção publicado.

## Preço salvo versus campos fixos

11 caixas não excluídas/arquivadas retornadas (limite da consulta: 20). O VE abaixo foi recalculado dos itens **armazenados**, não de uma cotação atual do fornecedor.

| Caixa | Moeda | Preço salvo | Campo fixo da moeda | VE dos itens salvos |
| --- | --- | --- | --- | --- |
| Case Preset Dev | USD | 0,20 | 0,15 | 0,15367238 |
| Case Preset Dev 2 | USD | 0,21 | 0,15 | 0,15367238 |
| Case Preset Dev 2 (cópia) | USD | 0,21 | 0,15 | 0,15367238 |
| Caixa Demo Influencer | USD | 5301,78 | 4078,29 | 4078,28693880 |
| Case Preset Dev 3 | USD | 8,80 | 6,77 | 6,76500000 |
| Low Go | USD | 0,20 | 0,15 | 0,15217040 |
| JAPASKINS | USD | 0,09 | 0,07 | 0,07395698 |
| Abis Box | USD | 0,64 | 0,49 | 0,48803216 |
| Spider Man | BRL | 1,35 | 1,04 | 1,03778224 |
| Luxury Knife Mining | BRL | 9,17 | 5,73 | 5,72643206 |
| 4K-47 | BRL | 55,09 | 42,38 | 42,37554154 |

Os campos fixedPrice coincidem com o VE salvo arredondado, enquanto price inclui margem. Isso é compatível com uma transição incompleta do antigo VE fixo para preço fixo; não comprova a intenção comercial por moeda. É necessária confirmação antes de converter esses registros. Não recalcular preços históricos usando cotação atual.

## Histórico de prêmios

Amostra: últimas 100 aberturas por `_id`, sem filtrar ambiente. 95 têm diferença superior a 0,009 entre itemValue e snapshot na própria moeda da caixa.

Exemplos USD: itemValue 0,38 versus snapshot 5,80; 0,25 versus 7,00; 0,77 versus 6,40. Não extrapolar o percentual para todo o histórico. Não é prova isolada do valor efetivamente creditado/retirado: inventário e ledger da carteira precisam ser conciliados.

## Correção nova

Endpoint público da caixa usava fixedValue mesmo com useFixedValue desligado. Alterado para respeitar explicitamente o switch, como o cálculo operacional e os snapshots das novas aberturas.

Testes de contrato: BRL/USD/EUR × fixação ligada/desligada verificam preço público = débito calculado e prêmio público = snapshot esperado. Oito testes na suíte de regressão passaram, e o backend compilou. São testes com dependências simuladas, não compras reais nem comparação HTTP do ambiente publicado.

## Bloqueios para declarar consistência completa

1. Confirmar qual preço comercial preservar nos registros legados e a regra para as outras duas moedas; não sobrescrever os valores automaticamente.
2. Conciliar inventário/carteira e separar teste/produção antes de propor reparação histórica.
3. Executar matriz editor/detalhes/web contra o ambiente autorizado após resolver os dados legados. A leitura atual não demonstra que o sistema publicado já executa o código local corrigido.

Nenhuma alteração em históricos ou saldos foi feita; nenhuma publicação foi realizada.

## Continuação: correções preparadas

- Migração de preço legada simulada: 11 candidatos. Preserva price nativo, escala as outras moedas na mesma proporção sem câmbio atual e guarda backup dos campos anteriores. Roda no boot da versão corrigida, com versão 2 e proteção contra gravação concorrente. Não aplicada manualmente ao banco.
- Novas aberturas guardam paymentCurrency e chargedAmount. Admin distingue o débito efetivo na moeda da carteira do preço econômico na moeda da caixa. Registros antigos não recebem moeda presumida.
- Admin sinaliza snapshot nativo divergente de itemValue; não reescreve história para esconder o problema.

### Influencer e usuário normal

A amostra de 100 aberturas era integralmente de teste. Consulta separada de isTestOpen != true não retornou registros neste banco. Isso não prova ausência de operações reais em outros ambientes ou bases antigas.

70 aberturas da amostra tinham inventário; todos os 70 itens mantêm o mesmo snapshot da abertura. As outras 30 aberturas estavam convertidas. A conciliação com a carteira dessas conversões permanece necessária antes de qualquer reparação de saldo.

JAPASKINS e Abis Box usavam testLedger compartilhado. Agora getEffectiveTestLedger e incrementTestLedger usam somente testEconomyLedger da caixa, mesmo quando existe pool de produção. Cálculo do drop permanece comum aos dois tipos de usuário. Compartilhar/desvincular caixas não zera nem mistura seus bancos de teste.

Migração por caixa preparada para boot: banco do grupo 65,73 = JAPASKINS 70,14 + Abis Box -4,41, reconstruídos de bankInjection - itemValue das aberturas de teste. Mantém valores negativos e backup; não altera ledger de produção nem apaga o pool legado. Se faltarem dados ou a soma não coincidir, recusa a migração em vez de inventar saldo.

Antes da publicação: coordenar parada da versão antiga, backup operacional e entrada da versão corrigida para evitar duas versões interpretando fixedPrice de formas diferentes. Migrações são idempotentes; não executar --apply isoladamente com versão antiga ativa.
