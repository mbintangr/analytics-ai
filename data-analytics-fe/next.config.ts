import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  serverExternalPackages: ["better-auth", "prisma", "@prisma/client"],
};

export default nextConfig;
