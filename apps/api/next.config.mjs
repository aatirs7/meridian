/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared package is shipped as TypeScript source (no build step), so Next
  // must transpile it like first-party code.
  transpilePackages: ["@meridian/shared"],
};

export default nextConfig;
