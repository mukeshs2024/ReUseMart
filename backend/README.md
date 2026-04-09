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
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
DATABASE_POOL_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="your_secret_here"
PORT=4000
```

Notes:
- `DATABASE_POOL_URL` is used by the running API for better pooled connections.
- `DIRECT_URL` is used by Prisma CLI migrations.
- If you only provide one URL, set `DATABASE_URL`.

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
