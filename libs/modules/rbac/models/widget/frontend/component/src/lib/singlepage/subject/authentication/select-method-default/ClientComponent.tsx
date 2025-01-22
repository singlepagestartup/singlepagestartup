"use client";

import { IComponentPropsExtended } from "./interface";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Component(props: IComponentPropsExtended) {
  const [provider, setProvider] = useState<
    | "authentication-email-and-password-authentication-form-default"
    | "authentication-ethereum-virtual-machine-default"
  >("authentication-email-and-password-authentication-form-default");

  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10",
        props.className,
      )}
    >
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </Link>
        <div className={cn("flex flex-col gap-6", props.className)}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{props.data.title}</CardTitle>
              {props.data.subtitle ? (
                <CardDescription>{props.data.subtitle}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  {provider !==
                  "authentication-email-and-password-authentication-form-default" ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setProvider(
                          "authentication-email-and-password-authentication-form-default",
                        )
                      }
                    >
                      Login and Password
                    </Button>
                  ) : null}
                  {provider !==
                  "authentication-ethereum-virtual-machine-default" ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setProvider(
                          "authentication-ethereum-virtual-machine-default",
                        )
                      }
                    >
                      Ethereum Virtual Machine
                    </Button>
                  ) : null}
                </div>
                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
                <Subject isServer={false} variant={provider} />
              </div>
            </CardContent>
          </Card>
          {props.data.description ? (
            <TipTap
              value={props.data.description}
              className="text-center prose-sm"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
