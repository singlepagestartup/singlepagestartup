import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
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
  const language = props.language || internationalization.defaultLanguage.code;
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10",
        props.data.className,
        props.className,
      )}
    >
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className={cn("flex flex-col gap-6", props.className)}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {props.data.title?.[language]}
              </CardTitle>
              {props.data.subtitle ? (
                <CardDescription>
                  {props.data.subtitle?.[language]}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <Subject
                  isServer={false}
                  language={language}
                  className="rounded-none border-0 p-0 sm:p-0"
                  variant="authentication-email-and-password-reset-password-form-default"
                />
              </div>
            </CardContent>
          </Card>
          {props.data.description?.[language] ? (
            <TipTap
              value={props.data.description?.[language] || ""}
              className="text-center prose-sm"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
