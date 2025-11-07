import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable React Compiler for Cloudflare compatibility
  // reactCompiler: true,

  // Cloudflare-specific optimizations
  serverExternalPackages: ['ethers'],
};

export default nextConfig;
