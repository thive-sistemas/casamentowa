# Pagamentos com Stripe

## 1. Chaves

No [Dashboard Stripe](https://dashboard.stripe.com/test/apikeys):

- **Chave publicável** (`pk_test_...`) → `index.html` em `CONFIG.stripePublishableKey`
- **Chave secreta** (`sk_test_...`) → `.env.local` e Vercel como `STRIPE_SECRET_KEY`

## 2. Local

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_sua_chave

npm install
npm start
```

Abra http://localhost:3001

## 3. Vercel

Variável de ambiente: `STRIPE_SECRET_KEY`

## 4. Fluxo no site

- **Pix** — QR Code manual para a chave Pix da Adylla (convidado confirma após pagar)
- **Cartão** — checkout embutido da Stripe no passo final do assistente

## 5. Modo teste

Cartão: `4242 4242 4242 4242`, validade futura, CVC qualquer.

## 6. Stripe Connect (opcional)

Para cair direto na conta da noiva, configure `STRIPE_CONNECTED_ACCOUNT_ID=acct_...` no `.env.local` e a Vercel, e `stripeConnectedAccountId` no `index.html`.
