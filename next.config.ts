import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  outputFileTracingIncludes: {
    "/**": ["./app/generated/prisma/**"],
  },
};

export default nextConfig;
