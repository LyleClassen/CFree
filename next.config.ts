import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // pdf-parse and @react-pdf/renderer rely on Node built-ins; keep them out of
  // the Server Components bundle so they use native require at runtime.
  serverExternalPackages: ["pdf-parse", "@react-pdf/renderer"],
}

export default nextConfig
