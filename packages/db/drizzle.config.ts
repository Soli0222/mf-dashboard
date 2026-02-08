import { defineConfig } from "drizzle-kit";

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = process.env.POSTGRES_USER ?? "mf";
  const password = process.env.POSTGRES_PASSWORD ?? "mf";
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const db = process.env.POSTGRES_DB ?? "mf_dashboard";
  return `postgresql://${user}:${password}@${host}:${port}/${db}`;
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: buildDatabaseUrl(),
  },
});
