import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const prismaDatasourceUrl = process.env.DATABASE_URL || env("DATABASE_URL");

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // Render and runtime use DATABASE_URL from environment variables.
        url: prismaDatasourceUrl,
    },
});
