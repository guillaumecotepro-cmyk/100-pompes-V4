/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Permissions-Policy', value: 'camera=self, gyroscope=self, accelerometer=self' },
      ],
    },
  ],
}
module.exports = nextConfig
