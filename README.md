# E-Commerce REST API

Node.js · Express 5 · MongoDB (Mongoose 9) · JWT · ES Modules

## Quick start
```bash
npm install
cp .env.example .env        # then fill DB_URL and JWT_SECRET
npm run dev                 # nodemon
npm run seed:admin          # first admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run seed:data           # optional sample products
npm test                    # tests that don't need a database
```
Production: `NODE_ENV=production npm start` (set `TRUST_PROXY=true` behind a proxy, SMTP_* for real emails).

## Structure
```
server.js                 start, graceful shutdown
src/app.js                middlewares + routes
src/config/               env loading & validation
src/DB/                   connection + models
src/middlewares/          auth, validate, upload, sanitize, error
src/utils/                ApiError, ApiFeatures (filter/sort/search/paginate), handlerFactory, email, token
src/modules/<feature>/    router · controller · validation
```

## Response format
Success: `{ "status": "success", "data": ..., "pagination": {...} }`
Error: `{ "status": "fail", "message": "...", "errors": [{ "field", "message" }] }`

Auth header: `Authorization: Bearer <token>`.
List endpoints support: `?page=1&limit=10&sort=-price,title&fields=title,price&keyword=shirt&price[gte]=10&price[lte]=100&category=<id>`.

## Endpoints (all under `/api/v1`)
| Area | Endpoint | Access |
|---|---|---|
| Auth | `POST /auth/signup` · `GET /auth/confirm-email/:token` · `POST /auth/login` | public |
| | `POST /auth/forgot-password` → `POST /auth/verify-reset-code` → `PATCH /auth/reset-password` | public |
| Users | `GET/PATCH/DELETE /users/me` · `PATCH /users/me/password` · `GET/POST /users/me/addresses` · `DELETE /users/me/addresses/:addressId` | user |
| | `GET/POST /users` · `GET/PATCH/DELETE /users/:id` | admin |
| Categories | `GET /categories` · `GET /categories/:id` | public |
| | `POST /categories` · `PATCH/DELETE /categories/:id` (multipart, field `image`) | admin |
| Sub-categories | `GET /subcategories` · `GET /categories/:categoryId/subcategories` · `GET /subcategories/:id` | public |
| | `POST /subcategories` or `POST /categories/:categoryId/subcategories` · `PATCH/DELETE /subcategories/:id` | admin |
| Brands | same as categories under `/brands` | |
| Products | `GET /products` · `GET /products/:id` (with reviews) | public |
| | `POST /products` · `PATCH/DELETE /products/:id` (multipart: `imageCover`, `images[]` or URLs in JSON) | admin |
| Reviews | `GET /reviews` · `GET /products/:productId/reviews` · `GET /reviews/:id` | public |
| | `POST /products/:productId/reviews` · `PATCH /reviews/:id` | user |
| | `DELETE /reviews/:id` | owner / admin |
| Wishlist | `GET/POST /wishlist` (`{productId}`) · `DELETE /wishlist/:productId` | user |
| Cart | `GET/POST/DELETE /cart` · `PATCH/DELETE /cart/:itemId` · `PATCH /cart/apply-coupon` | user |
| Coupons | CRUD `/coupons` | admin |
| Orders | `POST /orders` (cash, from cart) · `GET /orders` · `GET /orders/:id` · `PATCH /orders/:id/cancel` | user (own) / admin |
| | `PATCH /orders/:id/pay` · `PATCH /orders/:id/deliver` | admin |

## Notes
- Passwords are bcrypt-hashed; changing a password invalidates old tokens.
- Reset codes are 6 digits, stored hashed, valid 10 minutes. In development, emails are printed to the console when SMTP is not configured.
- Stock is reserved atomically on checkout and restored on cancel. Prices are always re-read from the DB.
- Product `ratingsAverage/ratingsQuantity` are computed from reviews.
- Not included yet: online payments (Stripe), image resizing, refresh tokens.
