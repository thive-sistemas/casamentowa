# Configuração da Stripe — Site Wdmar & Adylla

O site usa **Stripe Connect** — pagamentos por cartão caem na conta conectada da noiva.  
Guia completo: **`STRIPE_CONNECT.md`**

As chaves `pk_` / `sk_` são da **sua conta plataforma**. A conta da noiva é o `acct_...`.

---

## 1. Chaves da Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá em **Developers → API keys**
3. Copie:
   - **Publishable key** (`pk_test_...` ou `pk_live_...`) → já está no `index.html` em `CONFIG.stripePublishableKey`
   - **Secret key** (`sk_test_...` ou `sk_live_...`) → vai na Vercel / `.env.local` (nunca no Git)

> Para produção, troque as chaves `test` por `live` quando o site for ao ar de verdade.

---

## 2. Rodar localmente (com cartão funcionando)

O servidor Python (`python3 -m http.server`) **não** executa as funções `/api`. Use o Vercel CLI:

```bash
cd /Users/alycia_luna/Documents/casamentowa
npm install
cp .env.example .env.local
```

Edite `.env.local` e coloque sua chave secreta:

```
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_AQUI
```

Inicie o servidor de desenvolvimento:

```bash
npm start
```

Abra **http://localhost:3001** — Pix e cartão funcionam.

> Alternativa com Vercel CLI: `npm run serve` (requer login na Vercel).

### Cartão de teste

No modo teste da Stripe, use:

| Campo | Valor |
|-------|-------|
| Número | `4242 4242 4242 4242` |
| Validade | qualquer data futura |
| CVC | qualquer 3 dígitos |

---

## 3. Deploy na Vercel (produção)

1. Faça push do repositório para o GitHub (`thive-sistemas/casamentowa`)
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório
3. A Vercel detecta o site estático + funções em `/api` automaticamente
4. Em **Settings → Environment Variables**, adicione:

   | Nome | Valor |
   |------|-------|
   | `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` |

5. Faça **Redeploy** após salvar a variável

O site ficará em algo como `https://casamentowa.vercel.app` e as rotas `/api/create-checkout-session` e `/api/verify-checkout-session` passam a funcionar.

---

## 4. Como funciona o fluxo

1. Convidado escolhe um presente → informa o nome → escolhe **Cartão**
2. O site chama `POST /api/create-checkout-session` com valor, nome do presente e presenteador
3. A Stripe abre o checkout incorporado dentro do modal
4. Após pagamento, a Stripe redireciona de volta com `?stripe_session=...`
5. O site chama `GET /api/verify-checkout-session` para confirmar o pagamento
6. Se aprovado, marca o presente como dado e avisa os noivos via planilha Google

---

## 5. Arquivos relevantes

| Arquivo | Função |
|---------|--------|
| `index.html` | Frontend + chave pública Stripe |
| `api/create-checkout-session.js` | Cria sessão de pagamento |
| `api/verify-checkout-session.js` | Confirma pagamento |
| `.env.local` | Chave secreta (local, não vai pro Git) |
| `vercel.json` | Configuração do deploy |

---

## Problemas comuns

**"Pagamento por cartão ainda não configurado"**  
→ A chave pública no `index.html` está vazia ou com `COLOQUE_AQUI`.

**"STRIPE_SECRET_KEY não configurada no servidor"**  
→ Falta a variável no `.env.local` (local) ou na Vercel (produção).

**"Não foi possível carregar o pagamento por cartão"**  
→ Site aberto via `python -m http.server` em vez de `npm start`, ou chave secreta inválida.

**Pix funciona mas cartão não**  
→ Normal se estiver usando servidor estático. Use `npm start` ou deploy na Vercel.
