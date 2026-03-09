import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  outputFileTracingIncludes: {
    "/**": ["./app/generated/prisma/**"],
  },
  // Disable source maps in production to reduce build memory usage
  productionBrowserSourceMaps: false,
  ...(isProd && {
    compiler: {
      removeConsole: { exclude: ["error"] },
    },
  }),
};

export default nextConfig;
