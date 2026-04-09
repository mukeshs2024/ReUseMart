import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const prismaDatasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || env("DATABASE_URL");

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // Use DIRECT_URL when set (recommended for Supabase migrations).
        url: prismaDatasourceUrl,
    },
});
