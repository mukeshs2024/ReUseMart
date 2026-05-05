import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'placehold.co' },
            { protocol: 'https', hostname: 'picsum.photos' },
            { protocol: 'https', hostname: 'images.pexels.com' },
        ],
    },
    webpack: (config, { dev }) => {
        // Keep dev stable on Windows where filesystem cache can intermittently
        // reference stale/missing server chunks.
        if (dev) {
            config.cache = false
        }
        return config
    },
}

export default nextConfig
