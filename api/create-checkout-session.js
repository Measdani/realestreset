const Stripe = require("stripe");

const products = {
  wordpress: {
    priceEnv: "STRIPE_WORDPRESS_PRICE_ID",
    label: "Realest Reset WordPress Breakout",
  },
  academy: {
    priceEnv: "STRIPE_ACADEMY_PRICE_ID",
    label: "Realest Reset Independent Academy",
  },
  audit: {
    priceEnv: "STRIPE_AUDIT_PRICE_ID",
    label: "Realest Reset Security & Logic Audit",
    submitType: "book",
  },
};

const getOrigin = (req) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
  }

  const product = products[req.body?.product];
  if (!product) {
    return res.status(400).json({ error: "Unknown checkout product" });
  }

  const priceId = process.env[product.priceEnv];
  if (!priceId) {
    return res.status(500).json({ error: `Missing ${product.priceEnv}` });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
    const origin = getOrigin(req).replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: product.submitType || "pay",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: req.body.product,
      metadata: {
        product: req.body.product,
        service: product.label,
      },
      success_url: `${origin}/pricing.html?checkout=success&product=${encodeURIComponent(req.body.product)}`,
      cancel_url: `${origin}/pricing.html?checkout=cancelled&product=${encodeURIComponent(req.body.product)}`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unable to create Stripe Checkout session",
    });
  }
};
