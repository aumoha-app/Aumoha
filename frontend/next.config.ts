import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_AGORA_APP_ID: process.env.NEXT_PUBLIC_AGORA_APP_ID || process.env.AGORA_APP_ID || "",
  }
};

export default nextConfig;
