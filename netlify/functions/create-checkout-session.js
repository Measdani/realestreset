const Stripe = require("stripe");

const products = {
  deposit: {
    priceEnv: "STRIPE_DEPOSIT_PRICE_ID",
    label: "Realest Reset Project Deposit",
  },
  audit: {
    priceEnv: "STRIPE_AUDIT_PRICE_ID",
    label: "Realest Reset Security & Logic Audit",
  },
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

const getOrigin = (event) => {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const requestOrigin = event.headers.origin || event.headers.Origin;
  return siteUrl || requestOrigin || "http://localhost:8888";
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, { error: "Missing STRIPE_SECRET_KEY" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const product = products[payload.product];
  if (!product) {
    return json(400, { error: "Unknown checkout product" });
  }

  const priceId = process.env[product.priceEnv];
  if (!priceId) {
    return json(500, { error: `Missing ${product.priceEnv}` });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
    const origin = getOrigin(event).replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: payload.product === "audit" ? "book" : "pay",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: payload.product,
      metadata: {
        product: payload.product,
        service: product.label,
      },
      success_url: `${origin}/?checkout=success&product=${encodeURIComponent(payload.product)}`,
      cancel_url: `${origin}/?checkout=cancelled&product=${encodeURIComponent(payload.product)}`,
    });

    return json(200, { url: session.url });
  } catch (error) {
    return json(500, {
      error: error.message || "Unable to create Stripe Checkout session",
    });
  }
};
