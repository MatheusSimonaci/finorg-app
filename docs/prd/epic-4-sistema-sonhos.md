# Epic 4 — Sistema de Sonhos

> **PRD:** [docs/prd.md](../prd.md) | **Status:** Draft | **Prioridade:** P1 — Diferencial do produto

## Objetivo

Implementar o módulo mais diferenciado da aplicação: um sistema de metas financeiras orientado por sonhos, onde a alocação da carteira é **flexível e orientada por objetivo** — não rígida. O sistema suporta o ciclo completo: planejamento → acumulação → saque → rebalanceamento gradual → próximo sonho.

---

## Requisitos Cobertos

- FR16, FR17, FR18, FR19

---

## O Modelo Mental dos Sonhos

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE UM SONHO                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PLANEJAMENTO        ACUMULAÇÃO          PÓS-SAQUE          │
│  ────────────        ──────────          ──────────          │
│  Cadastra sonho  →  Target muda:     →  Registra saque     │
│  Define valor       mais liquidez       Carteira desbalanced│
│  Define prazo       menos risco         (estado PREVISTO)   │
│  Define prioridade  Aporta gradual      Rebalanceia devagar │
│                     Acompanha progresso Vai ao próximo sonho│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Princípio fundamental:** Depois de sacar para realizar um sonho, a carteira desbalanceada **não é um erro** — é o estado esperado. O sistema não gera alertas urgentes de rebalanceamento, mas mostra progresso gradual de retorno ao equilíbrio para o próximo sonho.

---

## Estados de um Sonho

| Estado | Descrição |
|--------|-----------|
| `planejando` | Sonho cadastrado, calculando quanto precisar |
| `acumulando` | Sonho ativo: aportando ativos de liquidez para atingir o valor |
| `realizado` | Saque feito, sonho concluído |
| `arquivado` | Cancelado ou adiado indefinidamente |

---

## Histórias de Usuário

### Story 4.1 — Cadastro de Sonhos

**Como** usuário,  
**quero** cadastrar meus sonhos financeiros com valor, prazo e prioridade,  
**para que** o sistema possa me ajudar a planejar como alcançá-los.

**Critérios de Aceite:**
- [ ] Formulário: nome do sonho, valor-alvo (R$), prazo estimado (mês/ano), prioridade (ordem), descrição opcional
- [ ] Exemplos de sonhos: carro, viagem, imóvel, aposentadoria antecipada
- [ ] Listagem de sonhos ordenada por prioridade com drag-and-drop para reordenar
- [ ] Indicador visual: qual sonho está "ativo" (acumulando) vs. na fila
- [ ] Apenas um sonho pode estar ativo por vez (maior prioridade não arquivado/realizado)
- [ ] Status badge: PLANEJANDO | ACUMULANDO | REALIZADO | ARQUIVADO

---

### Story 4.2 — Cálculo de Acumulação

**Como** usuário,  
**quero** saber quanto preciso aportar mensalmente para alcançar meu sonho no prazo,  
**para que** eu possa planejar minha reserva de liquidez adequadamente.

**Critérios de Aceite:**
- [ ] Cálculo: `aporte_mensal = (valor_alvo - já_reservado) / meses_restantes`
- [ ] Exibição: "Para alcançar [sonho] em [prazo], você precisa reservar R$X/mês"
- [ ] Barra de progresso: valor já reservado / valor-alvo
- [ ] Simulador: "Se eu aportar R$Y/mês, alcanço em quantos meses?"
- [ ] Integração com portfólio: mostra quais ativos já estão "earmarked" para este sonho

---

### Story 4.3 — Modo Sonho Ativo (Alocação Diferenciada)

**Como** usuário,  
**quero** que quando um sonho estiver ativo, o sistema me sugira uma alocação diferente da carteira,  
**para que** eu mantenha mais liquidez para sacá-la quando o sonho for realizado.

**Critérios de Aceite:**
- [ ] Quando sonho ativo, exibir alerta no módulo de investimentos: "Sonho '[nome]' ativo — alocação recomendada ajustada"
- [ ] Comparação visual: alocação-target normal vs. alocação-target modo sonho
- [ ] Módulo de investimentos mostra: "R$X reservado para [sonho]" destacado na carteira
- [ ] Sugestão de quais ativos usar para o sonho (sempre os de maior liquidez e menor risco)
- [ ] Usuário pode personalizar a alocação do modo sonho (sobrescrever sugestão)

---

### Story 4.4 — Registro de Realização do Sonho

**Como** usuário,  
**quero** registrar quando realizei um sonho,  
**para que** o sistema atualize o portfólio, comemore a conquista e inicie o próximo ciclo.

**Critérios de Aceite:**
- [ ] Botão "Realizar sonho" disponível quando progresso ≥ 90% do valor-alvo
- [ ] Modal de confirmação: valor sacado, data, observação
- [ ] Após confirmação: atualiza valor dos ativos afetados (saque registrado)
- [ ] Estado muda para REALIZADO com data de conquista
- [ ] Tela de celebração com histórico de sonhos realizados
- [ ] Próximo sonho na fila automaticamente promovido para ACUMULANDO
- [ ] Estado da carteira muda para REBALANCEANDO (não alerta, apenas informa)

---

### Story 4.5 — Trilha de Rebalanceamento Pós-Sonho

**Como** usuário,  
**quero** ver como minha carteira está progredindo no rebalanceamento após realizar um sonho,  
**para que** eu saiba quando voltei ao equilíbrio para o próximo objetivo.

**Critérios de Aceite:**
- [ ] Dashboard de rebalanceamento: alocação atual vs. target do próximo sonho
- [ ] Indicador de progresso: "X% do caminho para o equilíbrio do próximo sonho"
- [ ] Barra de progresso por tipo de ativo: "Tesouro Selic: 15% atual → 25% target (+10%)"
- [ ] Sugestão de onde aportar para rebalancear mais rápido
- [ ] O sistema **não** sinaliza como erro a carteira desbalanceada — apenas como "em progresso"
- [ ] Estimativa: "Rebalanceamento completo em X meses no ritmo de aporte atual"

---

## Diagrama de Dados (Epic 4)

```
Dream                    DreamAllocation          DreamMilestone
─────                    ───────────────          ──────────────
id                       id                       id
name                     dream_id → Dream         dream_id → Dream
target_amount            asset_id → Asset         title
target_date              earmarked_amount         target_amount
priority_order           updated_at               reached_at (nullable)
status                                            notes
achieved_at (nullable)
archived_at (nullable)
notes
```

---

## Dependências

- Epic 3 (portfólio de ativos é a base)
- Epic 2 (percentual de investimento mensal)

## Desbloqueia

- Epic 6 (simulador de prazo para sonhos)
