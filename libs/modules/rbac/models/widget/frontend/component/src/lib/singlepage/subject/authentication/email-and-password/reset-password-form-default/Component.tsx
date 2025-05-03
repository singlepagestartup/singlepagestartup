import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import Link from "next/link";
import { GalleryVerticalEnd } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
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
              <CardTitle className="text-xl">
                {props.data.title?.[internationalization.defaultLanguage.code]}
              </CardTitle>
              {props.data.subtitle ? (
                <CardDescription>
                  {
                    props.data.subtitle?.[
                      internationalization.defaultLanguage.code
                    ]
                  }
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <Subject
                  isServer={false}
                  variant="authentication-email-and-password-reset-password-form-default"
                />
              </div>
            </CardContent>
          </Card>
          {props.data.description?.[
            internationalization.defaultLanguage.code
          ] ? (
            <TipTap
              value={
                props.data.description?.[
                  internationalization.defaultLanguage.code
                ] || ""
              }
              className="text-center prose-sm"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
