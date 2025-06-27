import {
  NEXT_PUBLIC_HOST_METADATA_DESCRIPTION,
  NEXT_PUBLIC_HOST_METADATA_ICON,
  NEXT_PUBLIC_HOST_METADATA_TITLE,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  WALLET_CONNECT_PROJECT_ID,
} from "@sps/shared-utils";
import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

import { injected, walletConnect, safe } from "wagmi/connectors";

const metadata = {
  name: NEXT_PUBLIC_HOST_METADATA_TITLE,
  url: NEXT_PUBLIC_HOST_SERVICE_URL,
  icons: [`${NEXT_PUBLIC_HOST_SERVICE_URL}${NEXT_PUBLIC_HOST_METADATA_ICON}`],
  description: NEXT_PUBLIC_HOST_METADATA_DESCRIPTION,
};

export const config = WALLET_CONNECT_PROJECT_ID
  ? createConfig({
      chains: [mainnet, sepolia],
      connectors: [
        injected(),
        safe(),
        walletConnect({
          projectId: WALLET_CONNECT_PROJECT_ID,
          showQrModal: false,
          metadata,
        }),
      ],
      ssr: true,
      transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
      },
    })
  : null;
