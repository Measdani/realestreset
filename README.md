# Realest Reset

Black/gold service site with Stripe Checkout, quote intake, and quote admin.

## Files

- `index.html` is the homepage.
- `services.html`, `process.html`, `results.html`, and `pricing.html` are the separate header pages.
- `quote.html` is the MVP/audit intake form.
- `admin.html` is the quote review dashboard.
- `styles.css` contains the full visual system.
- `script.js` handles checkout button state and the lightweight hero canvas.
- `quote.js` handles the conditional quote form and local test fallback.
- `admin.js` handles the quote admin dashboard.
- `api/create-checkout-session.js` creates Stripe Checkout Sessions on Vercel.
- `api/quotes.js` stores and reads quote submissions through Upstash Redis on Vercel.

## Stripe setup

Create three one-time Stripe Prices:

- WordPress Breakout: `$3,500`, set the ID as `STRIPE_WORDPRESS_PRICE_ID`
- Independent Academy: `$3,500`, set the ID as `STRIPE_ACADEMY_PRICE_ID`
- Security & Logic Audit: `$450`, set the ID as `STRIPE_AUDIT_PRICE_ID`

Then set these environment variables in Vercel:

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WORDPRESS_PRICE_ID=price_your_wordpress_breakout_price_id
STRIPE_ACADEMY_PRICE_ID=price_your_independent_academy_price_id
STRIPE_AUDIT_PRICE_ID=price_your_audit_price_id
```

## Quote admin setup

Install Upstash Redis from the Vercel Marketplace, then set:

```bash
UPSTASH_REDIS_REST_URL=https://your-upstash-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
ADMIN_TOKEN=choose_a_long_private_admin_token
```

Use `admin.html` with `ADMIN_TOKEN` to load and update remote quote submissions.
Before Upstash is connected, `quote.html` saves submissions to local browser storage for testing.

## Local development

Install dependencies once:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

The visual pages can also be opened directly from `index.html`. Stripe Checkout and remote quote storage require Vercel-compatible API routes, so use a Vercel deployment when testing production payments and remote submissions.

## Verify

```bash
npm run check
```
