import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const prismaDatasourceUrl = process.env.DATABASE_POOL_URL || process.env.DATABASE_URL || env("DATABASE_POOL_URL") || env("DATABASE_URL");

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // Use connection pool URL for runtime, fall back to direct URL if needed
        url: prismaDatasourceUrl,
    },
});
