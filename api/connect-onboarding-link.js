// Gera link de cadastro Stripe Connect (Express) para a noiva receber pagamentos.
// Uso: POST /api/connect-onboarding-link  (header X-Connect-Admin-Secret se CONNECT_ADMIN_SECRET estiver definido)

const {
  getStripe,
  getConnectedAccountId,
  setCors,
} = require("./stripe-helpers");

function assertAdmin(req, res) {
  const expected = process.env.CONNECT_ADMIN_SECRET;
  if (!expected || expected.includes("COLOQUE")) return true;
  const provided =
    req.headers["x-connect-admin-secret"] ||
    (req.query && req.query.secret) ||
    "";
  if (provided !== expected) {
    res.status(401).json({ error: "Não autorizado." });
    return false;
  }
  return true;
}

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

  if (!assertAdmin(req, res)) return;

  const stripe = getStripe();
  if (!stripe) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const origin = req.headers.origin || `https://${req.headers.host}`;

    let accountId = getConnectedAccountId() || body.accountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          site: "casamentowa",
          event: "Wdmar & Adylla",
        },
      });
      accountId = account.id;
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/?connect=refresh`,
      return_url: `${origin}/?connect=done&account_id=${encodeURIComponent(accountId)}`,
      type: "account_onboarding",
    });

    res.status(200).json({
      url: link.url,
      accountId,
      message:
        "Envie este link para a noiva completar o cadastro. Depois salve accountId em STRIPE_CONNECTED_ACCOUNT_ID e em CONFIG.stripeConnectedAccountId no index.html.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
