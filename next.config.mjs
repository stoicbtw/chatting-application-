/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.klipy.com" },
      { protocol: "https", hostname: "static.klipy.com" },
    ],
  },
};

export default nextConfig;
