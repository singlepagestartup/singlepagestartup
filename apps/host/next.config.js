import { withNx } from "@nx/next/plugins/with-nx.js";
import bundleAnalyzer from "@next/bundle-analyzer";

const API_SERVICE_URL = process.env.API_SERVICE_URL || "http://localhost:4000";
const HOST_SERVICE_URL =
  process.env.HOST_SERVICE_URL || "http://localhost:3000";
const NEXT_PUBLIC_API_SERVICE_URL =
  process.env.NEXT_PUBLIC_API_SERVICE_URL || "http://localhost:4000";
const NEXT_PUBLIC_HOST_SERVICE_URL =
  process.env.NEXT_PUBLIC_HOST_SERVICE_URL || "http://localhost:3000";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.BUNDLE_ANALYZER === "true",
});

function makeConfig() {
  const turbopackMemoryMb = process.env.SPS_HOST_TURBOPACK_MEMORY_MB
    ? Number(process.env.SPS_HOST_TURBOPACK_MEMORY_MB)
    : undefined;
  if (
    turbopackMemoryMb !== undefined &&
    (!Number.isSafeInteger(turbopackMemoryMb) || turbopackMemoryMb <= 0)
  ) {
    throw new Error("SPS_HOST_TURBOPACK_MEMORY_MB must be a positive integer");
  }
  const stripProtocol = (url) =>
    url.replace("https://", "").replace("http://", "");

  const apiServiceHost = stripProtocol(API_SERVICE_URL);
  const hostServiceHost = stripProtocol(HOST_SERVICE_URL);
  const nextPublicApiServiceHost = stripProtocol(NEXT_PUBLIC_API_SERVICE_URL);
  const nextPublicHostServiceHost = stripProtocol(NEXT_PUBLIC_HOST_SERVICE_URL);

  return withBundleAnalyzer({
    reactStrictMode: true,
    distDir: process.env.SPS_HOST_DIST_DIR || ".next",
    experimental: {
      globalNotFound: true,
      webpackMemoryOptimizations: true,
      ...(process.env.SPS_HOST_BUILD_CPUS
        ? { cpus: Number(process.env.SPS_HOST_BUILD_CPUS) }
        : {}),

      // Release each compiler's heap before the next build stage.
      webpackBuildWorker: true,
      turbopackMemoryLimit:
        turbopackMemoryMb === undefined
          ? undefined
          : turbopackMemoryMb * 1024 * 1024,
    },
    // Preserve the public origin in locale redirects, including loopback hosts.
    skipMiddlewareUrlNormalize: true,
    // Keep canonical, robots and social metadata in the initial head for all
    // crawlers; metadata/page absence must be settled before streaming HTML.
    htmlLimitedBots: /.*/,
    deploymentId: process.env.NEXT_DEPLOYMENT_ID || undefined,
    staticPageGenerationTimeout: 6000,
    images: {
      unoptimized: true,
      remotePatterns: [
        { protocol: "http", hostname: "localhost" },
        { protocol: "https", hostname: "localhost" },
        { protocol: "http", hostname: "127.0.0.1" },
        { protocol: "https", hostname: "127.0.0.1" },
        { protocol: "http", hostname: apiServiceHost },
        { protocol: "https", hostname: apiServiceHost },
        { protocol: "http", hostname: hostServiceHost },
        { protocol: "https", hostname: hostServiceHost },
        { protocol: "http", hostname: nextPublicApiServiceHost },
        { protocol: "https", hostname: nextPublicApiServiceHost },
        { protocol: "http", hostname: nextPublicHostServiceHost },
        { protocol: "https", hostname: nextPublicHostServiceHost },
        { protocol: "https", hostname: "**.singlepagestartup.com" },
        { protocol: "https", hostname: "**.vercel.app" },
        { protocol: "https", hostname: "**.amazonaws.com" },
        { protocol: "https", hostname: "**.telebit.io" },
        { protocol: "https", hostname: "**.vercel-storage.com" },
      ],
    },
    async headers() {
      return [
        {
          source: "/api/:path*",
          headers: [
            { key: "Access-Control-Allow-Credentials", value: "true" },
            {
              key: "Access-Control-Allow-Origin",
              value: NEXT_PUBLIC_API_SERVICE_URL,
            },
            {
              key: "Access-Control-Allow-Methods",
              value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
            },
            {
              key: "Access-Control-Allow-Headers",
              value:
                "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Set-Cookie",
            },
            // Applied here so every future route under app/api inherits it
            // without restating it in the handler.
            { key: "X-Content-Type-Options", value: "nosniff" },
          ],
        },
      ];
    },
    trailingSlash: false,
    webpack(config) {
      if (process.env.SPS_HOST_WEBPACK_CACHE === "false") config.cache = false;
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              svgo: true,
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      });

      config.module.rules.push(
        { test: /\.d\.ts$/, use: "ignore-loader" },
        { test: /\.map$/, use: "ignore-loader" },
      );

      config.externals.push("pino-pretty", "lokijs", "encoding");

      return config;
    },
    // Specs are excluded from this app's tsconfig so Next does not compile
    // them, which leaves the build's bundled linter unable to parse them.
    // Linting runs as its own target (`nx run host:eslint:lint`), so the build
    // does not need to repeat it.
    eslint: {
      ignoreDuringBuilds: true,
    },
    logging: false,
  });
}

export default withNx(makeConfig());
