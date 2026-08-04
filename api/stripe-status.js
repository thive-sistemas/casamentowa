const { getStripe, getConnectRequestOptions, setCors } = require("./stripe-helpers");

module.exports = async (req, res) => {
  setCors(req, res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const stripe = getStripe();
  const connectOptions = getConnectRequestOptions();

  if (!stripe) {
    res.status(200).json({
      configured: false,
      cardEnabled: false,
      livemode: false,
      message: "STRIPE_SECRET_KEY não configurada.",
    });
    return;
  }

  try {
    const account = connectOptions
      ? await stripe.accounts.retrieve(connectOptions.stripeAccount)
      : await stripe.accounts.retrieve();

    const cardEnabled = Boolean(account.charges_enabled);
    const livemode = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_live"));

    let message = "";
    if (!cardEnabled) {
      message = livemode
        ? "Pagamento por cartão aguardando liberação da Stripe. Use Pix por enquanto ou complete seu cadastro em dashboard.stripe.com/settings/account"
        : "Modo teste — use o cartão 4242 4242 4242 4242 após configurar a conta.";
    }

    res.status(200).json({
      configured: true,
      cardEnabled,
      livemode,
      cardPayments: account.capabilities ? account.capabilities.card_payments : null,
      message,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, cardEnabled: false });
  }
};
