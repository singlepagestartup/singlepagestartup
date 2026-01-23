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
  const stripProtocol = (url) =>
    url.replace("https://", "").replace("http://", "");

  const apiServiceHost = stripProtocol(API_SERVICE_URL);
  const hostServiceHost = stripProtocol(HOST_SERVICE_URL);
  const nextPublicApiServiceHost = stripProtocol(NEXT_PUBLIC_API_SERVICE_URL);
  const nextPublicHostServiceHost = stripProtocol(NEXT_PUBLIC_HOST_SERVICE_URL);

  return withBundleAnalyzer({
    reactStrictMode: true,
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
          ],
        },
      ];
    },
    trailingSlash: false,
    webpack(config) {
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
    logging: false,
  });
}

export default withNx(makeConfig());
