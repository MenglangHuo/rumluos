/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const rawTarget =
      process.env.API_INTERNAL_URL ||
      (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_BASE_URL
        : null) ||
      process.env.NEXT_PUBLIC_API_ENDPOINT ||
      "http://localhost:8080/api/v1"

    let target = rawTarget.trim()
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `http://${target}`
    }
    if (!target.endsWith("/api/v1") && !target.endsWith("/api/v1/")) {
      target = target.replace(/\/+$/, "") + "/api/v1"
    }
    target = target.replace(/\/+$/, "")
    console.log(`[Next.js Rewrite] Forwarding /api/v1 to ${target}`)

    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${target}/:path*`,
        },
      ],
    }
  },
}

export default nextConfig
