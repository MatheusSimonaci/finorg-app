# Finança Pessoal — Product Requirements Document (PRD)

> **Versão:** 1.0.0 | **Data:** 2026-03-07 | **Status:** Draft | **Autor:** PM (Morgan)

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-03-07 | 1.0.0 | Criação inicial do PRD | Morgan (@pm) |

---

## Índice de Épicos (PRD Sharded)

Este PRD está dividido em épicos separados para facilitar o desenvolvimento iterativo.

| Épico | Arquivo | Status |
|-------|---------|--------|
| Epic 1 — Importação & Classificação IA | [epic-1-importacao-classificacao.md](prd/epic-1-importacao-classificacao.md) | Draft |
| Epic 2 — Dashboard & Orçamento por % | [epic-2-dashboard-orcamento.md](prd/epic-2-dashboard-orcamento.md) | Draft |
| Epic 3 — Investimentos & Portfólio | [epic-3-investimentos-portfolio.md](prd/epic-3-investimentos-portfolio.md) | Draft |
| Epic 4 — Sistema de Sonhos | [epic-4-sistema-sonhos.md](prd/epic-4-sistema-sonhos.md) | Draft |
| Epic 5 — Reserva de Emergência | [epic-5-reserva-emergencia.md](prd/epic-5-reserva-emergencia.md) | Draft |
| Epic 6 — Projeções & Simulador | [epic-6-projecoes-simulador.md](prd/epic-6-projecoes-simulador.md) | Draft |
| Epic 7 — Snapshot Mobile Estático | [epic-7-snapshot-mobile.md](prd/epic-7-snapshot-mobile.md) | Draft |

---

## Resumo do Produto

**Nome:** Finança Pessoal (interno: "FinOrg")  
**Tipo:** Aplicação web local-first de organização financeira pessoal  
**Usuário primário:** Pessoa física com renda mista (CLT + freelance/PJ), que usa a mesma conta bancária para gastos pessoais e da empresa, e investe com foco em renda passiva e realização de sonhos de forma gradual.

---

## Objetivos

- Dar visibilidade clara sobre para onde vai o dinheiro, separando gastos pessoais de empresariais
- Permitir definir e acompanhar percentuais-alvo de gasto por categoria
- Acompanhar a evolução da carteira de investimentos com alocação flexível orientada por sonhos
- Gerenciar a reserva de emergência com meta de 4 meses de gastos pessoais
- Projetar patrimônio futuro e estimar prazo para realização de sonhos/metas
- Funcionar 100% local com visualização estática no celular após atualização no computador

---

## Requisitos Funcionais (Consolidados)

### Importação e Classificação

- **FR1:** O sistema deve permitir importação de extratos CSV dos bancos Nubank, XP e Bitybank.
- **FR2:** Um agente de IA deve classificar automaticamente cada transação em 3 dimensões: natureza (pessoal/empresa/work_tool/misto), categoria (saúde/educação/lazer/alimentação/moradia/assinatura/investimento/receita/outros) e tipo (gasto/investimento/reserva/receita).
- **FR3:** O agente deve ser pré-instruído com regras contextuais do usuário (ex: CapCut = work_tool/empresa; Bitybank = sempre investimento).
- **FR4:** Transações com confiança de classificação baixa (<0.75) devem ser sinalizadas para revisão manual.
- **FR5:** O usuário deve poder corrigir a classificação de qualquer transação, e correções devem gerar regras permanentes de aprendizado.
- **FR6:** O sistema deve permitir marcação de transações como "reembolsável pela empresa".

### Orçamento e Gastos

- **FR7:** O usuário deve poder configurar percentuais-alvo da renda líquida pessoal para cada categoria de gasto.
- **FR8:** O dashboard deve exibir o gasto real vs. planejado por categoria no mês corrente.
- **FR9:** O sistema deve emitir alertas quando um gasto ultrapassa o percentual configurado.
- **FR10:** O sistema deve exibir gastos sazonais/anuais (IPTU, IPVA, seguros) com projeção de meses futuros afetados.
- **FR11:** O sistema deve exibir parcelas de cartão com projeção futura de comprometimento.

### Investimentos e Portfólio

- **FR12:** O usuário deve poder registrar ativos por tipo (Tesouro Direto, CDB, FII, ações, cripto, previdência).
- **FR13:** O sistema deve calcular alocação percentual atual por tipo de ativo vs. target configurado.
- **FR14:** O portfólio deve distinguir investimentos pessoais (renda passiva) de investimentos empresariais.
- **FR15:** O usuário deve poder atualizar manualmente o valor de cada ativo.

### Sistema de Sonhos

- **FR16:** O usuário deve poder cadastrar sonhos/metas com nome, valor-alvo, prazo estimado e prioridade.
- **FR17:** Quando um sonho está ativo, o sistema deve sugerir uma alocação-alvo diferenciada (mais liquidez/menor risco) para o portfólio.
- **FR18:** Após o saque para realizar um sonho, o sistema deve registrar o desbalanceamento como previsto (não alertar como erro) e exibir o progresso de rebalanceamento gradual rumo ao próximo sonho.
- **FR19:** O sistema deve calcular quanto falta de aporte mensal para atingir o sonho no prazo estimado.

### Reserva de Emergência

- **FR20:** O usuário deve poder configurar a meta de meses de cobertura da reserva (padrão: 4 meses).
- **FR21:** O sistema deve calcular automaticamente o valor-alvo da reserva com base na média de gastos pessoais dos últimos 3-6 meses.
- **FR22:** O sistema deve exibir o progresso atual da reserva vs. meta com indicador visual.
- **FR23:** O sistema deve identificar quais ativos estão alocados como reserva de emergência.

### Projeções

- **FR24:** O sistema deve projetar o patrimônio líquido em 1, 3, 5 e 10 anos com base no aporte mensal atual e taxa de rendimento configurável.
- **FR25:** O simulador deve permitir calcular: "Se aportar R$X/mês, em quanto tempo atingirei o sonho Y?"
- **FR26:** O sistema deve projetar o fluxo de caixa dos próximos 3 meses com base em gastos fixos conhecidos e parcelas previstas.

### Snapshot Mobile

- **FR27:** O sistema deve gerar um export estático (HTML/JSON) do dashboard que possa ser hospedado no Vercel.
- **FR28:** O snapshot mobile deve ser somente-leitura e refletir o estado no momento do último export.
- **FR29:** O usuário deve poder disparar o build do snapshot com um único comando/botão.

---

## Requisitos Não-Funcionais

- **NFR1:** O banco de dados deve ser SQLite local (arquivo único), sem necessidade de servidor externo.
- **NFR2:** A aplicação deve funcionar completamente offline, sem dependência de internet para uso diário.
- **NFR3:** A chamada à API de IA (classificação) deve ser a única operação que requer internet, e deve funcionar em lote.
- **NFR4:** O custo mensal de operação deve ser inferior a R$10 (incluindo eventuais chamadas de API).
- **NFR5:** A aplicação deve iniciar em menos de 3 segundos em hardware comum.
- **NFR6:** Os dados do usuário nunca devem ser enviados a terceiros, exceto as descrições de transações enviadas à API de classificação IA (OpenAI), que deve usar a API key do próprio usuário.
- **NFR7:** O sistema deve ter backup automático do banco SQLite antes de qualquer importação de novos dados.
- **NFR8:** A interface deve ser responsiva e utilizável em telas de 1280px+.

---

## Premissas Técnicas

| Decisão | Escolha | Rationale |
|---------|---------|-----------|
| Framework | Next.js 14 (App Router) | Full-stack, static export nativo, ecossistema robusto |
| Banco de dados | SQLite + Prisma ORM | Local-first, arquivo único, backup trivial |
| UI Components | shadcn/ui + Tailwind CSS | Rápido de desenvolver, visual profissional |
| Gráficos | Recharts | Flexível para gráficos financeiros customizados |
| Classificação IA | OpenAI GPT-4o-mini | Custo baixo (~$0.01/100 transações), contexto grande |
| Import CSV | Papa Parse | Parseia CSV do Nubank/XP sem dependências pesadas |
| Export estático | `next export` + Vercel | Deploy gratuito, acesso mobile read-only |
| Arquitetura | Monolito (monorepo) | Solução pessoal, escopo definido, sem necessidade de microsserviços |
| Testes | Unit + Integration | Funções de cálculo financeiro são críticas, devem ter cobertura |
| Repositório | Monorepo (single) | Produto único, sem necessidade de polyrepo |

---

## Contas Bancárias Suportadas (V1)

| Banco | Tipo | Observação |
|-------|------|------------|
| Nubank | Conta corrente + cartão | Gastos pessoais e empresariais misturados |
| XP Investimentos | Investimentos | Exclusivamente investimentos — nunca gastos pessoais |
| Bitybank | Cripto/Investimentos | Exclusivamente investimentos/cripto — nunca gastos pessoais |

---

## Restrições e Limitações

- **CON1:** V1 não inclui integração automática com APIs bancárias (Open Finance). Importação é manual via CSV.
- **CON2:** V1 não inclui atualização em tempo real de cotações. Valores de ativos são atualizados manualmente.
- **CON3:** O snapshot mobile é estático — não atualiza em tempo real, apenas quando o usuário gera um novo export.
- **CON4:** Multi-usuário não está no escopo da V1.
- **CON5:** Moeda única: Real Brasileiro (BRL). Sem suporte a multi-moeda na V1.

---

## Telas Principais (Visão de Produto)

1. **Dashboard Central** — Saldo líquido, alertas ativos, resumo do mês, progresso de metas
2. **Transações** — Lista importada com classificação IA + revisão manual
3. **Orçamento** — Configuração de % por categoria + barra de progresso real vs. planejado
4. **Investimentos** — Portfólio por tipo de ativo, alocação atual vs. target
5. **Sonhos** — Lista de metas, sonho ativo, progresso de rebalanceamento
6. **Reserva de Emergência** — Progresso, valor atual vs. meta, quais ativos cobrem
7. **Projeções** — Gráfico de patrimônio futuro + simulador
8. **Configurações** — Regras de classificação, % orçamento, metas, API key IA

---

*Synkra AIOS — PRD v1.0.0 | Produto: FinOrg (Finanças Pessoais)*
