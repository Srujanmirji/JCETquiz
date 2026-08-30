import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer must stay external — it is not bundler-safe.
  serverExternalPackages: ["@react-pdf/renderer"],
}

export default nextConfig
