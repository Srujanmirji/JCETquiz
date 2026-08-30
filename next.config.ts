import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // @react-pdf/renderer must stay external — it is not bundler-safe.
  serverExternalPackages: ["@react-pdf/renderer"],

  /**
   * pdfkit (under @react-pdf/renderer) loads its standard fonts by
   * constructing the path at runtime, so Next's static tracer never sees them
   * and Vercel omits them from the function bundle. The result is a
   * production-only failure:
   *
   *   Cannot find module '/var/task/node_modules/pdfkit/js/standard-fonts/Helvetica.cjs'
   *
   * Force both the font modules and the .afm metrics into every route that
   * renders a certificate. ~800 KB, well inside the function size limit.
   */
  outputFileTracingIncludes: {
    "/api/admin/certificates/**": [
      "./node_modules/pdfkit/js/standard-fonts/**",
      "./node_modules/pdfkit/js/data/**",
    ],
  },
}

export default nextConfig
