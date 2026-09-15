# Plano consolidado — reunião de 14/09/2026
Atualizado em 15/09/2026. Substitui os resumos incrementais anteriores. “Implementado” significa código local; não significa publicado ou validado em produção.

## Regra financeira acordada

- Preço final da caixa fixo e independente em BRL/USD/EUR.
- VE = soma dos valores operacionais × probabilidades dos itens habilitados. Mantém precisão antes de calcular a margem.
- Margem atual sobre VE = ((preço final − VE atual) / VE atual) × 100. Pode ser negativa; não é a mesma medida que lucro realizado sobre receita.
- Skins não fixadas acompanham catálogo/taxa quando a caixa usa “com taxa”. Fixadas usam o valor manual na moeda correspondente. Modo base não incorpora taxa do catálogo.
- Influencer e usuário normal usam o mesmo cálculo de drop/elegibilidade. Influencer usa banco de teste próprio da caixa, sem afetar produção.
- Swap tem taxa própria por categoria, independente da taxa do catálogo. O requisito anterior de 3% fixos foi substituído.

## Implementado no código

| Frente | Entrega |
| --- | --- |
| VE e margem | Precisão do VE; margem atual no editor/detalhes; distinção de resultado realizado; fallback de preço salvo |
| Preços das skins | Correção do switch no editor, endpoint público e snapshots; BRL/USD/EUR independentes |
| Alertas | Skin, antes/depois, diferença monetária e percentual acima de 10%; identificação de fixação ativa |
| Exclusão | deleted=true; ocultação no catálogo/admin/vitrines/novas battles; histórico e métricas preservados; cache invalidado |
| Migração de preço | Identifica formato legado VE-as-price; mantém preço comercial salvo; escala demais moedas pela proporção legada; backup e versão 2 |
| Banco influencer | Leitura/incremento por caixa; não mistura com pool real; migração confere saldo contra histórico e guarda backup |
| Histórico | Snapshots por moeda; débito/moeda reais nas novas aberturas; aviso para divergências antigas |
| Taxas | Categorias criam/editam taxa Swap; enriquecimento da categoria nas caixas; remoção de cache indefinido; invalidação de caixas/catálogo no admin |
| Atualização do site | Cotação Swap ao selecionar/focar e a cada 15s; reconfirmação se total mudar; página da caixa atualiza a cada 30s/foco fora da animação |
| Upgrade | Sorteador crypto.randomInt, sem remapeamento de tickets perdedores; filtro customizado como Swap |
| Bots | Upload sequencial com confirmação arquivo→bot, progresso e erros individuais; arquivos anteriores preservados |
| Catálogo | Graffiti no classificador e categorias padrão |
| Arena / segurança | Origem/source do iframe conferidos; token não exibido na falha; erro de carregamento tratado |
| Admin | Constantes de endpoints ausentes corrigidas, desbloqueando build |

## Validações realizadas e seus limites

- Última execução: **49 testes passaram em 10 suítes**. Comando no backend:
  `pnpm exec jest --runInBand --watchman=false src/modules/case/utils case-financial-regression case-bank-isolation weapon-category-tax swap-minimum`.
- Builds de backend/admin/web aprovados após as últimas alterações de implementação. Admin mantém avisos de bundle grande.
- Testes cobrem exemplos de fórmulas, moedas, fixação, limites de tickets, propagação de taxa, exclusão lógica e isolamento/reconstrução dos bancos.
- São testes unitários/de contrato com dependências simuladas. Não houve compra real, teste visual integral ou validação HTTP completa do ambiente publicado.
- Upgrade: 100 mil sorteios por chance (400 mil no total), executados por comando inline, sem script persistido específico de simulação. Resultados preservados em RESULTADOS-TESTES-CAIXAS-UPGRADE.md.
- **Não foi executada uma simulação estatística completa por caixa para comprovar margem realizada.** Essa é a próxima prioridade, não uma entrega concluída.

## Auditoria somente leitura do banco configurado

Detalhes em AUDITORIA-CAIXAS-2026-09-15.md.

- 11 caixas consultadas: campos fixos nativos coincidiam com VE antigo; dry-run da migração identificou 11 candidatos.
- Das últimas 100 aberturas, 95 tinham snapshot nativo diferente de itemValue.
- As 100 eram testes/influencers; consulta separada de aberturas não-testes retornou zero neste banco. Não certifica outros ambientes nem a origem de saldos legados.
- 70 tinham inventário, todos com snapshot igual ao da abertura; 30 estavam convertidas. Ainda falta conciliar a carteira.
- Banco de teste compartilhado: 65,73 = JAPASKINS 70,14 + Abis Box −4,41. Migração por caixa preparada, sem alterar pool real.
- Não houve aplicação manual das migrações, alteração de saldo ou publicação. Migrações executarão no boot da versão compatível.

## O que falta — ordem de execução

1. **Relatório de margem por caixa e por skin.** Usar o motor real em simulação sem gravar: snapshot de preços/câmbio/configuração, moeda, quantidade, banco inicial e ambiente identificados. Comparar VE e margem de design com receita, payout, resultado e margem realizados; incluir frequência por skin, rerolls/fallbacks e banco final. Testar caixa simples, 5/10 itens, fixação ligada/desligada, bancos vazio/abastecido, BRL/USD/EUR e influencer/normal. Definir volume e tolerância pela variância, sem garantir margem exata em uma amostra finita.
2. **Conciliação histórica.** Cruzar aberturas, inventário e lançamentos da carteira, especialmente as 30 conversões da amostra. Não apagar registros nem inventar moedas/valores ausentes. Produzir proposta de reparação rastreável antes de mexer em saldos.
3. **Teste integrado financeiro.** Criar/editar caixa, mudar taxa/moeda/fixação, abrir em ambiente controlado e comparar editor/detalhes/web/débito/inventário. Testar concorrência, repetição, falhas e arquivamento durante abertura.
4. **Swap transacional e financeiro.** Testar saldo, skins, troco, taxa por categoria, mínimo BRL equivalente, idempotência e mudança de cotação. Separar preço comercial e custo real do fornecedor na leitura financeira.
5. **Validação de interface.** Conferir taxas com múltiplas instâncias, temas, Windows/filtros e upload com falha de rede. Inspecionar o temporizador de bots e esconder somente o timer interno, sem disfarçar bots como pessoas.
6. **Unity/WebGL.** Reproduzir e corrigir fechamento duplicado, imagens/URLs/fallback, progresso travado, clipping; validar respawns (torre/viatura/lateral), iluminação e visibilidade das caixas na cena.
7. **Segurança e publicação coordenada.** Completar revisão de autorização/validação, backup operacional, parar versão antiga e subir versão compatível. Conferir migrações e valores após subir; não executar migração isolada com versão antiga ativa.

## Dependências externas

- Avatares: designer/Vitor.
- Script de curva de jogadores por horário: Neto. Não apresentar contagem artificial como pessoas reais.
- Lista de skins baratas e preços aprovados nas três moedas: não fornecida integralmente.
- Validação visual/editor Unity para posições e iluminação.
- Temas de caixas e marketing eram ideias futuras, não requisitos técnicos fechados.

## Arquivos de consulta

- RESULTADOS-TESTES-CAIXAS-UPGRADE.md — resultados e diferença entre teste de fórmula e comprovação estatística.
- AUDITORIA-CAIXAS-2026-09-15.md — evidências do banco e limitações.
- Backend scripts/migrate-case-fixed-prices.js — dry-run da migração; não é simulador de margem.
