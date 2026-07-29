# Stripe Connect — pagamentos na conta da noiva (Modelo 2)

Você administra a **plataforma** (sua conta Stripe). Os pagamentos por cartão caem na **conta conectada** da noiva (Wdmar & Adylla).

```
Convidado paga cartão → Stripe → Conta conectada da noiva → Banco dela
Pix → continua indo direto para ester.adyla@outlook.com (fora da Stripe)
```

---

## Parte 1 — Ativar Connect na sua conta

1. Entre em [dashboard.stripe.com](https://dashboard.stripe.com) com **sua** conta
2. Vá em **Connect** → **Começar** / **Get started**
3. Escolha **Plataforma ou marketplace**
4. Complete os dados da plataforma (pode descrever: *"Sites de lista de presentes para eventos"*)

---

## Parte 2 — Cadastrar a noiva (conta conectada Express)

### Opção A — Pelo terminal (recomendado)

Com o servidor rodando (`npm start`), execute:

```bash
curl -X POST http://localhost:3001/api/connect-onboarding-link \
  -H "Content-Type: application/json" \
  -d '{}'
```

Se definiu `CONNECT_ADMIN_SECRET` no `.env.local`:

```bash
curl -X POST http://localhost:3001/api/connect-onboarding-link \
  -H "Content-Type: application/json" \
  -H "X-Connect-Admin-Secret: sua_senha" \
  -d '{}'
```

A resposta traz:

```json
{
  "url": "https://connect.stripe.com/...",
  "accountId": "acct_xxxxxxxx"
}
```

1. **Envie o `url` para a noiva** — ela preenche CPF, banco etc. no formulário da Stripe
2. **Guarde o `accountId`** (`acct_...`)

### Opção B — Pelo painel Stripe

1. **Connect** → **Contas conectadas** → **Criar conta**
2. Tipo: **Express**
3. País: **Brasil**
4. Envie o link de onboarding para a noiva
5. Copie o ID da conta (`acct_...`)

---

## Parte 3 — Configurar o site

### Local (`.env.local`)

```env
STRIPE_SECRET_KEY=sk_test_SUA_CONTA_PLATAFORMA
STRIPE_CONNECTED_ACCOUNT_ID=acct_ID_DA_NOIVA
```

### No `index.html` (CONFIG)

```javascript
stripePublishableKey: "pk_test_SUA_CONTA_PLATAFORMA",
stripeConnectedAccountId: "acct_ID_DA_NOIVA",
```

> As chaves `pk_` / `sk_` são da **sua** conta plataforma.  
> O `acct_` é da **conta conectada** da noiva.

### Na Vercel (produção)

| Variável | Valor |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` (sua plataforma) |
| `STRIPE_CONNECTED_ACCOUNT_ID` | `acct_...` (noiva) |

Redeploy após salvar.

---

## Parte 4 — Testar

1. `npm start` → http://localhost:3001
2. Escolha um presente → **Cartão**
3. Cartão teste: `4242 4242 4242 4242`

No painel Stripe:

- **Connect → Contas conectadas** → conta da noiva → você vê o pagamento lá
- O valor cai no banco **dela**, não no seu

---

## Valor livre (“Prefere escolher o valor?”)

Funciona igual: o convidado digita R$ 150 → a cobrança de R$ 150,00 é criada na **conta conectada** da noiva.

---

## Produção (dinheiro real)

1. Conta conectada da noiva **aprovada** (onboarding completo)
2. Sua plataforma ativada para pagamentos live
3. Trocar `pk_test_` / `sk_test_` por `pk_live_` / `sk_live_`
4. Redeploy na Vercel

---

## Resumo das contas

| O quê | De quem |
|-------|---------|
| `STRIPE_SECRET_KEY` / `stripePublishableKey` | **Sua** conta (plataforma) |
| `STRIPE_CONNECTED_ACCOUNT_ID` / `stripeConnectedAccountId` | **Noiva** (conta Express) |
| Pix | **Adylla** (`ester.adyla@outlook.com`) |
| Dinheiro do cartão | **Banco da noiva** (via Connect) |

---

## Problemas comuns

**"STRIPE_CONNECTED_ACCOUNT_ID não configurada"**  
→ Falta o `acct_...` no `.env.local` e no `index.html`.

**"Pagamento por cartão ainda não configurado"**  
→ `stripeConnectedAccountId` ainda está `acct_COLOQUE_AQUI`.

**Noiva não consegue receber**  
→ Onboarding incompleto. Gere novo link:

```bash
curl -X POST http://localhost:3001/api/connect-onboarding-link \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acct_ID_EXISTENTE"}'
```

**Erro de capacidade / país**  
→ Conta Express deve ser **BR** com `card_payments` ativo.

---

Guia geral da Stripe no site: `STRIPE_SETUP.md`
