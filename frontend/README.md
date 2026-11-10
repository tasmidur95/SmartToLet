# HouseRental frontend (React + JavaScript)

Single-page app for the Laravel API in `../` (`/api/v1`). Plain JavaScript (no TypeScript), Vite, React Router and hand-written CSS.

```bash
cd frontend
cp .env.example .env.local      # set VITE_API_URL to your Laravel API
npm install
npm run dev                     # http://localhost:5173
npm run build                   # production build in dist/
```

On the API side set `CORS_ALLOWED_ORIGINS` (default allows `http://localhost:5173`) and `FRONTEND_URL`
(where SSLCommerz sends the browser after payment: `/payment/success|failed|cancelled`).

## Structure
- `src/api/` fetch client (token, error envelope) and one function per endpoint
- `src/context/` auth, language (en/bn), toasts, wishlist
- `src/components/` navbar, footer, property card, pagination, shared UI
- `src/pages/` home, properties (search + filters), property details, auth, wishlist,
  post property, my properties (pay listing fee), my payments, profile, blog, contact, payment result

Admin panel lives at `/admin` (separate sign-in, per-section permissions for sub-admins). Google/Facebook sign-in buttons are not built yet.
