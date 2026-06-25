/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.tenor.com" },
      { protocol: "https", hostname: "media.tenor.com" },
    ],
  },
};

export default nextConfig;
