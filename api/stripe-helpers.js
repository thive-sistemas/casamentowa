const Stripe = require("stripe");

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("COLOQUE")) return null;
  return new Stripe(key);
}

function getConnectedAccountId() {
  const id = process.env.STRIPE_CONNECTED_ACCOUNT_ID;
  if (!id || id.includes("COLOQUE")) return null;
  return id;
}

function getConnectRequestOptions() {
  const stripeAccount = getConnectedAccountId();
  if (!stripeAccount) return null;
  return { stripeAccount };
}

function setCors(req, res, methods = "GET, POST, OPTIONS") {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = {
  getStripe,
  getConnectedAccountId,
  getConnectRequestOptions,
  setCors,
};
