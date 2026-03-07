# Synkra AIOS — GitHub Copilot Workspace Instructions

Synkra AIOS is a meta-framework (v4.31.1) that orchestrates specialized AI agents for full-stack development workflows. All work is story-driven and governed by the **CLI-First** principle.

## Core Principles

| Principle | Rule |
|-----------|------|
| **CLI First** | Every feature must work via CLI before any UI. Priority: CLI → Observability → UI |
| **Story-Driven** | All development starts from a story in `docs/stories/`. No work outside a story. |
| **Agent Authority** | Each agent has exclusive operations. Never cross boundaries (see below). |
| **No Invention** | Every implementation traces to FR-*, NFR-*, or CON-* in the PRD. No invented features. |

## Agent System

### Activating Agents
Agent `.agent.md` files live in `.github/agents/`. Select an agent from the **Chat** mode selector in VS Code (requires VS Code 1.101+ and `chat.agent.enabled: true`).

| Agent | Persona | Scope |
|-------|---------|-------|
| `dev` | Dex | Code implementation, debugging, refactoring |
| `qa` | Quinn | Tests, quality gates, reviews |
| `architect` | Aria | Architecture, tech selection, API design |
| `pm` | Morgan | PRD creation, epics, roadmap |
| `po` | Pax | Backlog, story refinement, acceptance criteria |
| `sm` | River | Story creation, sprint planning |
| `analyst` | Alex | Research, competitive analysis, brainstorming |
| `devops` | Gage | CI/CD, git push (EXCLUSIVE), PRs (EXCLUSIVE) |
| `data-engineer` | Dara | Schema, migrations, RLS policies, query optimization |
| `ux-design-expert` | Uma | UX research, wireframes, design systems |
| `squad-creator` | — | Create and publish AIOS squads |
| `aios-master` | — | Framework governance, cross-agent orchestration |

### Agent Authority (Critical)
- **Only `devops`** can `git push` or create/merge PRs
- **Only `sm`/`po`** create stories
- **Only `architect`** makes technology selection decisions
- **Only `qa`** issues quality verdicts
- Agent commands use `*` prefix: `*help`, `*develop`, `*exit`

## Build & Test Commands

```bash
# Run from .aios-core/
npm run lint          # ESLint check
npm run typecheck     # TypeScript type check (tsc --noEmit)
npm test              # Unit + integration tests
npm run test:unit     # Jest unit tests only
npm run test:integration  # Jest integration tests only
```

```bash
# Framework CLI
aios-core             # Main CLI entrypoint (bin/aios-core.js)
npm run sync:ide      # Sync IDE configurations
npm run validate:structure  # Validate framework structure
npm run validate:agents     # Validate agent definitions
```

## Framework Structure

```
.aios-core/                      # Framework core (see boundary rules below)
├── constitution.md              # Non-negotiable principles
├── core-config.yaml             # Project configuration (IDEs, paths, etc.)
├── development/
│   ├── agents/                  # Agent persona definitions (.md)
│   ├── tasks/                   # 150+ executable task definitions
│   ├── templates/               # Document and code templates
│   ├── checklists/              # Validation checklists
│   └── workflows/               # Multi-step workflow definitions
├── core/                        # Runtime modules (config, elicitation, session)
└── infrastructure/              # CI/CD, GitHub Actions templates

.github/
├── agents/                      # GitHub Copilot agent files (*.agent.md)
├── copilot-instructions.md      # This file

docs/
├── stories/                     # Development stories (source of truth for @dev)
├── prd/                         # Product requirement documents (sharded)
└── architecture/                # Architecture decisions and specs
```

## Framework Boundary (DO NOT MODIFY)

| Layer | Paths | Rule |
|-------|-------|------|
| **L1 Core** | `.aios-core/constitution.md`, `.aios-core/core/` | NEVER modify |
| **L2 Templates** | `.aios-core/development/tasks/`, `.aios-core/development/templates/` | NEVER modify (extend only) |
| **L3 Config** | `.aios-core/data/`, `core-config.yaml` | Modify with care |
| **L4 Runtime** | `docs/stories/`, `.github/agents/`, project source | Always safe to modify |

## Story-Driven Workflow

```
@sm *create-story → @po *validate → @dev *develop → @qa *qa-gate → @devops *push
```

1. Stories live in `docs/stories/{epicNum}.{storyNum}.story.md`
2. Mark tasks complete: `[ ]` → `[x]` as you go
3. Maintain the **File List** section in the story
4. Run `npm run lint && npm run typecheck && npm test` before marking Done

## Key Conventions

- **Absolute imports** — prefer absolute over relative paths in source files
- **Conventional commits** — `feat:`, `fix:`, `docs:`, `chore:` with story ID: `feat: add X [Story 2.1]`
- **Tasks reference** — agent tasks map to `.aios-core/development/tasks/{task-name}.md`
- **MCP tools** — always prefer native VS Code tools over MCP/Docker for local file ops
- **Framework docs** — `docs/framework/coding-standards.md`, `docs/framework/tech-stack.md`, `docs/framework/source-tree.md` are always loaded for `@dev`

## Pitfalls to Avoid

- Do **not** create `.github/chatmodes/` — Copilot agents use `.github/agents/*.agent.md`
- Do **not** modify L1/L2 framework files — ask `@architect` or `@aios-master` first
- Do **not** push directly — always delegate to `@devops`
- Do **not** invent requirements — trace everything to the PRD (`docs/prd/`)

---
*Synkra AIOS GitHub Copilot Configuration v4.1.0*
