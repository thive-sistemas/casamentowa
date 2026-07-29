const {
  getStripe,
  getConnectRequestOptions,
  setCors,
} = require("./stripe-helpers");

module.exports = async (req, res) => {
  setCors(req, res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const stripe = getStripe();
  const connectOptions = getConnectRequestOptions();

  if (!stripe) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada no servidor." });
    return;
  }

  if (!connectOptions) {
    res.status(500).json({ error: "STRIPE_CONNECTED_ACCOUNT_ID não configurada." });
    return;
  }

  try {
    const sessionId = req.query.session_id;
    if (!sessionId) {
      res.status(400).json({ error: "session_id ausente" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, connectOptions);

    res.status(200).json({
      paid: session.payment_status === "paid",
      amount: session.amount_total ? session.amount_total / 100 : null,
      giftId: session.metadata ? session.metadata.giftId : "",
      giftName: session.metadata ? session.metadata.giftName : "",
      presenteadoPor: session.metadata ? session.metadata.presenteadoPor : "",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
