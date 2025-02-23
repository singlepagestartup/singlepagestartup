const { withNx } = require("@nx/next/plugins/with-nx");

const API_SERVICE_URL = process.env.API_SERVICE_URL || "http://localhost:4000";
const HOST_SERVICE_URL =
  process.env.HOST_SERVICE_URL || "http://localhost:3000";
const NEXT_PUBLIC_API_SERVICE_URL =
  process.env.NEXT_PUBLIC_API_SERVICE_URL || "http://localhost:4000";
const NEXT_PUBLIC_HOST_SERVICE_URL =
  process.env.NEXT_PUBLIC_HOST_SERVICE_URL || "http://localhost:3000";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
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
    images: {
      unoptimized: true,
      domains: [
        "localhost",
        "127.0.0.1",
        apiServiceHost,
        hostServiceHost,
        nextPublicApiServiceHost,
        nextPublicHostServiceHost,
      ],
      remotePatterns: [
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

module.exports = withNx(makeConfig());
