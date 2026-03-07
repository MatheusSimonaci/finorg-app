# Epic 6 — Projeções & Simulador

> **PRD:** [docs/prd.md](../prd.md) | **Status:** Draft | **Prioridade:** P2 — Valor estratégico

## Objetivo

Projetar o crescimento do patrimônio ao longo do tempo e simular cenários de aporte mensal para atingir sonhos no prazo desejado. As projeções devem ser honestas, configuráveis e baseadas nos dados reais da aplicação.

---

## Requisitos Cobertos

- FR24, FR25, FR26

---

## Premissas de Cálculo

As projeções usam as seguintes variáveis configuráveis:
- **Taxa de rendimento anual**: configurável por tipo de ativo (ex: Selic + 0,5%, 8% a.a., 15% a.a.)
- **Aporte mensal**: baseado no histórico ou definido manualmente para simulação
- **Inflação projetada**: configurável (padrão: 4,5% a.a. — IPCA médio)
- **Imposto de renda**: aplicado automaticamente conforme tipo de ativo e prazo

As projeções mostram valores **nominais e reais** (ajustados pela inflação configurada).

---

## Histórias de Usuário

### Story 6.1 — Projeção de Patrimônio

**Como** usuário,  
**quero** visualizar como meu patrimônio vai crescer nos próximos anos,  
**para que** eu possa avaliar se estou no caminho certo para meus objetivos de longo prazo.

**Critérios de Aceite:**
- [ ] Gráfico de linha: patrimônio projetado nos próximos 1, 3, 5, 10 e 20 anos
- [ ] Linha sólida: projeção com aporte atual + rendimento configurado
- [ ] Linha tracejada: projeção sem aportes (só rendimento — cenário pessimista)
- [ ] Marcadores nos anos de sonhos agendados (ex: carro em 2027, imóvel em 2031)
- [ ] Toggle: exibir valores nominais ou reais (ajustados por inflação)
- [ ] Breakdown por tipo de ativo no horizonte selecionado

---

### Story 6.2 — Simulador de Sonhos

**Como** usuário,  
**quero** simular quanto tempo levo para atingir um sonho específico com diferentes cenários de aporte,  
**para que** eu possa tomar decisões informadas sobre quanto priorizar cada objetivo.

**Critérios de Aceite:**
- [ ] Seleção do sonho a simular (dropdown com sonhos cadastrados)
- [ ] Slider de aporte mensal adicional (além do já investido)
- [ ] Resultado em tempo real: "Com R$X/mês a mais, you atingirá [sonho] em Y meses (data: MM/AAAA)"
- [ ] Comparação de 3 cenários lado a lado: conservador, atual, acelerado
- [ ] Integração com alocação: sugere onde aportar para maximizar liquidez para o sonho

---

### Story 6.3 — Projeção de Fluxo de Caixa

**Como** usuário,  
**quero** visualizar o fluxo de caixa estimado dos próximos 3 meses,  
**para que** eu me prepare para meses com maior comprometimento.

**Critérios de Aceite:**
- [ ] Calendário mensal dos próximos 3 meses com entradas e saídas previstas
- [ ] Gastos fixos identificados automaticamente (recorrentes nos últimos 3 meses)
- [ ] Parcelas e sazonais do Epic 2 integrados aqui
- [ ] Saldo estimado ao final de cada mês
- [ ] Alertas antecipados: "Em [mês] você terá R$X de comprometimento acima da média"

---

### Story 6.4 — Configuração de Parâmetros de Projeção

**Como** usuário,  
**quero** configurar as taxas de rendimento, inflação e imposto usadas nas projeções,  
**para que** as projeções reflitam minha visão de mercado.

**Critérios de Aceite:**
- [ ] Taxa de rendimento por tipo de ativo (padrões sugeridos, editáveis)
- [ ] Taxa de inflação anual projetada (padrão: 4,5%)
- [ ] Alíquota de imposto de renda por tipo (tabela regressiva de RF, 15% de RV)
- [ ] Opção de usar taxa Selic atual via API pública (BACEN) — opcional, com fallback manual
- [ ] Cada projeção exibe os parâmetros usados no cálculo para transparência

---

## Parâmetros Padrão de Rendimento

| Tipo de Ativo | Taxa Padrão | Observação |
|---------------|------------|------------|
| Tesouro Selic | Selic (configurável) | Atualizado manualmente |
| CDB CDI | CDI × 100% | Variável conforme banco |
| LCI/LCA | CDI × 90% | Isento de IR |
| FII | 0,8% a.m. | Estimativa conservadora |
| Ações | 12% a.a. | Estimativa histórica B3 |
| Cripto | 20% a.a. | Alta volatilidade — conservador |
| Previdência | 8% a.a. | Estimativa média de fundo |

---

## Diagrama de Dados (Epic 6)

```
ProjectionConfig
────────────────
id
inflation_rate_annual (default: 0.045)
asset_type
expected_return_annual
ir_rate
use_selic_api (default: false)
updated_at

-- Projeções são calculadas em runtime, sem persistência necessária
-- Apenas os parâmetros são persistidos
```

---

## Dependências

- Epic 1 (histórico de transações para gastos fixos)
- Epic 3 (portfólio atual como ponto de partida)
- Epic 4 (sonhos e prazos como marcadores na projeção)
- Epic 5 (reserva de emergência influencia patrimônio líquido disponível)

## Desbloqueia

- Epic 7 (snapshot incluirá mini-projeção)
