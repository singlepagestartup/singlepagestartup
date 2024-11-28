const { withNx } = require("@nx/next/plugins/with-nx");

const BACKEND_URL = process.env["BACKEND_URL"] || "http://localhost:3000";
const HOST_URL = process.env["HOST_URL"] || "http://localhost:3000";
const NEXT_PUBLIC_BACKEND_URL =
  process.env["NEXT_PUBLIC_BACKEND_URL"] || "http://localhost:3000";
const NEXT_PUBLIC_HOST_URL =
  process.env["NEXT_PUBLIC_HOST_URL"] || "http://localhost:3000";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.BUNDLE_ANALYZER === "true",
});

function makeConfig() {
  const nextPublicBackendHost = NEXT_PUBLIC_BACKEND_URL?.replace(
    "https://",
    "",
  ).replace("http://", "");
  const nextPublicFrontendHost = NEXT_PUBLIC_HOST_URL?.replace(
    "https://",
    "",
  ).replace("http://", "");
  const backendHost = BACKEND_URL?.replace("https://", "").replace(
    "http://",
    "",
  );
  const frontendHost = HOST_URL?.replace("https://", "").replace("http://", "");

  let config = {
    reactStrictMode: true,
    images: {
      unoptimized: true,
      domains: [
        "localhost",
        "127.0.0.1",
        backendHost,
        frontendHost,
        nextPublicBackendHost,
        nextPublicFrontendHost,
      ],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**.singlepagestartup.com",
        },
        {
          protocol: "https",
          hostname: "**.vercel.app",
        },
        {
          protocol: "https",
          hostname: "**.amazonaws.com",
        },
        {
          protocol: "https",
          hostname: "**.telebit.io",
        },
        { protocol: "https", hostname: "**.vercel-storage.com" },
      ],
    },
    async headers() {
      return [
        {
          // matching all API routes
          source: "/api/:path*",
          headers: [
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Origin", value: HOST_URL },
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
    experimental: {
      ppr: "incremental",
    },
    webpack: (config) => {
      config.externals.push("pino-pretty", "lokijs", "encoding");
      config.module.rules.push({
        test: /\.d\.ts$/,
        use: "ignore-loader",
      });
      config.module.rules.push({
        test: /\.map$/,
        use: "ignore-loader",
      });
      return config;
    },
    logging: false,
  };

  return withBundleAnalyzer(config);
}

const config = makeConfig();

module.exports = withNx(config);
