"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { userStories } from "@sps/shared-configuration";
import { IComponentPropsExtended } from "./interface";
import { Component as AuthenticationEmailAndPasswordAuthenticationFormDefault } from "../email-and-password/authentication-form-default";
import { Component as AuthenticationEthereumVirtualMachineDefault } from "../ethereum-virtual-machine-default";

type TAuthProvider = "email" | "evm";

const oauthErrors: Record<string, string> = {
  oauth_provider_error: "OAuth provider returned an error.",
  invalid_oauth_callback: "OAuth callback is invalid.",
  invalid_oauth_state: "OAuth state is invalid.",
  invalid_oauth_state_type: "OAuth state type is invalid.",
  invalid_oauth_state_provider: "OAuth provider mismatch.",
  invalid_oauth_state_flow: "OAuth flow is invalid.",
  oauth_state_consumed: "OAuth state is already consumed.",
  oauth_state_expired: "OAuth state is expired.",
  oauth_profile_failed: "Unable to read OAuth profile.",
  oauth_link_requires_subject: "OAuth link flow requires authenticated user.",
  oauth_identity_already_linked: "OAuth identity is already linked.",
  oauth_target_subject_not_found: "OAuth target subject not found.",
  unsupported_provider: "OAuth provider is not supported.",
};

function getOAuthErrorText(errorCode?: string | null) {
  if (!errorCode) {
    return "";
  }

  return oauthErrors[errorCode] || `OAuth error: ${errorCode}`;
}

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedCodeRef = useRef<string | null>(null);
  const [provider, setProvider] = useState<TAuthProvider>("email");
  const [localError, setLocalError] = useState("");
  const oauthError = searchParams.get("oauthError");
  const oauthCode = searchParams.get("code");

  const oauthStart = api.authenticationOAuthStart({});
  const oauthExchange = api.authenticationOAuthExchange({
    mute: true,
  });
  const oauthExchangeMutate = oauthExchange.mutate;

  useEffect(() => {
    if (!oauthCode || processedCodeRef.current === oauthCode) {
      return;
    }

    processedCodeRef.current = oauthCode;

    oauthExchangeMutate({
      data: {
        code: oauthCode,
      },
    });
  }, [oauthCode, oauthExchangeMutate]);

  useEffect(() => {
    if (!oauthExchange.isSuccess) {
      return;
    }

    router.replace(userStories.subjectAuthentication.redirect.success);
  }, [oauthExchange.isSuccess, router]);

  useEffect(() => {
    if (!oauthExchange.isError) {
      return;
    }

    setLocalError("OAuth exchange failed. Please try again.");
  }, [oauthExchange.isError]);

  async function loginWithGoogle() {
    setLocalError("");

    try {
      const res = await oauthStart.mutateAsync({
        provider: "google",
        data: {
          flow: "signin",
          redirectTo: "/rbac/subject/authentication/select-method",
        },
      });

      if (typeof window !== "undefined") {
        window.location.href = res.authorizationUrl;
      }
    } catch {
      setLocalError("Unable to start OAuth login. Please try again.");
    }
  }

  const errorText = getOAuthErrorText(oauthError) || localError;

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-4", props.className)}
    >
      <div className="grid grid-cols-1 gap-2">
        <Button
          variant={provider === "email" ? "default" : "outline"}
          onClick={() => setProvider("email")}
          disabled={oauthStart.isPending || oauthExchange.isPending}
          type="button"
        >
          Login and Password
        </Button>
        <Button
          variant={provider === "evm" ? "default" : "outline"}
          onClick={() => setProvider("evm")}
          disabled={oauthStart.isPending || oauthExchange.isPending}
          type="button"
        >
          Ethereum Virtual Machine
        </Button>
        <Button
          variant="outline"
          onClick={loginWithGoogle}
          disabled={oauthStart.isPending || oauthExchange.isPending}
          type="button"
        >
          Continue with Google
        </Button>
      </div>

      {oauthExchange.isPending ? (
        <div className="text-sm text-muted-foreground">
          Completing OAuth login...
        </div>
      ) : null}

      {errorText ? (
        <div className="text-sm text-destructive">
          {errorText}{" "}
          <Link
            className="underline"
            href="/rbac/subject/authentication/select-method"
          >
            Back to login
          </Link>
        </div>
      ) : null}

      {provider === "email" ? (
        <AuthenticationEmailAndPasswordAuthenticationFormDefault
          isServer={false}
          variant="authentication-email-and-password-authentication-form-default"
        />
      ) : null}

      {provider === "evm" ? (
        <AuthenticationEthereumVirtualMachineDefault
          isServer={false}
          variant="authentication-ethereum-virtual-machine-default"
        />
      ) : null}
    </div>
  );
}
