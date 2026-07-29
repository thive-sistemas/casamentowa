// Stripe Connect — cobrança direta na conta conectada da noiva (conta Express).
// STRIPE_SECRET_KEY = sua conta plataforma | STRIPE_CONNECTED_ACCOUNT_ID = acct_ da noiva

const {
  getStripe,
  getConnectRequestOptions,
  setCors,
} = require("./stripe-helpers");

module.exports = async (req, res) => {
  setCors(req, res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const stripe = getStripe();
  const connectOptions = getConnectRequestOptions();

  if (!stripe) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada no servidor." });
    return;
  }

  if (!connectOptions) {
    res.status(500).json({
      error: "STRIPE_CONNECTED_ACCOUNT_ID não configurada. Cadastre a conta da noiva (veja STRIPE_CONNECT.md).",
    });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { amount, giftName, giftId, presenteadoPor } = body || {};

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: "Valor inválido para o presente." });
      return;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const connected = await stripe.accounts.retrieve(connectOptions.stripeAccount);
    if (!connected.charges_enabled) {
      res.status(400).json({
        error:
          "A conta da noiva ainda não está liberada para receber cartão. Complete o cadastro no link da Stripe Connect.",
      });
      return;
    }

    const session = await stripe.checkout.sessions.create(
      {
        ui_mode: "embedded",
        mode: "payment",
        locale: "pt-BR",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: giftName || "Presente de casamento — Wdmar & Adylla",
              },
              unit_amount: Math.round(Number(amount) * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          giftId: giftId || "",
          giftName: giftName || "",
          presenteadoPor: presenteadoPor || "",
        },
        return_url: `${origin}/?stripe_session={CHECKOUT_SESSION_ID}&gift_id=${encodeURIComponent(
          giftId || ""
        )}`,
      },
      connectOptions
    );

    res.status(200).json({
      clientSecret: session.client_secret,
      connectedAccountId: connectOptions.stripeAccount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
