# ReUse Mart Backend

Production-grade Express/TypeScript API for ReUse Mart marketplace.

## Setup

### Prerequisites
- Node.js 18+
- Supabase PostgreSQL project (or any PostgreSQL instance)

### Installation

```bash
npm install
```

### Environment
Copy `.env` and update credentials:
```
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<ENCODED_DB_PASSWORD>@aws-1-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
JWT_SECRET="your_secret_here"
PORT=4000
```

Notes:
- Use the Supabase pooling URL (port `6543`) for runtime and deployment environments.
- URL-encode special characters in DB password (for example `@` -> `%40`, `#` -> `%23`, `$` -> `%24`).
- In Render, set `NODE_ENV=production` and let Render inject `PORT` dynamically.

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed core data
npm run db:seed
```

### Run Development Server

```bash
npm run dev
```

Server runs at **http://localhost:4000**

## Deploy on Render

### Web Service settings
- Root directory: `backend`
- Build command:
```bash
npm install && npm run build && npx prisma generate
```
- Start command:
```bash
node dist/index.js
```

### Required environment variables
```bash
DATABASE_URL=<supabase_pooling_url_on_6543>
JWT_SECRET=<strong_secret>
NODE_ENV=production
```

### Apply migrations in production (recommended)
Run once after deploy:
```bash
npx prisma migrate deploy
```

Or include it in build command:
```bash
npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (buyer) |
| POST | `/api/auth/login` | Login |

### Products (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/search?q=` | Search products |

### Seller (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seller/activate` | Activate seller mode |
| GET | `/api/seller/products` | My products |
| POST | `/api/seller/products` | Create product |
| PUT | `/api/seller/products/:id` | Update product |
| DELETE | `/api/seller/products/:id` | Delete product |

### Admin (Admin Role Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Stats + recent data |
| GET | `/api/admin/users` | All users |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/products` | All products |

---

## Credentials (after seed)
- Admin: `admin@reusemart.com` / `Admin@1234`
