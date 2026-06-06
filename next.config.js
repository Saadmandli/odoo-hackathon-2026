/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "bcryptjs", "nodemailer"],
  },
};
module.exports = nextConfig;
