import {
  NEXT_PUBLIC_HOST_METADATA_DESCRIPTION,
  NEXT_PUBLIC_HOST_METADATA_ICON,
  NEXT_PUBLIC_HOST_METADATA_TITLE,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  WALLET_CONNECT_PROJECT_ID,
} from "@sps/shared-utils";
import { http, createConfig, type Config, type CreateConnectorFn } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

import { injected } from "wagmi/connectors/injected";
import { safe } from "wagmi/connectors/safe";
import { walletConnect } from "wagmi/connectors/walletConnect";

const metadata = {
  name: NEXT_PUBLIC_HOST_METADATA_TITLE,
  url: NEXT_PUBLIC_HOST_SERVICE_URL,
  icons: [`${NEXT_PUBLIC_HOST_SERVICE_URL}${NEXT_PUBLIC_HOST_METADATA_ICON}`],
  description: NEXT_PUBLIC_HOST_METADATA_DESCRIPTION,
};

const connectors: CreateConnectorFn[] = [injected(), safe()];

if (WALLET_CONNECT_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: WALLET_CONNECT_PROJECT_ID,
      showQrModal: true,
      metadata,
    }),
  );
}

export const config: Config<readonly [typeof mainnet, typeof sepolia]> =
  createConfig({
    chains: [mainnet, sepolia],
    connectors,
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  });
