// Confirma, direto com a Stripe (servidor a servidor), se um pagamento
// foi realmente aprovado antes de marcarmos o presente como "dado".
// Isso evita que alguém marque um presente como pago sem ter pago de verdade.

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) {
      res.status(400).json({ error: "session_id ausente" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).json({
      paid: session.payment_status === "paid",
      amount: session.amount_total ? session.amount_total / 100 : null,
      giftId: session.metadata ? session.metadata.giftId : "",
      giftName: session.metadata ? session.metadata.giftName : "",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
