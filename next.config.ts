import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "puppeteer-core", "@sparticuz/chromium-min"],
};

export default nextConfig;
