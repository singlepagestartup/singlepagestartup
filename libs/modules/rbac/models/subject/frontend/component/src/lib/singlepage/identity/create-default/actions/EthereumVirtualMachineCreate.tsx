"use client";

import React, { useEffect, useState } from "react";
import { IComponentPropsExtended } from "../interface";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { disconnect, signMessage } from "@wagmi/core";
import { ethereumVirtualMachine } from "@sps/shared-frontend-client-web3";
import { cn } from "@sps/shared-frontend-client-utils";

const formSchema = z.object({
  message: z.string().min(8),
  provider: z.string(),
});

let signMessagePopupOpened = false;

export function Component(props: IComponentPropsExtended) {
  const ConnectWallet = ethereumVirtualMachine.ConnectWalletButton;
  const [isClient, setIsClient] = useState(false);

  const authenticateEthereumVirtualMachine = api.identityCreate({});
  const account = useAccount();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: Date.now().toString(),
      provider: "ethereum-virtual-machine",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      if (!account?.address) {
        toast.error("No account found");
        return;
      }

      if (
        signMessagePopupOpened ||
        authenticateEthereumVirtualMachine.status !== "idle"
      ) {
        return;
      }

      signMessagePopupOpened = true;

      const signedMessage = await signMessage(
        ethereumVirtualMachine.wagmiConfig.default,
        {
          message: data.message,
        },
      );

      authenticateEthereumVirtualMachine.mutate({
        id: props.data.id,
        data: {
          ...data,
          signature: signedMessage,
          address: account.address,
        },
      });
    } catch (error: any) {
      toast.error("An error occurred:" + error.message);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (authenticateEthereumVirtualMachine.isError && account.isConnected) {
      disconnect(ethereumVirtualMachine.wagmiConfig.default);
      return;
    }
  }, [authenticateEthereumVirtualMachine.isError, account.isConnected]);

  useEffect(() => {
    if (authenticateEthereumVirtualMachine.status) {
      signMessagePopupOpened = false;
    }
  }, [authenticateEthereumVirtualMachine.status]);

  function logoutAction() {
    disconnect(ethereumVirtualMachine.wagmiConfig.default);
  }

  if (!isClient) {
    return null;
  }

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
        {!account.isConnected ? (
          <ConnectWallet className="w-full lg:w-fit" variant="default" />
        ) : (
          <>
            <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
              Attach {account.address}
            </Button>
            <Button variant="outline" onClick={logoutAction}>
              Logout
            </Button>
          </>
        )}
      </Form>
    </div>
  );
}
