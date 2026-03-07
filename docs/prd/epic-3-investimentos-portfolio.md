# Epic 3 — Investimentos & Portfólio

> **PRD:** [docs/prd.md](../prd.md) | **Status:** Draft | **Prioridade:** P1 — Core do produto

## Objetivo

Dar visibilidade completa sobre a carteira de investimentos do usuário, com alocação por tipo de ativo, separação entre investimentos pessoais e empresariais, e acompanhamento do percentual-alvo configurado. A alocação-alvo é flexível e integrada ao Sistema de Sonhos (Epic 4).

---

## Requisitos Cobertos

- FR12, FR13, FR14, FR15
- NFR1, NFR6

---

## Conceito de Alocação Flexível

Diferente de apps convencionais, este sistema **não alerta como erro** quando a carteira está fora do target após um saque para um sonho. O estado "desbalanceado pós-sonho" é um estado legítimo com seu próprio fluxo de rebalanceamento gradual.

Estados possíveis da carteira:
```
EQUILIBRADA    → alocação atual ≈ target (tolerância ±5%)
SOB_SONHO      → modo sonho ativo: target diferenciado (mais liquidez)
REBALANCEANDO  → pós-saque de sonho: em gradual reequilíbrio para novo target
```

---

## Tipos de Ativo Suportados

| Tipo | Subtipo | Liquidez | Risco |
|------|---------|----------|-------|
| Tesouro Direto | Selic, IPCA+, Prefixado | Alta (Selic) / Baixa | Baixo |
| CDB | CDI, IPCA | Alta/Média | Baixo |
| LCI/LCA | — | Baixa | Baixo |
| FII | — | Alta (B3) | Médio |
| Ações | — | Alta (B3) | Alto |
| Cripto | BTC, ETH, outros | Alta | Alto |
| Previdência | PGBL, VGBL | Baixa | Variável |
| Fundo de Investimento | — | Variável | Variável |
| Conta Remunerada | — | Imediata | Muito Baixo |

---

## Histórias de Usuário

### Story 3.1 — Cadastro de Ativos

**Como** usuário,  
**quero** cadastrar meus ativos de investimento com seus detalhes,  
**para que** o sistema possa calcular minha alocação atual.

**Critérios de Aceite:**
- [ ] Formulário de cadastro de ativo: nome, tipo, subtipo, instituição (Nubank/XP/Bitybank/outro), valor atual, data da última atualização
- [ ] Campo "finalidade": pessoal_renda_passiva | empresarial | reserva_emergencia | sonho_especifico
- [ ] Suporte a todos os tipos da tabela acima
- [ ] Listagem de ativos com valor, tipo, instituição e % do portfólio total
- [ ] Valor total do portfólio calculado em tempo real
- [ ] Ativos de XP e Bitybank são pré-categorizados como investimento automaticamente

---

### Story 3.2 — Visão de Alocação

**Como** usuário,  
**quero** ver como meu portfólio está distribuído por tipo de ativo vs. meu target,  
**para que** eu saiba se minha carteira está dentro do planejado.

**Critérios de Aceite:**
- [ ] Gráfico de pizza/donut: alocação atual por tipo de ativo
- [ ] Tabela comparativa: tipo | valor atual | % atual | % target | diferença
- [ ] Indicador de estado da carteira: EQUILIBRADA / SOB_SONHO / REBALANCEANDO
- [ ] Quando REBALANCEANDO: exibir progresso "X% do caminho para o novo target"
- [ ] Separação visual: portfólio pessoal vs. empresarial
- [ ] Filtro para excluir ativos empresariais do cálculo pessoal

---

### Story 3.3 — Configuração de Alocação-Alvo

**Como** usuário,  
**quero** configurar qual percentual de cada tipo de ativo devo ter no portfólio,  
**para que** o sistema saiba quando estou dentro ou fora do planejado.

**Critérios de Aceite:**
- [ ] Tela de configuração com slider/input por tipo de ativo
- [ ] Soma total dos targets deve ser 100% (validação em tempo real)
- [ ] Suporte a targets diferentes por "modo": normal | sonho_ativo | rebalanceando
- [ ] Template sugerido baseado no perfil moderado (padrão) com opção de personalizar
- [ ] Histórico de mudanças de target com data

---

### Story 3.4 — Atualização de Valores

**Como** usuário,  
**quero** atualizar manualmente o valor dos meus ativos,  
**para que** o portfólio reflita os valores reais de mercado.

**Critérios de Aceite:**
- [ ] Botão "Atualizar valores" abre modal com lista de todos os ativos e campo de valor
- [ ] Data da última atualização exibida por ativo
- [ ] Ativos não atualizados há mais de 30 dias recebem badge "⚠️ Desatualizado"
- [ ] Histórico de valores por ativo (snapshot mensal automático)
- [ ] Gráfico de evolução do patrimônio total ao longo do tempo

---

### Story 3.5 — Relatório de Aportes

**Como** usuário,  
**quero** visualizar o histórico de aportes mensais por tipo de ativo,  
**para que** eu possa avaliar minha disciplina de investimento.

**Critérios de Aceite:**
- [ ] Transações com `type = investimento` são automaticamente associadas ao ativo correspondente
- [ ] Gráfico de barras: aportes mensais por tipo de ativo nos últimos 12 meses
- [ ] Total aportado no mês atual vs. meta mensal de aporte (configurável)
- [ ] % da renda pessoal investida no mês vs. target configurado

---

## Diagrama de Dados (Epic 3)

```
Asset                    AllocationTarget         AssetSnapshot
─────                    ────────────────         ─────────────
id                       id                       id
name                     asset_type               asset_id → Asset
type                     target_pct               month (YYYY-MM)
subtype                  mode (normal|dream|...)  value
institution              dream_id → Dream (null)  created_at
current_value            updated_at
last_updated
purpose (personal|biz|reserve|dream)
dream_id → Dream (null)
active
```

---

## Dependências

- Epic 1 (transações de investimento identificadas pelo classificador)
- Epic 4 (alocação target é influenciada pelo sonho ativo)

## Desbloqueia

- Epic 4 (sonhos usam alocação do portfólio)
- Epic 5 (reserva identifica ativos de alta liquidez)
- Epic 6 (projeções partem do portfólio atual)
