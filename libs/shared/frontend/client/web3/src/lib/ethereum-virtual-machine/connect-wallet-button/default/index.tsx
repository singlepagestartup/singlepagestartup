"use client";

import { useState } from "react";
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useEnsName,
} from "wagmi";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const [open, setOpen] = useState(false);
  const { address } = useConnection();
  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: Boolean(address) },
  });
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const close = () => setOpen(false);
  const label = address
    ? ensName || `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connect Wallet";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="default" className={props.className}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          {address ? "Connected wallet" : "Connect Wallet"}
        </DialogTitle>
        {address ? (
          <Button
            type="button"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate({}, { onSuccess: close })}
          >
            Disconnect
          </Button>
        ) : (
          connectors.map((connector) => (
            <Button
              key={connector.uid}
              type="button"
              disabled={connect.isPending}
              onClick={() =>
                connect.mutate({ connector }, { onSuccess: close })
              }
            >
              {connector.name}
            </Button>
          ))
        )}
        {connect.error && <p role="alert">{connect.error.message}</p>}
        {disconnect.error && <p role="alert">{disconnect.error.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
