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

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { amount, giftName, giftId, presenteadoPor, mensagem } = body || {};

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: "Valor inválido para o presente." });
      return;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

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
          mensagem: mensagem || "",
        },
        return_url: `${origin}/?stripe_session={CHECKOUT_SESSION_ID}`,
      },
      connectOptions || undefined
    );

    res.status(200).json({
      clientSecret: session.client_secret,
      connectedAccountId: connectOptions ? connectOptions.stripeAccount : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
