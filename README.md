# SmartToLet – User Manual

A house-rental platform: renters search and book visits, owners post properties, and admins review, price and publish them.

- **Website** – React app (`frontend/`)
- **API** – Laravel 6 (`backend/`)
- **Database** – MySQL 8

Other docs: [DOCKER.md](DOCKER.md) (containers), [DEPLOYMENT.md](DEPLOYMENT.md) (going live), [DEVELOPER.md](DEVELOPER.md) (code).

---

## 1. Start the project

Requires Docker Desktop.

```bash
docker compose up -d --build
```

| What | Address |
|---|---|
| API | http://localhost:8000/api/v1 |
| Website (Docker frontend, if enabled in `docker-compose.yml`) | http://localhost:8080 |
| Admin panel | `/admin` on the website |

Running the website in development instead:

```bash
cd frontend
npm install
npm run dev
```

It opens on http://localhost:5173 and talks to the API on port 8000 (`frontend/.env`).

Stop / reset:

```bash
docker compose down        # stop, keep data
docker compose down -v     # stop and DELETE database + uploads
```

### Public URLs with ngrok (optional)

Share the site and API over the internet:

1. Copy your token from https://dashboard.ngrok.com/get-started/your-authtoken into `.env` as `NGROK_AUTHTOKEN=...`.
2. Start everything with the `public` profile:

```bash
docker compose --profile public up -d --build
```

3. Print the public URLs (or open http://localhost:4040):

```bash
sh ngrok/urls.sh
```

You get two `https://….ngrok-free.app` addresses: **frontend** (the website, which also serves the API at `/backend/api/v1`) and **backend** (the API directly, at `/api/v1`). Free-plan URLs change on each restart. The site uses relative API URLs, so it works on the ngrok address with no extra setup. Visitors may see ngrok's one-time warning page; admin login is public too, so change `ADMIN_PASSWORD` first.

### Settings (`.env` in the project root)

| Variable | Meaning | Default |
|---|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Main admin login (reset on every start) | `admin@example.com` / `123456` |
| `PAYMENT_DEFAULT_AMOUNT` | Listing fee in BDT | `500` |
| `SEED_DEMO` | `false` = skip sample cities/areas | `true` |

After changing `.env`, run `docker compose up -d --build`.

---

## 2. For renters and owners (website)

### Create an account
Sign up with name, email, phone and a password of **at least 8 characters**, or use Google sign-in if enabled. Forgot your password? Use "Forgot password" on the login page; the reset mail is written to the backend log in Docker (`docker compose logs backend`).

### Find a property
- Use the search and filters on **Properties**: city, area, purpose (Rent/Sale), category, type, rooms, price.
- The home page has badges: **Hot / new**, **Trending**, **Best rated**.
- Save favourites with the heart (**Wishlist**) and compare listings (**Compare**).
- On a property page: photos, details, map, nearby properties, **Book a visit** and **Ask a question**.

### Post a property (owners)
1. **Post a property** → fill in title, purpose, category, type, city, area, address, rooms, price, details, contact and photos (main photo required, max 4 MB each).
2. The listing starts as **Pending**. It is not public yet.
3. Under **My properties**, click **Pay listing fee**, send the fee to a listed account, and submit the transaction reference. A coupon code can reduce the fee.
4. When an admin verifies your payment and approves the listing, it becomes **Published**.

You can delete a listing only while it is Pending. Rejected payment? The page shows the reason and a **Pay again** button.

---

## 3. For admins

Log in at `/admin` with the admin email and password.

### Publishing workflow
```
Pending ──(listing fee verified)──► Approve & publish ──► In progress ──► Delivered
   └────────────► Cancel listing (can be moved back to Pending)
```
1. **Payments** → verify the owner's listing-fee reference (see below).
2. **Properties** → open the listing, edit anything that needs fixing, set badges, then **Approve & publish**.
3. Later use **Mark in progress** and **Mark delivered**.

Approve is refused with a message until the listing fee is verified. Only Published and In progress listings are visible on the site.

### Properties
- Tabs: All, Pending, Published, In progress, Delivered, Cancelled. Search by title, address or code.
- **Edit property & photos** changes every field: title, purpose, category, type, city, area, address, rooms, prices, map, video, details, contact, the three photos and the badges. Upload a new file in a photo slot to replace it.
- Row menu also has status changes, **Open on website** and **Delete permanently**. Bulk actions apply to selected rows.

### Payments
- Opens on **To verify**. Each row shows what was paid for (listing fee), payer, property, method, **reference**, sender number and amount.
- Compare the reference with your bank/wallet statement, then:
  - **Verify payment** – marks it paid (for a listing fee this unlocks publishing).
  - **Reject reference** – enter a reason; the owner sees it and can submit again.
- Filter by status, or search a reference / number.

### Payment methods
**Payment methods** in the menu: add the accounts users pay into.

| Field | Example |
|---|---|
| Type | Card, Bank account, Mobile banking |
| Name | bKash, Nagad, City Bank |
| Account holder / number | the card, account or wallet number |
| Instructions | "Use Send Money, then copy the TrxID" |
| Show to users | untick to hide without deleting |

### Other sections
- **Visit bookings**, **Inbox** (contact messages, inquiries, newsletter)
- **Cities & areas**, **Coupons** (percentage off the listing fee), **Blog**
- **Reports** (including delivered report export), **Site settings**, **Backups**
- **Sub-admins** – create admins limited to chosen sections

---

## 4. Troubleshooting

| Problem | Fix |
|---|---|
| Page shows an old version / "does not provide an export" | Restart `npm run dev`, then hard-reload (Ctrl+Shift+R) |
| Cannot log in as admin | Check `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`, then `docker compose up -d --build` |
| Property photos do not load | Make sure the backend is running; direct API URLs must be on port 8000 |
| "Approve" says the listing fee is not paid | Verify the owner's payment under **Payments** first |
| Owner cannot pay: "No payment methods" | Add one under **Payment methods** |
| Everything looks empty | The database was reset (`down -v`); the admin is recreated automatically |
| Check what the server is doing | `docker compose logs -f backend` |

Demo logins created for testing are listed by the person who set up your copy; change every default password before going live (see [DEPLOYMENT.md](DEPLOYMENT.md)).
