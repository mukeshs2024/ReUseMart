# ReUseMart Full Project Guide

This document explains the full project, all major features, where code is located, and important SQL queries with their purpose.

## File Location
- This documentation file is located at: `PROJECT_FULL_GUIDE.md` (repo root)

## 1. Project Overview
ReUseMart is a full-stack re-commerce marketplace where users can buy and sell second-hand products.

Main goals:
- Buyer and seller flows in one platform
- Trust-focused marketplace (seller trust score, admin moderation)
- Product listing, search, cart, checkout, and order flow
- Real-time messaging between buyer and seller
- QR-based payment confirmation flow

## 2. Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Zustand stores (auth/cart/theme)

### Backend
- Node.js + TypeScript
- Express-style REST API
- Prisma ORM
- Realtime socket layer for chat

### Database
- PostgreSQL
- Prisma migrations and seed scripts

## 3. Repository Structure

- `README.md`: Main project readme
- `backend/`: API, Prisma schema, migrations, seed files, controllers, middleware
- `frontend/`: Next.js app, pages, components, stores, utilities

Important backend locations:
- `backend/src/index.ts`: API bootstrap
- `backend/src/app.ts`: app wiring and middleware
- `backend/src/controllers/`: request handlers
- `backend/src/routes/`: API routes
- `backend/src/realtime/chatSocket.ts`: realtime messaging
- `backend/prisma/schema.prisma`: DB model definitions
- `backend/prisma/migrations/`: schema migration history
- `backend/prisma/seed.ts`: full seed data
- `backend/prisma/seed-simple.ts`: simplified seed
- `backend/sql/fix_product_images.sql`: one-time image URL update script

Important frontend locations:
- `frontend/app/`: route-based pages
- `frontend/components/`: reusable UI components
- `frontend/store/authStore.ts`: auth state
- `frontend/store/cartStore.ts`: cart state
- `frontend/lib/axios.ts`: API client
- `frontend/lib/utils.ts`: shared helpers (currency, category, placeholders)

## 4. Feature Breakdown

### 4.1 Authentication and Roles
- Register/login via auth endpoints
- Buyer and seller mode switching
- Admin-only views for moderation and management

Primary code:
- `backend/src/controllers/auth.controller.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/adminGuard.ts`
- `frontend/store/authStore.ts`

### 4.2 Product Marketplace
- Public product listing and search
- Product detail page
- Category, condition, and price filters

Primary code:
- `backend/src/controllers/products.controller.ts`
- `backend/src/routes/products.ts`
- `frontend/app/products/page.tsx`
- `frontend/app/products/[id]/page.tsx`
- `frontend/components/products/ProductCard.tsx`

### 4.3 Seller Product Management
- Seller can create/edit/delete products
- Stock and usage years management
- Product condition and metadata

Primary code:
- `backend/src/controllers/seller.controller.ts`
- `backend/src/routes/seller.ts`
- `frontend/app/seller/products/page.tsx`
- `frontend/app/seller/products/new/page.tsx`
- `frontend/app/seller/products/[id]/edit/page.tsx`

### 4.4 Cart and Checkout
- Add/remove/update cart items
- Address capture and order placement
- Checkout success flow

Primary code:
- `frontend/store/cartStore.ts`
- `frontend/app/cart/page.tsx`
- `frontend/app/checkout/page.tsx`
- `frontend/app/checkout/success/[id]/page.tsx`
- `backend/src/controllers/seller.controller.ts` (order creation path)

### 4.5 Messaging (Realtime)
- Buyer-seller chat by product context
- Conversation list and message timeline

Primary code:
- `backend/src/realtime/chatSocket.ts`
- `backend/src/controllers/messages.controller.ts`
- `backend/src/routes/messages.ts`
- `frontend/app/messages/page.tsx`
- `frontend/lib/chatSocket.ts`

### 4.6 Admin Features
- Admin dashboard stats
- User and product management views

Primary code:
- `backend/src/controllers/admin.controller.ts`
- `backend/src/routes/admin.ts`
- `frontend/app/admin/dashboard/page.tsx`
- `frontend/app/admin/products/page.tsx`
- `frontend/app/admin/users/page.tsx`

### 4.7 Trust and Verification UX
- Verified seller indicators
- Trust score rendering in UI

Primary code:
- `frontend/components/TrustBadge.tsx`
- product card and detail pages where trust score is rendered

## 5. Database and Prisma

### Prisma schema and migrations
- Schema source: `backend/prisma/schema.prisma`
- Migration history: `backend/prisma/migrations/`

### Seed data
- Full seed: `backend/prisma/seed.ts`
- Simple seed: `backend/prisma/seed-simple.ts`

## 6. SQL Queries and Purpose

### Query A: Force update all product image URL values by title keyword
Purpose:
- Quick emergency fix when products show wrong/repeated image mappings.
- Rewrites `imageUrl` for all rows using a keyword-based `CASE` mapping.

```sql
UPDATE "Product"
SET "imageUrl" =
CASE
  WHEN "title" ILIKE '%usb%' THEN '/images/electronics/usb.jpg'
  WHEN "title" ILIKE '%power%' THEN '/images/electronics/powerbank.jpg'
  WHEN "title" ILIKE '%shoe%' THEN '/images/fashion/shoes.jpg'
  WHEN "title" ILIKE '%bag%' THEN '/images/fashion/bag.jpg'
  ELSE '/images/default.jpg'
END;
```

When to use:
- You need immediate visible correction of product images in DB data.

### Query B: Controlled image URL fix only for empty/placeholder values
File location:
- `backend/sql/fix_product_images.sql`

Purpose:
- Safer migration script for existing data.
- Only updates rows where image is null/placeholder/empty.
- Avoids overwriting already valid image URLs.

Representative logic from script:

```sql
UPDATE "Product"
SET "imageUrl" =
CASE
  WHEN "title" ILIKE '%usb%' OR "title" ILIKE '%adapter%' THEN '/images/electronics/usb-hub.svg'
  WHEN "title" ILIKE '%power%' THEN '/images/electronics/powerbank.svg'
  WHEN "title" ILIKE '%shoe%' OR "title" ILIKE '%running%' THEN '/images/fashion/shoes.svg'
  WHEN "title" ILIKE '%bag%' THEN '/images/fashion/bag.svg'
  ELSE '/images/default.svg'
END
WHERE "imageUrl" IS NULL
   OR "imageUrl" LIKE '%placehold.co%'
   OR "imageUrl" LIKE '%placeholder%'
   OR "imageUrl" = '';
```

When to use:
- You want to migrate dirty/legacy rows without touching clean rows.

## 7. Local Run Commands

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Prisma migrate + seed
```bash
cd backend
npm run db:migrate
npm run db:seed
```

## 8. Common Debug Checklist

- DB reachable and `DATABASE_URL` valid
- Backend running on expected port
- Frontend API base URL points to backend
- Prisma schema and migrations are in sync
- Seed data is rerun when data-model assumptions change
- Browser cache and Next build cache (`.next`) are cleared if stale UI appears

## 9. Notes for Future Improvements

- Add stronger category/title image mapping rules
- Add dedicated image upload storage strategy
- Add end-to-end tests for product->cart->checkout->order path
- Add centralized API error contract for better UI error states

---
Maintainer note:
- Keep this file updated whenever routes, DB schema, or critical SQL maintenance scripts change.
