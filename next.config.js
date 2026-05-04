/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'i.pinimg.com',
      'images.pexels.com',
      's3.amazonaws.com',
    ],
  },
  experimental: {
    optimizeCss: true,
  },
};

module.exports = withPWA(nextConfig);
