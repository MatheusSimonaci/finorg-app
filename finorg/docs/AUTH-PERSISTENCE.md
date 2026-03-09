# Guia de Configuração: Autenticação Persistente (WorkOS)

## 🔐 Objetivo

Garantir que usuários **façam login apenas UMA vez** e permaneçam autenticados por **7 dias** (configurável), sem precisar re-logar ao trocar de página ou reabrir o navegador.

---

## 🔍 Problema: Auth Loop (Login Múltiplo)

**Sintomas:**
- Usuário faz login e é pedido para logar novamente ao acessar outra página
- Login expira muito rápido (menos de 1 hora)
- Cookie não persiste entre navegações

**Causas Comuns:**
1. ❌ **`WORKOS_COOKIE_MAX_AGE` não configurado** → Cookie expira rapidamente (default: 1h ou menos)
2. ❌ **`WORKOS_COOKIE_SAMESITE` incorreto** → Browser bloqueia cookies
3. ❌ **`WORKOS_COOKIE_DOMAIN` inconsistente** → Cookie não funciona entre páginas

---

## ✅ Solução: Configurar Variáveis de Ambiente

### 1. **Desenvolvimento Local (.env)**

Adicione no seu `.env`:

```env
# WorkOS AuthKit
WORKOS_API_KEY="sk_test_..."
WORKOS_CLIENT_ID="client_..."
WORKOS_REDIRECT_URI="http://localhost:3000/callback"
NEXT_PUBLIC_WORKOS_REDIRECT_URI="http://localhost:3000/callback"
WORKOS_COOKIE_PASSWORD="<string-aleatória-64-chars>"

# ✅ CRÍTICO: Configurações de Cookie
WORKOS_COOKIE_MAX_AGE=604800    # 7 dias em segundos
WORKOS_COOKIE_SAMESITE=lax      # Permite navegação normal
```

**Explicação:**

| Variável | Valor | Efeito |
|----------|-------|--------|
| `WORKOS_COOKIE_MAX_AGE` | `604800` (7 dias) | Cookie persiste por 7 dias após login |
| `WORKOS_COOKIE_SAMESITE` | `lax` | Permite cookies em navegação GET, bloqueia CSRF |

### 2. **Produção (Vercel)**

No dashboard do Vercel (Settings → Environment Variables), adicione:

```env
WORKOS_API_KEY=sk_prod_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=https://finorg-app.vercel.app/callback
WORKOS_COOKIE_PASSWORD=<string-aletatória-64-chars-DIFERENTE-de-dev>
WORKOS_COOKIE_MAX_AGE=604800
WORKOS_COOKIE_SAMESITE=lax
```

⚠️ **IMPORTANTE:** Use um `WORKOS_COOKIE_PASSWORD` **diferente** entre dev e prod.

---

## 🕐 Duração de Sessão Recomendada

| Cenário | MAX_AGE (segundos) | Duração |
|---------|-------------------|---------|
| **App financeiro** | `604800` | 7 dias (recomendado) |
| **App corporativo** | `86400` | 1 dia |
| **App público** | `2592000` | 30 dias |
| **Máxima segurança** | `3600` | 1 hora |

**Nossa escolha:** `604800` (7 dias) — balanceado entre segurança e UX.

---

## 🔒 Segurança dos Cookies

### Atributos do Cookie WorkOS

O AuthKit automaticamente configura:

| Atributo | Valor | Efeito |
|----------|-------|--------|
| `HttpOnly` | `true` | JavaScript não pode acessar (previne XSS) |
| `Secure` | `true` (prod) | Apenas HTTPS (automático no Vercel) |
| `SameSite` | `lax` | Bloqueia ataques CSRF, permite navegação |
| `Path` | `/` | Cookie válido em todo o domínio |
| `Max-Age` | `604800` | Expira em 7 dias |

### Por que é seguro?

1. **HttpOnly:** Previne roubo via XSS (JavaScript malicioso não acessa)
2. **Secure (prod):** HTTPS obrigatório (Vercel força isso)
3. **SameSite=lax:** Bloqueia requisições cross-site POST (CSRF), permite GET
4. **Cookie Password:** WorkOS usa `iron-session` para criptografar o cookie

---

## 🧪 Como Testar

### 1. **Dev Local**

```bash
# 1. Atualize .env com as novas variáveis
# 2. Reinicie o servidor
npm run dev

# 3. Abra http://localhost:3000
# 4. Faça login
# 5. Navegue entre páginas → não deve pedir login novamente
# 6. Feche o navegador, abra novamente → sessão deve persistir (7 dias)
```

### 2. **Produção (Vercel)**

```bash
# 1. Configure env vars no Vercel
# 2. Re-deploy a aplicação
# 3. Acesse https://finorg-app.vercel.app
# 4. Login
# 5. Teste navegação, fechar navegador, etc.
```

---

## 🐛 Troubleshooting

### Cookie não persiste ao fechar navegador

**Causa:** Browser está em modo "Incógnito" ou configurado para limpar cookies ao fechar.

**Solução:** Use navegador normal, não Incógnito. Ou aumente `WORKOS_COOKIE_MAX_AGE`.

### Cookie expira muito rápido

**Causa:** `WORKOS_COOKIE_MAX_AGE` não está sendo lido.

**Diagnóstico:**
```bash
# Verifique se a variável está no .env
cat .env | grep WORKOS_COOKIE_MAX_AGE

# Reinicie o servidor Next.js completamente
npm run dev
```

### Auth loop em produção, mas não em dev

**Causa:** Variáveis de ambiente não configuradas no Vercel.

**Solução:**
1. Vá em Vercel → Settings → Environment Variables
2. Adicione `WORKOS_COOKIE_MAX_AGE=604800` e `WORKOS_COOKIE_SAMESITE=lax`
3. Re-deploy

### "SameSite=None requires Secure"

**Causa:** Tentando usar `SameSite=none` sem HTTPS.

**Solução:** Use `lax` em vez de `none`. Só use `none` se realmente precisar de cookies cross-site (raro).

---

## 📚 Referências

- [WorkOS AuthKit Docs](https://workos.com/docs/user-management/authkit)
- [WorkOS Cookie Configuration](https://workos.com/docs/user-management/authkit/cookie-configuration)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## 🎯 Checklist de Deploy

- [ ] `.env` tem `WORKOS_COOKIE_MAX_AGE=604800`
- [ ] `.env` tem `WORKOS_COOKIE_SAMESITE=lax`
- [ ] Vercel env vars configuradas (prod)
- [ ] Aplicação testada em dev (navegação + fechar browser)
- [ ] Aplicação testada em prod (navegação + fechar browser)
- [ ] Cookie persiste por pelo menos 1 dia em teste real

---

**Última atualização:** 09/03/2026  
**Autor:** Quinn (@qa) coordenando com Dex (@dev)
