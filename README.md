# Realest Reset

Black/gold service site with Stripe Payment Links, quote intake, and quote admin.

## Files

- `index.html` is the homepage.
- `services.html`, `process.html`, `results.html`, and `pricing.html` are the separate header pages.
- `quote.html` is the MVP/audit intake form.
- `admin.html` is the quote review dashboard.
- `styles.css` contains the full visual system.
- `script.js` handles Stripe Payment Link redirects and the lightweight hero canvas.
- `quote.js` handles the conditional quote form and local test fallback.
- `admin.js` handles the quote admin dashboard.
- `api/quotes.js` stores and reads quote submissions through Upstash Redis on Vercel.
- `api/admin-login.js` protects the admin dashboard with the admin password.

## Stripe Payment Links

Create three Stripe Payment Links in Stripe:

- Project Deposit: `$1,750`
- Final Payment: `$1,750`
- Security & Logic Audit: `$450`

Then paste those URLs into `script.js`:

```js
const paymentLinks = {
  serviceDeposit: "https://buy.stripe.com/...",
  serviceFinal: "https://buy.stripe.com/...",
  audit: "https://buy.stripe.com/...",
};
```

## Quote admin setup

Install Upstash Redis from the Vercel Marketplace, then set:

```bash
UPSTASH_REDIS_REST_URL=https://your-upstash-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
ADMIN_TOKEN=choose_a_long_private_admin_password
```

Use `admin.html` and enter `ADMIN_TOKEN` as the admin password to load and update remote quote submissions.
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

The visual pages can also be opened directly from `index.html`. Stripe Payment Links work as normal links. Remote quote storage requires the Vercel API route, so use a Vercel deployment when testing production submissions.

## Verify

```bash
npm run check
```
