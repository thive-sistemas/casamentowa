// Cria uma sessão de Checkout Incorporado (Embedded Checkout) da Stripe
// com o valor exato do presente escolhido. A chave secreta (STRIPE_SECRET_KEY)
// fica só aqui no servidor, configurada como variável de ambiente na Vercel —
// nunca aparece no código do site.

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { amount, giftName, giftId } = body || {};

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: "Valor inválido para o presente." });
      return;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
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
      },
      return_url: `${origin}/?stripe_session={CHECKOUT_SESSION_ID}&gift_id=${encodeURIComponent(
        giftId || ""
      )}`,
    });

    res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
