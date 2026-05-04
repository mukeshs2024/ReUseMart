# ReUseMart

ReUseMart is a marketplace web application for buying and selling high-quality used goods. It brings buyers and sellers together with a focus on trust, ease-of-use, and low friction payments. This repository contains the full-stack source for the project: a TypeScript/Node backend (API + realtime chat) and a Next.js frontend.

**This README** documents what the project is, how it's organized, how to run it locally, and notes for deployment and contribution.

**Project Summary**
- **Purpose**: Provide a lightweight re-commerce storefront where sellers can list second-hand products, buyers can browse and buy, and both can communicate via real-time chat.
- **Core capabilities**: product listings, search, user roles (buyer/seller/admin), order creation, basic payment integration via QR, messaging, and admin management.

**Features**

Top to bottom, this is what ReUseMart brings to the table (with extra masala):

1. **Sign up and jump in**: Create an account, log in, and set up your profile before your chai gets cold.
2. **Switch roles like a pro**: Go from buyer to seller mode faster than a plot twist in a daily soap.
3. **List products with style**: Add photos, category, condition, stock, and details so your product looks legit, not mysterious.
4. **Browse and discover**: Hunt for pre-loved gems instead of scrolling the same boring feed forever.
5. **Cart and checkout flow**: Add to cart, lock in quantity, and place orders without calculator-level confusion.
6. **Order tracking basics**: Track status updates so "Bhai, where is my order?" messages stay under control.
7. **Realtime buyer-seller chat**: Instant websocket chat for quick bargaining, quick answers, and fewer misunderstandings.
8. **Payment QR support**: QR-based payment flow that keeps checkout smooth and low-friction.
9. **Admin control center**: Manage users, products, and moderation from one dashboard like the final boss.

**Architecture & Tech Stack**
- **Backend**: Node.js + TypeScript, Prisma ORM, REST API (Express-like), websockets for chat.
- **Database**: PostgreSQL (configured via `DATABASE_URL` and Prisma).
- **Auth**: JWT-based authentication (see `JWT_SECRET`).
- **Storage & 3rd-party**: Supabase client is used for some integrations; QR generation uses a public QR API.
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS.

**Repository Layout**
- `backend/`: API server, Prisma schema, migrations, seed script, controllers, middleware, and realtime socket code.
- `frontend/`: Next.js application (UI, pages, components, stores).
- `README.md`: this file.

**Quickstart — Prerequisites**
- Node.js (v18+ recommended)
- npm (or pnpm/yarn)
- PostgreSQL (local or hosted) or another datasource supported by Prisma
- (Optional) Supabase project for file/storage or other integrations

**Required environment variables**
The backend expects the following environment variables (defined in a `.env` file or your environment):
- `DATABASE_URL` — PostgreSQL connection string used by Prisma.
- `JWT_SECRET` — secret key used to sign JWT tokens.
- `SUPABASE_URL` — (optional) Supabase project URL if used.
- `SUPABASE_ANON_KEY` — (optional) Supabase anon/public key.

There may be additional environment variables used by integrations or deployment scripts; search `process.env` in `backend/src` for other entries.

**Run locally — Backend**
1. Open a terminal and install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file with the required variables (see above).

3. Run Prisma migrations and seed the database (development):

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

4. Start the dev server:

```bash
npm run dev
```

Typical backend npm scripts (see `backend/package.json`) include `dev`, `build`, `start`, and `test`.

**Run locally — Frontend**
1. From repo root:

```bash
cd frontend
npm install
npm run dev
```

2. The Next.js app will usually run at `http://localhost:3000`.

**Database & Prisma**
- Prisma schema is in `backend/prisma/schema.prisma` and migrations are in `backend/prisma/migrations`.
- The project uses a seed file located at `backend/prisma/seed.ts`. The `prisma.config.ts` indicates the seed command.
- For production deployments use `npx prisma migrate deploy` and run the seed step as part of your release process if needed.

**Testing**
- Integration tests (backend) are in `backend/test/`. Run tests with the test script in `backend/package.json`:

```bash
cd backend
npm test
```

Make sure test DB credentials are set if tests expect a database.

**Deployment notes**
- Build backend with `npm run build` and run in a Node-friendly environment. Provide `DATABASE_URL` and `JWT_SECRET` as environment variables in production. Use `npx prisma generate` and `npx prisma migrate deploy` on deploy pipelines.
- Build frontend with `npm run build` in `frontend` and deploy to Vercel, Netlify, or another static hosting that supports Next.js. Configure environment variables in your hosting provider.

**Security & Secrets**
- Keep `JWT_SECRET` and `DATABASE_URL` secret. Do not commit `.env` to the repository.
- Rotate secrets if they are ever exposed.

**Contributing**
- Fork the repo, create a feature branch, add tests for new behavior, and open a pull request against `main`.
- Follow existing code style (TypeScript types, formatting). Add or update Prisma migrations when changing data models.

**Troubleshooting**
- If Prisma cannot connect, verify `DATABASE_URL` and that your database is reachable.
- If JWT auth fails, ensure `JWT_SECRET` is set both for signing and verification environments.

**Contact / Maintainers**
- For questions or issues open a GitHub issue in the repository.

**License**
- The repository does not include a license file by default. Add a `LICENSE` if you want to declare an explicit license.

---

If you want, I can also:
- add a minimal `.env.example` file populated with placeholder keys,
- add a short paragraph describing the API endpoints, or
- commit the changes and run tests.

Edited file: [README.md](README.md)