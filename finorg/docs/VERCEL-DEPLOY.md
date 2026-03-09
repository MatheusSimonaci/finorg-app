# 🚀 Deploy para Vercel: Configuração de Ambiente

## ⚠️ CRÍTICO: Variáveis de Ambiente para Auth Persistente

Para evitar auth loops e garantir que usuários façam login apenas UMA vez, configure estas variáveis no Vercel.

---

## 📝 Passo a Passo

### 1. Acesse o Dashboard do Vercel

1. Vá para [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto: **finorg-app**
3. Vá em **Settings** → **Environment Variables**

---

### 2. Configure as Variáveis de Produção

Adicione as seguintes variáveis (clique em **Add Another** para cada uma):

```env
# WorkOS AuthKit
WORKOS_API_KEY=<sua-api-key-aqui>
WORKOS_CLIENT_ID=<seu-client-id-aqui>
WORKOS_REDIRECT_URI=https://finorg-app.vercel.app/callback

# Cookie Password (GERAR NOVA para prod! Nunca usar a mesma de dev)
WORKOS_COOKIE_PASSWORD=<GERAR-NOVA-STRING-64-CHARS>

# ✅ CRÍTICO: Configurações de Cookie (previnem auth loop!)
WORKOS_COOKIE_MAX_AGE=604800
WORKOS_COOKIE_SAMESITE=lax

# Turso (se ainda não estiver configurado)
TURSO_DATABASE_URL=<sua-turso-url-aqui>
TURSO_AUTH_TOKEN=<seu-turso-token-aqui>

# OpenAI (se usar classificação AI)
OPENAI_API_KEY=<sua-openai-key-aqui>
```

---

### 3. Gerar WORKOS_COOKIE_PASSWORD Seguro (Produção)

⚠️ **NUNCA use o mesmo password de dev em produção!**

**Opção A: PowerShell (Windows)**
```powershell
# Gera string aleatória de 64 caracteres hexadecimais
-join ((0..63) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
```

**Opção B: Bash/Linux/Mac**
```bash
openssl rand -hex 32
```

**Opção C: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e use como `WORKOS_COOKIE_PASSWORD` no Vercel.

---

### 4. Configurar WorkOS Redirect URI

1. Acesse [https://dashboard.workos.com](https://dashboard.workos.com)
2. Selecione sua Organization
3. Vá em **Configuration** → **Redirects**
4. Adicione: `https://finorg-app.vercel.app/callback`
5. Salve

---

### 5. Re-Deploy

Após adicionar as variáveis:

1. No Vercel, vá em **Deployments**
2. Clique nos `...` do último deployment
3. Clique em **Redeploy**
4. ✅ Espere o deploy finalizar

---

## 🎯 Checklist de Validação

Após o deploy, teste:

- [ ] Acesse https://finorg-app.vercel.app
- [ ] Faça login (será redirecionado para WorkOS AuthKit)
- [ ] Após login, navegue entre páginas → **não deve pedir login novamente**
- [ ] Feche o navegador, abra novamente
- [ ] Acesse https://finorg-app.vercel.app → **deve continuar logado (por 7 dias)**

---

## 🐛 Troubleshooting

### Cookie não persiste

**Sintoma:** Pede login novamente ao navegar ou reabrir browser.

**Diagnóstico:**
1. Abra DevTools (F12)
2. Vá em **Application** → **Cookies**
3. Verifique se há um cookie começando com `wos-session`

**Se não houver cookie:**
- Verifique se `WORKOS_COOKIE_MAX_AGE` e `WORKOS_COOKIE_SAMESITE` estão configurados no Vercel
- Re-deploy a aplicação

**Se cookie tem Max-Age muito curto:**
- Verifique o valor de `WORKOS_COOKIE_MAX_AGE` (deve ser `604800`)
- Certifique-se de que o re-deploy usou as novas variáveis

### "Invalid redirect URI"

**Causa:** `WORKOS_REDIRECT_URI` no Vercel não corresponde ao configurado no WorkOS.

**Solução:**
1. No WorkOS Dashboard, adicione `https://finorg-app.vercel.app/callback`
2. No Vercel env vars, confirme: `WORKOS_REDIRECT_URI=https://finorg-app.vercel.app/callback`
3. Re-deploy

### Build falha

**Causa comum:** Prisma não consegue gerar client.

**Solução:**
1. Verifique se `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` estão no Vercel
2. Veja logs do build: Vercel → Deployments → clique no deployment → Function Logs

---

## 📚 Mais Informações

- [Guia de Autenticação Persistente](./AUTH-PERSISTENCE.md)
- [WorkOS Docs: Cookie Configuration](https://workos.com/docs/user-management/authkit/cookie-configuration)
- [Turso Docs: Connection String](https://docs.turso.tech/reference/turso-cli#turso-db-show)

---

**Última atualização:** 09/03/2026  
**Autor:** Quinn (@qa) + Gage (@devops)
