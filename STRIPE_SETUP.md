# Pagamentos com Stripe

Site em produção: **https://casamentowa.vercel.app**

---

## Passar para PRODUÇÃO (cartão real)

### Passo 1 — Ativar conta Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Complete o cadastro da conta (dados pessoais/empresa, conta bancária para receber)
3. Aguarde a Stripe liberar pagamentos **live** (pode levar algumas horas ou dias)

### Passo 2 — Pegar chaves LIVE

1. No Dashboard, **desative** o modo "Test mode" (interruptor no canto superior direito)
2. Vá em **Developers → API keys**
3. Copie:
   - **Publishable key** → começa com `pk_live_...`
   - **Secret key** → começa com `sk_live_...` (clique em "Reveal")

### Passo 3 — Chave publicável no site

No `index.html`, linha `CONFIG.stripePublishableKey`:

```javascript
stripePublishableKey: "pk_live_SUA_CHAVE_AQUI",
```

Faça commit e push para o GitHub (a Vercel redeploya sozinha).

### Passo 4 — Chave secreta na Vercel

1. Acesse [vercel.com](https://vercel.com) → projeto **casamentowa**
2. **Settings → Environment Variables**
3. Adicione ou edite:

| Nome | Valor | Ambiente |
|------|--------|----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | **Production** (e Preview se quiser) |

4. **Deployments → Redeploy** no último deploy (para aplicar a variável)

> A chave secreta **nunca** vai no `index.html` nem no GitHub.

### Passo 5 — Testar

1. Abra https://casamentowa.vercel.app
2. Escolha um presente → Cartão
3. Use um **cartão real** (modo live não aceita `4242...`)
4. Confirme o pagamento no [Dashboard Stripe → Payments](https://dashboard.stripe.com/payments)

---

## Modo teste (desenvolvimento)

Chaves `pk_test_` / `sk_test_`:

- **Publishable** → `index.html`
- **Secret** → `.env.local` e Vercel (ambiente Preview/Development)

Cartão teste: `4242 4242 4242 4242`, validade futura, CVC qualquer.

Local:

```bash
cp .env.example .env.local
# edite STRIPE_SECRET_KEY=sk_test_...
npm install
npm start
```

Abra http://localhost:3001

---

## Fluxo no site

- **Pix** — QR Code manual (chave da Adylla), sem Stripe
- **Cartão** — checkout embutido da Stripe no assistente de presentes

---

## Stripe Connect (opcional)

Para receber direto na conta da **noiva** (conta Express `acct_...`):

1. `.env.local` e Vercel: `STRIPE_CONNECTED_ACCOUNT_ID=acct_...`
2. `index.html`: `stripeConnectedAccountId: "acct_..."`

Sem Connect, o dinheiro cai na **conta Stripe principal** (quem criou as chaves).

---

## Checklist produção

- [x] Conta Stripe verificada e live ativado
- [x] `pk_live_...` no `index.html` (deploy em casamentowa.vercel.app)
- [x] `sk_live_...` na Vercel (Production) — API retorna `cs_live_...`
- [ ] Pagamento teste com cartão real no site
- [ ] **Rotacionar `sk_live`** se a chave secreta foi compartilhada em chat/e-mail ([Dashboard → API keys → Roll key](https://dashboard.stripe.com/apikeys))

---

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| Cartão não carrega no site | Confira `STRIPE_SECRET_KEY` na Vercel + redeploy |
| Erro "STRIPE_SECRET_KEY não configurada" | Variável ausente ou só em Development, não Production |
| `4242...` não funciona | Normal em live — use cartão real |
| Pagamento ok mas site não confirma | Recarregue; URL deve ter `?stripe_session=...` ao voltar |
