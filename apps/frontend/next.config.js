const { withNx } = require("@nx/next/plugins/with-nx");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

function makeConfig() {
  const serverEnvironment = process.env.SERVER_ENVIRONMENT;

  const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(
    "https://",
    "",
  ).replace("http://", "");
  const frontendHost = process.env.NEXT_PUBLIC_FRONTEND_URL?.replace(
    "https://",
    "",
  ).replace("http://", "");

  let config = {
    reactStrictMode: false,
    compress: true,
    images: {
      unoptimized: true,
      domains: [
        "vercel.app",
        "tailwindui.com",
        "images.unsplash.com",
        "unsplash.com",
        "localhost",
        "127.0.0.1",
        backendHost,
        frontendHost,
      ],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**.singlepagestartup.com",
        },
        {
          protocol: "https",
          hostname: "**.selcdn.ru",
        },
        {
          protocol: "https",
          hostname: "**.amazonaws.com",
        },
      ],
    },
  };

  if (serverEnvironment === "icp") {
    config.output = "export";
  }

  return withBundleAnalyzer(config);
}

const config = makeConfig();

module.exports = withNx(config);
