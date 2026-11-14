import { config as defaultConfig } from "./default";

export const wagmiConfig: { default: typeof defaultConfig } = {
  default: defaultConfig,
};

declare module "wagmi" {
  interface Register {
    config: (typeof wagmiConfig)[keyof typeof wagmiConfig];
  }
}
