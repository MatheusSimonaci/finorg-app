# Guia de Testes — finorg

> Como testar a aplicação do zero, cobrindo todos os epics implementados (1–3).

---

## Pré-requisitos

```bash
cd finorg
npm install
npx prisma migrate dev   # aplica todas as migrations
npm run dev              # inicia em http://localhost:3000
```

---

## EPIC 1 — Importação & Classificação

### 1.1 Importar extrato CSV

1. Acesse **localhost:3000/transactions/import**
2. Clique em **"Selecionar arquivo"** e escolha um dos arquivos de exemplo:

   | Banco | Formato | Exemplo de cabeçalho |
   |-------|---------|----------------------|
   | Nubank | `Date,Title,Amount` | `2024-01-15,Mercado ABC,-45.90` |
   | XP Investimentos | `Data;Descrição;Valor` | `15/01/2024;Aporte CDB;-1000,00` |
   | Bitybank | `data,descricao,valor` | `2024-01-15,Bitcoin BTC,-500.00` |

3. Clique em **"Importar"** — aguarde o processamento
4. **Esperado:** Toast de sucesso + redirect para `/transactions/review/{batchId}`

### 1.2 Revisão e Aprovação

1. Na tela de revisão, veja as transações classificadas pela IA
2. Para cada transação, verifique:
   - Categoria sugerida (`alimentação`, `transporte`, `investimento`, etc.)
   - Natureza (`pessoal` | `empresarial` | `misto`)
3. Para uma transação errada, clique no dropdown e selecione a categoria correta
4. Clique em **"Salvar correção"**
5. Clique em **"Aprovar todas"** para confirmar o lote
6. **Esperado:** Status muda para "Aprovado" e transações aparecem no dashboard

### 1.3 Regras de Aprendizado

1. Acesse **localhost:3000/settings/rules**
2. Após corrigir classificações em 1.2, as regras aprendidas aparecem aqui
3. Para criar manualmente: clique **"Nova regra"**, preencha padrão + categoria
4. **Verificar:** Reimportar um arquivo com a mesma descrição → deve ser classificado automaticamente

---

## EPIC 2 — Dashboard & Orçamento

### 2.1 Dashboard Central

1. Acesse **localhost:3000** (home)
2. Com transações aprovadas, o dashboard exibe:
   - **KPIs** no topo: receita, gastos, saldo do mês
   - **Donut de gastos** por categoria
   - **Preview de fluxo** dos próximos dias
   - **Alertas ativos** (se limites ultrapassados)
3. Use as setas **← →** de mês para navegar entre períodos
4. **Verificar:** Trocar para um mês sem dados → donut mostra "Sem dados"

### 2.2 Configurar Orçamento

1. Acesse **localhost:3000/budget/settings**
2. Configure percentuais para cada categoria (ex: `alimentação = 15%`, `lazer = 10%`)
   - Soma deve ser ≤ 100%
3. Clique **"Salvar"**
4. **Verificar:** Volte ao dashboard → barra de progresso das categorias aparece

### 2.3 Painel de Orçamento

1. Acesse **localhost:3000/budget**
2. Veja orçamento real vs. planejado por categoria
3. Categorias acima de 80% do limite: badge ⚠️
4. Categorias acima de 100%: badge 🔴
5. **Historico:** Gráfico mensal dos últimos 6 meses mostra evolução

### 2.4 Alertas

1. Ultrapasse 80% de uma categoria no mês atual
2. O dashboard exibe um alerta para essa categoria
3. Clique em **"Soneca"** no alerta
4. **Verificar:** Alerta desaparece por 7 dias, reaparece no mês seguinte

### 2.5 Despesas Recorrentes e Sazonais

1. Acesse **localhost:3000/budget/recurring**
2. Clique **"Nova despesa recorrente"**:
   - **Parcelamento:** Nome="TV Samsung", Valor=1500, Parcelas=12
   - **Sazonal:** Nome="IPTU", Valor=800, Mês=3 (março)
3. **Verificar:** No painel do mês correto, a despesa aparece no fluxo

---

## EPIC 3 — Investimentos & Portfólio

### 3.1 Cadastrar Ativos

1. Acesse **localhost:3000/investments**
2. Clique **"Novo ativo"**
3. Preencha o formulário:
   ```
   Nome: Tesouro IPCA+ 2029
   Tipo: Tesouro Direto
   Subtipo: IPCA+
   Instituição: XP
   Valor atual: 5000
   Finalidade: Pessoal
   ```
4. Clique **"Salvar"**
5. **Verificar:** Ativo aparece na lista com % do portfólio calculado

6. Repita para 2–3 ativos de tipos diferentes (ex: CDB, FII, Ações)
7. **Verificar:**
   - KPIs no topo atualizam (portfólio total, qtd de ativos)
   - Donut de alocação mostra fatias por tipo
   - Tabela "Atual vs. Target" aparece com deltas

### 3.2 Visualizar Alocação

Com pelo menos 3 ativos cadastrados:

1. **Donut:** Cada tipo com cor distinta, hover mostra valor e %
2. **Tabela Atual vs. Target:**
   - Coluna "Target" mostra o percentual configurado (default: perfil moderado)
   - Coluna "Delta": verde se ≤5pp, amarelo se ≤15pp, vermelho se >15pp
3. **Badge de estado:** Deve aparecer "EQUILIBRADA" por padrão

### 3.3 Configurar Targets de Alocação

1. Acesse **localhost:3000/investments/targets**
2. Na aba **"Normal"**, ajuste os sliders:
   - Tesouro: 25%
   - CDB: 20%
   - FII: 20%
   - Ações: 25%
   - Outros: ajuste para fechar em 100%
3. Barra de "Total alocado" deve mostrar 100% em verde
4. Clique **"Salvar"**
5. **Verificar:** Volte ao portfólio → tabela Atual vs. Target usa os novos valores

6. Teste as abas **"Sonho Ativo"** e **"Rebalanceando"** — cada uma salva independentemente

### 3.4 Atualizar Valores dos Ativos

1. Na tela `/investments`, clique **"Atualizar valores"**
2. O modal lista todos os ativos com campo de valor editável
3. Mude o valor de um ativo (ex: de R$ 5.000 para R$ 5.200)
4. Observe o diff mostrado: "+R$ 200,00 (+4,0%)"
5. Clique **"Salvar atualizações"**
6. **Verificar:**
   - Portfólio total atualiza
   - Data de "Atualizado" muda para hoje
   - Badge ⚠️ "Xd atrás" desaparece para os ativos atualizados

> **Snapshot:** Cada atualização cria um snapshot mensal. Para testar o gráfico de patrimônio, atualize valores em meses diferentes (simule mudando datas no banco se necessário).

### 3.5 Relatório de Aportes

1. Acesse **localhost:3000/investments/contributions**
2. Sem histórico: gráfico vazio + estado vazio
3. Após realizar atualizações de valor em 3.4, deltas positivos aparecem como "aportes"
4. **Verificar:**
   - KPIs: total aportado este mês, meta mensal, progresso
   - Gráfico de barras: empilhado por tipo de ativo
   - Tabela por ativo: "Este mês" + "Total histórico"

---

## Roteiro de Teste Completo (End-to-End)

Para testar toda a aplicação de ponta a ponta:

```
1. Importar CSV do Nubank com ~20 transações
2. Revisar → aprovar todas
3. Ir ao dashboard → verificar KPIs
4. Configurar orçamento: alimentação=20%, lazer=10%, transporte=10%
5. Verificar alertas se alguma categoria ultrapassou
6. Adicionar 4 ativos: 1 Tesouro, 1 CDB, 1 FII, 1 Ações
7. Configurar targets no modo Normal
8. Atualizar valores dos 4 ativos
9. Ver relatório de aportes
10. Verificar estado do portfólio (EQUILIBRADA / REBALANCEANDO)
```

---

## Endpoints de API para Teste Direto

Você pode testar as APIs diretamente com curl ou Postman/Insomnia:

```bash
# Listar ativos
GET http://localhost:3000/api/assets

# Criar ativo
POST http://localhost:3000/api/assets
{ "name": "CDB Nubank", "type": "cdb", "institution": "Nubank", "currentValue": 2000, "purpose": "personal" }

# Atualizar valor + criar snapshot
PATCH http://localhost:3000/api/assets/{id}/value
{ "value": 2150 }

# Ver targets de alocação
GET http://localhost:3000/api/allocation-targets?mode=normal

# Salvar targets
PUT http://localhost:3000/api/allocation-targets?mode=normal
{ "tesouro": 25, "cdb": 20, "lci_lca": 10, "fii": 15, "acoes": 20, "cripto": 5, "previdencia": 5, "fundo": 0, "conta_remunerada": 0 }

# Resumo do portfólio (KPIs + estado + alocação)
GET http://localhost:3000/api/investments/summary

# Relatório de aportes
GET http://localhost:3000/api/investments/contributions

# Histórico de patrimônio
GET http://localhost:3000/api/investments/net-worth

# Dashboard do mês atual
GET http://localhost:3000/api/dashboard?month=2026-03

# Alertas
GET http://localhost:3000/api/alerts?month=2026-03
```

---

## Dados de Exemplo para CSV

### Nubank (salve como `nubank-jan.csv`):
```csv
Date,Title,Amount
2024-01-05,Supermercado Pão de Açúcar,-320.50
2024-01-08,Uber,-25.90
2024-01-10,Netflix,-55.90
2024-01-12,Salário Empresa XYZ,8500.00
2024-01-15,Farmácia Drogasil,-89.00
2024-01-18,Restaurante Outback,-125.00
2024-01-20,Academia Smart Fit,-99.90
2024-01-22,Conta de Luz,-180.00
2024-01-25,Posto Ipiranga,-200.00
2024-01-28,Amazon Prime,-21.90
```

### XP Investimentos (salve como `xp-jan.csv`):
```csv
Data;Descrição;Valor
15/01/2024;Aporte CDB Banco Inter 104% CDI;-2000,00
20/01/2024;Resgate Tesouro Selic 2026;1500,00
25/01/2024;Aporte Fundo Multimercado XP;-1000,00
```

---

## Notas de Comportamento Esperado

| Situação | Comportamento |
|----------|--------------|
| Portfolio vazio | EmptyState com botão "Adicionar primeiro ativo" |
| Categoria ultrapassa 100% do orçamento | Badge vermelho + alerta no dashboard |
| Ativo não atualizado há >30 dias | Badge ⚠️ "Xd atrás" + contador no botão |
| Targets não somam 100% | Barra vermelha + mensagem de erro na tela de targets |
| Nenhum aporte no mês | Contributions page mostra EmptyState |
| Portfolio equilibrado vs. targets | Badge "EQUILIBRADA" (verde) |
| Qualquer tipo >10pp acima do target | Badge "REBALANCEANDO" (amarelo) |
