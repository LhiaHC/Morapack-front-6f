import { env } from 'process';
import { createHash } from 'crypto';

// /** @type {import('next').NextConfig} */
// global.HTMLImageElement = typeof window === 'undefined' ? Object : window.HTMLImageElement

const nextConfig = {
    output: 'standalone',
    env: {
        NEXT_PUBLIC_MORAPACK_API_URL: "http://localhost:8081/api",
        //NEXT_PUBLIC_MORAPACK_API_URL: "http://ipMaquinaV/api",
        NEXT_PUBLIC_MORAPACK_WS_URL: "ws://localhost:8081/api",
        //NEXT_PUBLIC_MORAPACK_WS_URL: "ws://ipMaquinaV/api",
    },
    // Configuración para mejorar la carga de chunks
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        framework: {
                            chunks: 'all',
                            name: 'framework',
                            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
                            priority: 40,
                            enforce: true,
                        },
                        lib: {
                            test(module) {
                                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
                            },
                            name(module) {
                                const hash = createHash('sha1');
                                hash.update(module.identifier());
                                return hash.digest('hex').substring(0, 8);
                            },
                            priority: 30,
                            minChunks: 1,
                            reuseExistingChunk: true,
                        },
                        commons: {
                            name: 'commons',
                            minChunks: 2,
                            priority: 20,
                        },
                        shared: {
                            name(module, chunks) {
                                const hash = createHash('sha1');
                                hash.update(chunks.reduce((acc, chunk) => acc + chunk.name, ''));
                                return hash.digest('hex') + (isServer ? '_s' : '_c');
                            },
                            priority: 10,
                            minChunks: 2,
                            reuseExistingChunk: true,
                        },
                    },
                    maxInitialRequests: 25,
                    minSize: 20000,
                },
            };
        }
        return config;
    },
};

export default nextConfig;
