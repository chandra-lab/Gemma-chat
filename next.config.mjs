/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // We don't ship an ESLint config in this starter, so don't block builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
