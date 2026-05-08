/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // This maps your Vercel secret to a variable accessible in your code
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,  
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Allows the Razorpay popup to talk to your app
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;