/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'images.unsplash.com' },
			{ protocol: 'https', hostname: 'placehold.co' },
			{ protocol: 'https', hostname: 'picsum.photos' },
			{ protocol: 'https', hostname: 'images.pexels.com' },
		],
	},
	webpack: (config, { dev }) => {
		// Work around intermittent Windows chunk/vendored-module misses in dev.
		if (dev) {
			config.cache = false;
		}
		return config;
	},
};

export default nextConfig;
