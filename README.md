# Realest Reset

Minimal dark one-page service site with Stripe Checkout for fixed-price services and website technical audits.

## Files

- `index.html` is the one-page website.
- `services.html`, `process.html`, `results.html`, and `pricing.html` are the separate header pages.
- `styles.css` contains the full visual system.
- `script.js` handles checkout button state and the lightweight hero canvas.
- `netlify/functions/create-checkout-session.js` creates Stripe Checkout Sessions.

## Stripe setup

Create three one-time Stripe Prices:

- WordPress Breakout: `$3,500`, set the ID as `STRIPE_WORDPRESS_PRICE_ID`
- Independent Academy: `$3,500`, set the ID as `STRIPE_ACADEMY_PRICE_ID`
- Security & Logic Audit: `$450`, set the ID as `STRIPE_AUDIT_PRICE_ID`

Then set these environment variables in Netlify with Functions scope:

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WORDPRESS_PRICE_ID=price_your_wordpress_breakout_price_id
STRIPE_ACADEMY_PRICE_ID=price_your_independent_academy_price_id
STRIPE_AUDIT_PRICE_ID=price_your_audit_price_id
```

Netlify exposes `URL` to functions at runtime, so the function uses it for Stripe success and cancel redirects after deployment.

## Local development

Install dependencies once:

```bash
npm install
```

Run the Netlify dev server:

```bash
npm run dev
```

The visual page can also be opened directly from `index.html`. Stripe Checkout requires Netlify Functions, so use `npm run dev` or a Netlify deploy when testing payments.

## Verify

```bash
npm run check
```
