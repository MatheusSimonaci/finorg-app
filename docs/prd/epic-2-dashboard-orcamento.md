# Epic 2 — Dashboard & Orçamento por %

> **PRD:** [docs/prd.md](../prd.md) | **Status:** Draft | **Prioridade:** P1 — Core UX

## Objetivo

Criar o dashboard central da aplicação e o módulo de orçamento por percentual. O usuário deve ver em uma tela o resumo financeiro do mês e conseguir definir para onde cada percentual da renda deve ir, com alertas automáticos ao ultrapassar limites.

---

## Requisitos Cobertos

- FR7, FR8, FR9, FR10, FR11
- NFR5, NFR8

---

## Conceito de Renda Líquida Pessoal

O sistema calcula a "renda líquida pessoal" excluindo:
- Transações com `nature = empresa` ou `nature = work_tool`
- Transações marcadas como `is_reimbursable = true`
- Receitas de PJ (identificadas pelo agente como receita empresarial)

Esta é a base de cálculo para todos os percentuais de orçamento.

---

## Histórias de Usuário

### Story 2.1 — Dashboard Central

**Como** usuário,  
**quero** ver um resumo financeiro claro ao abrir a aplicação,  
**para que** eu tenha visão instantânea da saúde financeira do mês.

**Critérios de Aceite:**
- [ ] Saldo líquido pessoal do mês (receitas pessoais - gastos pessoais)
- [ ] Cards de KPIs: Receita total | Gastos totais | Investido no mês | Reserva atual
- [ ] Barra de progresso global: % do orçamento total já consumido no mês
- [ ] Lista de alertas ativos (categorias acima do limite)
- [ ] Atalhos para os módulos principais: Transações, Orçamento, Sonhos, Reserva
- [ ] Indicador do mês atual com navegação para meses anteriores
- [ ] Último snapshot: data/hora da última importação de dados

---

### Story 2.2 — Configuração de Orçamento por %

**Como** usuário,  
**quero** definir qual percentual da minha renda líquida pessoal deve ir para cada categoria,  
**para que** eu tenha um plano financeiro personalizado.

**Critérios de Aceite:**
- [ ] Tela de configuração lista todas as categorias com campo de % editável
- [ ] Soma dos percentuais é exibida em tempo real (deve totalizar ≤ 100%)
- [ ] Categorias suportadas: moradia, alimentação, transporte, saúde, educação, lazer, assinaturas, outros
- [ ] Categoria "investimentos" é gerenciada separadamente no Epic 3
- [ ] Sugestão de template inicial baseada na regra 50/30/20 (configurável)
- [ ] Configuração é persistida e se aplica a todos os meses futuros (pode sobrescrever por mês)

---

### Story 2.3 — Painel de Orçamento (Real vs. Planejado)

**Como** usuário,  
**quero** visualizar meus gastos reais comparados com o orçamento planejado por categoria,  
**para que** eu saiba onde estou dentro ou fora do plano.

**Critérios de Aceite:**
- [ ] Lista de categorias com barra de progresso: real (R$) vs. limite (R$ e %)
- [ ] Cor da barra: verde (< 80%), amarelo (80-100%), vermelho (> 100%)
- [ ] Valor absoluto e percentual exibidos: "R$ 850 / R$ 1.200 (70%)"
- [ ] Categorias acima do limite topo da lista com destaque visual
- [ ] Filtro por mês com histórico dos últimos 6 meses
- [ ] Gráfico de barras empilhadas com evolução mensal por categoria

---

### Story 2.4 — Sistema de Alertas

**Como** usuário,  
**quero** receber alertas quando estou prestes a ou já ultrapassei um limite de categoria,  
**para que** eu possa tomar decisões conscientes antes de gastar mais.

**Critérios de Aceite:**
- [ ] Alerta nível 1 (amarelo): categoria atingiu 80% do limite mensal
- [ ] Alerta nível 2 (vermelho): categoria ultrapassou 100% do limite
- [ ] Alerta de parcela: parcela grande chegando nos próximos 30 dias
- [ ] Alerta de gasto sazonal: despesa anual (IPTU, seguro) prevista no próximo mês
- [ ] Alertas aparecem no dashboard e em badge no ícone da categoria
- [ ] Usuário pode "silenciar" um alerta específico com justificativa

---

### Story 2.5 — Projeção de Parcelas e Gastos Sazonais

**Como** usuário,  
**quero** visualizar parcelas futuras e gastos anuais previstos nos próximos meses,  
**para que** eu me planeje para meses com maior comprometimento de renda.

**Critérios de Aceite:**
- [ ] Cadastro manual de: parcelas (valor, nº total, nº atual, categoria) e gastos anuais (mês de ocorrência, valor estimado)
- [ ] Calendário/timeline dos próximos 3 meses com compromissos financeiros mapeados
- [ ] Cada mês futuro exibe: gastos fixos + parcelas + sazonais = total comprometido estimado
- [ ] Comparação: total comprometido estimado vs. renda média dos últimos 3 meses

---

## Diagrama de Dados (Epic 2)

```
BudgetRule                MonthlySnapshot          RecurringExpense
──────────                ───────────────          ────────────────
id                        id                       id
category                  month (YYYY-MM)          name
target_pct                net_income_personal      type (installment|annual)
alert_threshold_pct       total_expenses           amount
month_override (nullable) total_invested           total_installments (nullable)
                          reserve_value            current_installment (nullable)
                          net_worth                due_month (nullable)
                          created_at               category
                                                   active
```

---

## Dependências

- Epic 1 completo (transações classificadas como base)

## Desbloqueia

- Epic 3 (usa mesma estrutura de dashboard)
- Epic 6 (projeções partem dos dados de orçamento)
