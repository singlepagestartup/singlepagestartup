"use client";

import React, { useEffect, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { disconnect, signMessage } from "@wagmi/core";
import { ethereumVirtualMachine } from "@sps/shared-frontend-client-web3";
import { useCookies } from "react-cookie";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { cn } from "@sps/shared-frontend-client-utils";
import { useJwt } from "react-jwt";

const formSchema = z.object({
  message: z.string().min(8),
});

let signMessagePopupOpened = false;

export function Component(props: IComponentPropsExtended) {
  const ConnectWallet = ethereumVirtualMachine.ConnectWalletButton;
  const [cookies] = useCookies(["rbac.subject.jwt"]);
  const [isClient, setIsClient] = useState(false);
  const tokenDecoded = useJwt<{
    exp: number;
    iat: number;
    subject: { id: string };
  }>(cookies["rbac.subject.jwt"]);

  const authenticateEthereumVirtualMachine =
    api.authenticationEthereumVirtualMachine({});
  const logout = api.authenticationLogout({});
  const account = useAccount();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: Date.now().toString(),
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      if (!ethereumVirtualMachine.wagmiConfig?.default) {
        return;
      }

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
        data: {
          message: data.message,
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
    if (tokenDecoded.decodedToken?.subject?.id) {
      subjectsToIdentitiesApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: tokenDecoded.decodedToken.subject.id,
                },
              ],
            },
          },
        })
        .then((res) => {
          if (account.isConnected && !res?.length) {
            form.handleSubmit(onSubmit)();
          }
        });
    }
  }, [tokenDecoded.decodedToken, account.isConnected]);

  useEffect(() => {
    if (authenticateEthereumVirtualMachine.isError) {
      if (!ethereumVirtualMachine.wagmiConfig?.default) {
        return;
      }

      disconnect(ethereumVirtualMachine.wagmiConfig.default);
      return;
    }

    if (account.isConnected && !cookies["rbac.subject.jwt"]) {
      logoutAction();
    }
  }, [
    authenticateEthereumVirtualMachine.isError,
    cookies["rbac.subject.jwt"],
    account.isConnected,
  ]);

  useEffect(() => {
    if (authenticateEthereumVirtualMachine.status) {
      signMessagePopupOpened = false;
    }
  }, [authenticateEthereumVirtualMachine.status]);

  function logoutAction() {
    if (!ethereumVirtualMachine.wagmiConfig?.default) {
      return;
    }

    disconnect(ethereumVirtualMachine.wagmiConfig.default);
    logout.mutate({
      redirectTo: "/",
    });
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
          <ConnectWallet className="w-full" variant="default" />
        ) : (
          <Button variant="outline" onClick={logoutAction}>
            Logout
          </Button>
        )}
      </Form>
    </div>
  );
}
