import { withNx } from "@nx/next/plugins/with-nx.js";

const configuredNextApp = withNx({
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  logging: false,
});

export default async function nextConfig(phase, context) {
  const resolvedConfig =
    typeof configuredNextApp === "function"
      ? await configuredNextApp(phase, context)
      : configuredNextApp;

  const { eslint, ...nextConfigWithoutEslint } = resolvedConfig;

  return nextConfigWithoutEslint;
}
