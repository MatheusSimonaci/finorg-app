# Epic 1 — Importação & Classificação IA

> **PRD:** [docs/prd.md](../prd.md) | **Status:** Draft | **Prioridade:** P0 — Desbloqueia todos os outros épicos

## Objetivo

Permitir que o usuário importe extratos CSV dos seus bancos (Nubank, XP, Bitybank) e tenha cada transação automaticamente classificada por um agente de IA em 3 dimensões: natureza, categoria e tipo. O usuário deve poder revisar e corrigir classificações, e o sistema deve aprender com essas correções.

**Por que este épico é o primeiro:** Sem dados importados e classificados, nenhum outro módulo funciona. Este é o alicerce.

---

## Requisitos Cobertos

- FR1, FR2, FR3, FR4, FR5, FR6
- NFR1, NFR2, NFR3, NFR4, NFR6, NFR7

---

## Contexto de Classificação (Regras Pré-configuradas)

O agente de IA deve ser inicializado com as seguintes regras de contexto do usuário:

```yaml
accounts:
  nubank:
    type: checking
    use: mixed  # pessoal + empresa misturados
  xp:
    type: investment
    use: investment_only  # nunca gastos pessoais
  bitybank:
    type: crypto
    use: investment_only  # nunca gastos pessoais

classification_rules:
  - pattern: "CAPCUT|ADOBE|FIGMA|CANVA|NOTION|SLACK|LINEAR"
    nature: work_tool
    category: subscription
    note: "Ferramenta de trabalho da empresa"
  - pattern: "BITYBANK|XP INVESTIMENTOS|TESOURO|CDB|FII|AÇÕES"
    nature: personal
    category: investment
  - account: xp
    nature: personal
    category: investment
  - account: bitybank
    nature: personal
    category: investment
```

---

## Dimensões de Classificação

Toda transação recebe exatamente estas 3 dimensões preenchidas:

```
natureza:   pessoal | empresa | work_tool | misto
categoria:  saúde | educação | lazer | alimentação | moradia |
            assinatura | investimento | transporte | receita |
            pet | serviços | outros
tipo:       gasto | investimento | reserva | receita | transferência
```

---

## Fluxo do Usuário

```
1. Usuário baixa CSV do banco (Nubank app → exportar extrato)
       ↓
2. Usuário faz upload no sistema (drag & drop ou file picker)
       ↓
3. Sistema detecta o banco pelo formato/nome do arquivo
       ↓
4. Sistema faz backup automático do SQLite
       ↓
5. Sistema envia transações em lote para a API OpenAI
       ↓
6. Resultado é salvo com classifications + confidence score
       ↓
7. Tela "Revisão de Importação" exibe:
   - ✅ Classificadas com alta confiança (confidence ≥ 0.75) → auto-aprovadas
   - ⚠️  Baixa confiança (< 0.75) → aguardando revisão manual
       ↓
8. Usuário revisa e aprova/corrige as transações sinalizadas
       ↓
9. Correções geram regras permanentes de classificação
       ↓
10. Transações são incorporadas ao banco de dados definitivo
```

---

## Histórias de Usuário

### Story 1.1 — Setup Inicial e Infraestrutura

**Como** desenvolvedor,  
**quero** ter o projeto Next.js inicializado com SQLite + Prisma + shadcn/ui configurados,  
**para que** as histórias seguintes possam construir sobre uma base sólida.

**Critérios de Aceite:**
- [ ] Projeto Next.js 14 inicializado com TypeScript
- [ ] Prisma configurado com SQLite como provider
- [ ] Schema Prisma com modelos: Account, Transaction, ClassificationRule, Asset, Dream, Budget
- [ ] shadcn/ui instalado e configurado com tema financeiro (dark mode suportado)
- [ ] Recharts instalado
- [ ] Estrutura de pastas definida: `app/`, `components/`, `lib/`, `prisma/`
- [ ] Script de seed com dados de exemplo para desenvolvimento
- [ ] `npm run dev` funciona sem erros

---

### Story 1.2 — Parser de CSV por Banco

**Como** usuário,  
**quero** importar meu extrato CSV do Nubank, XP ou Bitybank,  
**para que** o sistema entenda o formato de cada banco automaticamente.

**Critérios de Aceite:**
- [ ] Parser para CSV do Nubank (colunas: Data, Descrição, Valor)
- [ ] Parser para CSV da XP Investimentos (formato específico)
- [ ] Parser para CSV do Bitybank
- [ ] Detecção automática do banco pelo formato/header do arquivo
- [ ] Normalização para schema unificado: `{ date, description, amount, account, rawData }`
- [ ] Validação: rejeitar arquivos mal-formatados com mensagem de erro clara
- [ ] Desduplicação: não importar transações que já existem no banco (por hash)
- [ ] Tela de upload com drag & drop e indicador de progresso

---

### Story 1.3 — Agente de Classificação IA

**Como** usuário,  
**quero** que as transações importadas sejam classificadas automaticamente por IA,  
**para que** eu não precise categorizar cada gasto manualmente.

**Critérios de Aceite:**
- [ ] Integração com OpenAI API (GPT-4o-mini) para classificação em lote
- [ ] API key configurável via variável de ambiente ou tela de configurações
- [ ] Prompt do sistema inclui regras contextuais pré-configuradas do usuário
- [ ] Cada transação recebe: `nature`, `category`, `subcategory`, `confidence` (0-1), `reasoning`
- [ ] Processamento em batches de 20 transações por chamada (custo controlado)
- [ ] Fallback graceful se API indisponível: transações ficam como "pendente de classificação"
- [ ] Log de tokens consumidos por importação

---

### Story 1.4 — Tela de Revisão e Aprovação

**Como** usuário,  
**quero** revisar as transações com classificação duvidosa e corrigir quando necessário,  
**para que** os dados no sistema sejam precisos.

**Critérios de Aceite:**
- [ ] Tela lista todas as transações da importação mais recente
- [ ] Transações com `confidence < 0.75` são destacadas com tag "⚠️ Revisar"
- [ ] Usuário pode editar `nature`, `category` e `type` de qualquer transação
- [ ] Botão "Aprovar todas as seguras" aprova em lote as de alta confiança
- [ ] Campo "reembolsável pela empresa" toggle em transações business/work_tool
- [ ] Resumo ao final: "X importadas, Y aprovadas, Z aguardando revisão"
- [ ] Botão "Confirmar importação" só fica ativo quando não há transações na fila de revisão

---

### Story 1.5 — Regras de Aprendizado

**Como** usuário,  
**quero** que minhas correções de classificação gerem regras permanentes,  
**para que** importações futuras classificadas corretamente sem precisar revisar novamente.

**Critérios de Aceite:**
- [ ] Ao corrigir uma classificação, o sistema pergunta: "Criar regra permanente para transações com '{descrição}'?"
- [ ] Regras são salvas com: `pattern` (texto ou regex), `nature`, `category`, `type`
- [ ] Regras têm prioridade sobre a classificação IA nas próximas importações
- [ ] Tela de configurações exibe e permite editar/deletar regras salvas
- [ ] Regras pré-configuradas do usuário são carregadas na instalação inicial

---

## Diagrama de Dados (Epic 1)

```
Account          Transaction              ClassificationRule
─────────        ───────────              ─────────────────
id               id                       id
name             date                     pattern (text/regex)
institution      description              nature
type             amount                   category
                 account_id → Account     type
                 nature                   subcategory
                 category                 source (user|system)
                 subcategory              created_at
                 type
                 confidence
                 reasoning
                 is_reimbursable
                 classification_override
                 import_batch_id
                 hash (dedup)
```

---

## Dependências

- Nenhuma (este é o Epic fundação)

## Desbloqueia

- Epic 2 (Dashboard precisa de transações classificadas)
- Epic 3 (Investimentos precisam de transações tipo=investimento)
- Epic 5 (Reserva precisa de histórico de gastos pessoais)
