import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
