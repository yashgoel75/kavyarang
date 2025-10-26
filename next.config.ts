import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'api.dicebear.com'],
  },
}

module.exports = nextConfig;
