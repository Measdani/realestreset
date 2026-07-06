# Realest Reset Logistics

Responsive Next.js logistics website with a Postgres-backed quote form and protected dispatch dashboard.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Provision a Postgres database through Vercel Storage/Marketplace and use its pooled `DATABASE_URL`.
4. Run `npm run dev` and open `http://localhost:3000`.

The quote table is created automatically on first use. Admin access is available at `/admin`. Replace placeholder phone, email, metrics, and testimonial text in `src/lib/content.ts` and the landing component before launch.
