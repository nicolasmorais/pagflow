import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://storage.googleapis.com https://cdn.taboola.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://www.google.com",
      "connect-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://region1.google-analytics.com https://graph.facebook.com https://vitals.vercel-insights.com https://cdn.taboola.com https://viacep.com.br",
      "media-src 'self' blob:",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
