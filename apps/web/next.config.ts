import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

const rootEnvPath = join(import.meta.dirname, "../../.env");

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
