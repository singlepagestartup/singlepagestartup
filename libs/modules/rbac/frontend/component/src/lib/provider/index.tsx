"use client";

import { IComponentProps } from "./interface";
import { ethereumVirtualMachine } from "@sps/shared-frontend-client-web3";

export function Provider(props: IComponentProps) {
  const EthereumVirtualMachineProvider = ethereumVirtualMachine.Provider;

  return (
    <div data-module="rbac" data-variant="provider">
      {ethereumVirtualMachine.wagmiConfig.default ? (
        <EthereumVirtualMachineProvider
          variant="default"
          config={ethereumVirtualMachine.wagmiConfig.default}
        >
          {props.children}
        </EthereumVirtualMachineProvider>
      ) : (
        props.children
      )}
    </div>
  );
}
