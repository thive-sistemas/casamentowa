# Como ativar o pagamento por cartão (Stripe) na Vercel

O site tem duas abas no presente: **Pix** (direto, sem taxa) e **Cartão** (processado
pela Stripe, com taxa por transação). Como isso precisa de duas funções de servidor,
a hospedagem é feita na **Vercel**, que roda o site *e* as funções juntos, de graça.

---

## Passo 1 — Crie sua conta Stripe
1. Acesse [dashboard.stripe.com/register](https://dashboard.stripe.com/register) e crie uma conta.
2. No Brasil, você pode abrir como **pessoa física**, só com seu CPF — não precisa de CNPJ.
   A Stripe vai pedir um documento com foto e uma verificação rápida de identidade (selfie).
3. **Importante sobre taxas:** a Stripe no Brasil funciona principalmente com **cartão de
   crédito/débito**, não com Pix — existe uma taxa por transação aprovada (consulte o valor
   atual em [stripe.com/br/pricing](https://stripe.com/br/pricing), pois pode mudar). O Pix
   direto que o site já tem continua sem nenhuma taxa — pense no cartão como uma opção
   *extra* para quem prefere pagar assim.
4. Enquanto você configura, use o **modo de teste** (alternador "Test mode" no Dashboard).
   Nele nada é cobrado de verdade.

## Passo 2 — Pegue suas chaves de API
1. No Dashboard da Stripe, vá em **Desenvolvedores → Chaves de API**.
2. Copie a **Chave publicável** (começa com `pk_test_...` no modo teste). Essa é segura
   para ficar visível no site.
3. Copie também a **Chave secreta** (`sk_test_...`). **Essa nunca vai no código do site**
   — só será colada como variável de ambiente na Vercel (Passo 5).

## Passo 3 — Suba o projeto para o GitHub
Se você já subiu os arquivos pro GitHub (repositório `casamentowa`), pule para o Passo 4.
Caso ainda não tenha feito:
1. Crie uma conta gratuita em [github.com](https://github.com), caso ainda não tenha.
2. Crie um repositório novo (ex: `casamentowa`).
3. Suba todos os arquivos do projeto: `index.html`, `package.json`, `SETUP.md`,
   `STRIPE_SETUP.md` e a pasta `api/` inteira (com os dois arquivos `.js` dentro).

## Passo 4 — Importe o projeto na Vercel
1. Crie uma conta gratuita em [vercel.com](https://vercel.com) — dá pra entrar direto
   com sua conta do GitHub.
2. Clique em **Add New → Project**.
3. Escolha o repositório `casamentowa` (a Vercel vai pedir permissão para acessar seus
   repositórios do GitHub — autorize).
4. Nas configurações de build, a Vercel detecta sozinha que é um site simples (sem
   framework) com funções na pasta `api/` — não precisa mudar nada, é só clicar em
   **Deploy**.
5. Em alguns segundos o site já estará no ar, com um link tipo
   `https://casamentowa.vercel.app`.

## Passo 5 — Configure a chave secreta na Vercel
1. No painel do projeto na Vercel, vá em **Settings → Environment Variables**.
2. Adicione:
   - **Key:** `STRIPE_SECRET_KEY`
   - **Value:** cole a chave secreta que você copiou no Passo 2 (`sk_test_...`)
   - Marque para aplicar em **Production**, **Preview** e **Development**.
3. Clique em **Save**.
4. Vá em **Deployments**, abra os "..." do último deploy e clique em **Redeploy** para
   a variável entrar em vigor.

## Passo 6 — Cole a chave publicável no site
1. Abra o `index.html` (direto no GitHub, no botão de lápis para editar, ou no seu
   computador) e procure por:
   ```javascript
   stripePublishableKey: "pk_test_COLOQUE_AQUI_SUA_CHAVE_PUBLICAVEL",
   ```
2. Troque pela sua chave publicável real (`pk_test_...`) e salve/faça commit.
3. A Vercel detecta a mudança no GitHub e publica a nova versão sozinha (em ~1 minuto).

## Passo 7 — Teste
1. Com o site publicado, abra um presente e clique na aba **Cartão**.
2. Use um [cartão de teste da Stripe](https://stripe.com/docs/testing), por exemplo:
   `4242 4242 4242 4242`, qualquer validade futura, qualquer CVC.
3. Depois de "pagar", o site deve voltar mostrando a confirmação e marcar o presente
   como presenteado — e a linha correspondente deve aparecer na aba **Presentes** da sua
   planilha (veja o `SETUP.md`), com "Cartão (Stripe)" na coluna Origem.

## Passo 8 — Ativar de verdade (modo real)
Quando estiver tudo testado, ative a conta Stripe para o **modo ativado (live)** (a
Stripe vai pedir dados bancários para poder repassar o dinheiro), troque as duas chaves
(`pk_live_...` e `sk_live_...` no lugar das de teste, tanto no `index.html` quanto na
variável de ambiente da Vercel) e pronto — os pagamentos por cartão passam a ser reais.

---

### Resumo do que muda no dia a dia
- **Pix:** continua exatamente como antes, sem taxas, sem precisar de nada disso.
- **Cartão:** processado pela Stripe, com taxa por transação, o dinheiro cai na conta
  bancária vinculada à conta Stripe de vocês (não direto no Pix).
- Qualquer alteração no `index.html` feita direto pelo GitHub é publicada automaticamente
  pela Vercel, sem precisar repetir os passos de configuração.
- Se em algum momento acharem que o cartão não vale a pena pelas taxas, é só remover a
  aba "Cartão" do modal (me avise que eu tiro) e manter só o Pix.
