# Epic 5 — Reserva de Emergência

> **PRD:** [docs/prd.md](../prd.md) | **Status:** Draft | **Prioridade:** P1 — Segurança financeira base

## Objetivo

Gerenciar a reserva de emergência do usuário com meta dinâmica calculada automaticamente com base nos gastos pessoais reais. Meta configurada: 4 meses de gastos pessoais. O módulo deve identificar quais ativos cobrem a reserva e alertar quando ela está abaixo do mínimo.

---

## Requisitos Cobertos

- FR20, FR21, FR22, FR23

---

## Regra de Cálculo da Reserva

```
gastos_pessoais_mensais = média dos últimos 3-6 meses 
                          de gastos com nature = pessoal

meta_reserva = gastos_pessoais_mensais × meses_configurados (padrão: 4)

cobertura_atual = sum(valor) de ativos com purpose = reserva_emergencia
```

A reserva deve ser composta por ativos de **alta liquidez e baixo risco**:
- Conta remunerada (Nubank Reservas, etc.)
- Tesouro Selic
- CDB com liquidez diária

---

## Histórias de Usuário

### Story 5.1 — Configuração da Meta de Reserva

**Como** usuário,  
**quero** configurar quantos meses de gastos minha reserva de emergência deve cobrir,  
**para que** eu tenha uma meta clara a perseguir.

**Critérios de Aceite:**
- [ ] Campo configurável: número de meses (padrão: 4, range: 1-24)
- [ ] Janela de cálculo configurável: média dos últimos 1, 3 ou 6 meses
- [ ] Exclusão de gastos eventuais altos (ex: mês com compra de eletrônico) — toggle
- [ ] Valor-alvo calculado automaticamente e exibido em destaque
- [ ] Atualização automática quando novos dados de gastos são importados

---

### Story 5.2 — Painel de Reserva de Emergência

**Como** usuário,  
**quero** visualizar minha reserva de emergência atual comparada com a meta,  
**para que** eu saiba o quanto ainda preciso acumular.

**Critérios de Aceite:**
- [ ] Barra de progresso: valor atual / valor-alvo da reserva
- [ ] KPIs: valor atual (R$), valor-alvo (R$), cobertura em meses (atual), meses faltando
- [ ] Estado visual: 🔴 < 50% da meta | 🟡 50-80% | 🟢 80-100% | 🏆 Completa
- [ ] Lista de ativos que compõem a reserva com valor de cada um
- [ ] Data da última atualização dos valores dos ativos

---

### Story 5.3 — Alertas de Reserva

**Como** usuário,  
**quero** ser alertado quando minha reserva estiver abaixo do mínimo seguro,  
**para que** eu priorize reconstruí-la antes de outros gastos.

**Critérios de Aceite:**
- [ ] Alerta crítico (🔴): reserva abaixo de 2 meses — exibido no dashboard central
- [ ] Alerta de atenção (🟡): reserva entre 2 e 4 meses (meta configurada)
- [ ] Sugestão automática: "Aporte R$X/mês para atingir a meta em Y meses"
- [ ] Alertas não bloqueantes — apenas informativos

---

### Story 5.4 — Designação de Ativos para a Reserva

**Como** usuário,  
**quero** marcar quais ativos fazem parte da minha reserva de emergência,  
**para que** o sistema calcule a cobertura corretamente.

**Critérios de Aceite:**
- [ ] Na tela de cadastro/edição de ativo, campo purpose com opção reserva_emergencia
- [ ] Filtro na listagem de ativos por finalidade
- [ ] Validação: sistema alerta se ativo de baixa liquidez (ex: ações) for marcado como reserva
- [ ] Sugestão automática: ao cadastrar Nubank Reservas ou Tesouro Selic, sugerir marcar como reserva

---

## Diagrama de Dados (Epic 5)

```
EmergencyReserveConfig
──────────────────────
id
target_months (default: 4)
calculation_window_months (default: 3)
exclude_outliers (default: false)
created_at
updated_at

-- Ativos com purpose = reserva_emergencia já existem em Asset (Epic 3)
-- Gastos pessoais já existem em Transaction (Epic 1)
-- Cálculo é feito em runtime, sem tabela adicional necessária
```

---

## Dependências

- Epic 1 (histórico de gastos pessoais para média)
- Epic 3 (ativos com purpose = reserva_emergencia)

## Desbloqueia

- Epic 6 (projeções consideram reserva)
