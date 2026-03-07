# Epic 7 — Snapshot Mobile Estático

> **PRD:** [docs/prd.md](../prd.md) | **Status:** Draft | **Prioridade:** P2 — QoL (Quality of Life)

## Objetivo

Gerar um snapshot estático (HTML) do dashboard que pode ser hospedado no Vercel e acessado de qualquer dispositivo móvel. O snapshot é somente-leitura e reflete o estado no momento do último export. Não requer atualização em tempo real — apenas quando o usuário gerar um novo export no computador.

---

## Requisitos Cobertos

- FR27, FR28, FR29
- NFR8

---

## Conceito: Local-First com Janela Mobile

```
Fluxo completo:
──────────────
Computador (local):           Mobile (Vercel):
  ┌──────────────────┐          ┌────────────────────┐
  │  Importa CSV     │          │  Abre site Vercel  │
  │  Classifica IA   │   →      │  Vê snapshot do    │
  │  Revisa dados    │  export  │  último export     │
  │  Clica "Export"  │          │  Read-only         │
  │  Deploy Vercel   │          │  Responsive        │
  └──────────────────┘          └────────────────────┘
```

O site Vercel não tem banco de dados — é apenas HTML/CSS/JS estático gerado a partir do SQLite local.

---

## Histórias de Usuário

### Story 7.1 — Gerador de Snapshot

**Como** usuário,  
**quero** exportar um snapshot estático do meu dashboard com um clique,  
**para que** eu possa visualizá-lo no celular sem precisar do computador ligado.

**Critérios de Aceite:**
- [ ] Botão "Exportar Snapshot" disponível no dashboard principal
- [ ] Script de export gera pasta `/snapshot/` com HTML + CSS + JSON embutido
- [ ] Snapshot inclui: KPIs do mês, orçamento por categoria, status da reserva, portfólio resumido, sonho ativo
- [ ] Data/hora do snapshot exibida em destaque no mobile ("Atualizado em DD/MM/AAAA HH:MM")
- [ ] Export completo em menos de 5 segundos

---

### Story 7.2 — Layout Mobile Responsivo do Snapshot

**Como** usuário,  
**quero** que o snapshot seja legível e navegável no celular,  
**para que** eu consulte minhas finanças de qualquer lugar com facilidade.

**Critérios de Aceite:**
- [ ] Layout responsivo otimizado para telas 375px+ (iPhone SE mínimo)
- [ ] Navegação por abas: Resumo | Gastos | Portfólio | Sonhos
- [ ] Gráficos adaptados para mobile (podem ser versões simplificadas dos gráficos do desktop)
- [ ] Sem interatividade de edição — apenas visualização
- [ ] Modo escuro automático (respeita preferência do sistema)
- [ ] Funciona offline após primeiro carregamento (PWA básico / cache estático)

---

### Story 7.3 — Deploy Automático para Vercel

**Como** usuário,  
**quero** que o snapshot seja automaticamente publicado no Vercel após o export,  
**para que** eu não precise fazer upload manual.

**Critérios de Aceite:**
- [ ] Configuração de Vercel token e project ID nas configurações da aplicação
- [ ] Script de deploy usa Vercel CLI ou API para fazer push do `/snapshot/`
- [ ] Feedback de status do deploy na interface: "Publicado em vercel.app/..."
- [ ] Fallback: se deploy falhar, usuário pode fazer o upload manual com instruções claras
- [ ] URL do snapshot salva nas configurações para acesso rápido (botão "Abrir no celular")

---

### Story 7.4 — Configuração de Privacidade do Snapshot

**Como** usuário,  
**quero** controlar quem pode acessar meu snapshot no Vercel,  
**para que** meus dados financeiros não fiquem expostos publicamente.

**Critérios de Aceite:**
- [ ] Opção de deploy público ou com senha simples (via Vercel protection)
- [ ] Documentação clara sobre as implicações de privacidade
- [ ] Aviso na tela de export: "Este snapshot conterá dados financeiros reais"
- [ ] Opção de export local (apenas pasta `/snapshot/`) sem deploy, para quem preferir

---

## Estrutura do Snapshot Gerado

```
/snapshot/
├── index.html          # Dashboard principal
├── gastos.html         # Detalhamento de gastos
├── portfolio.html      # Portfólio de investimentos
├── sonhos.html         # Sistema de sonhos
├── data.json           # Todos os dados embutidos (sanitizados)
├── styles.css          # Tailwind purged + customizações
└── _meta.json          # { generatedAt, version, exportedBy }
```

---

## Dependências

- Todos os épicos anteriores (gera snapshot de todas as seções)
- Conta Vercel (gratuita) para deploy online

## Desbloqueia

- Nada (este é o épico final da V1)
