import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <div className="w-full max-w-7xl mx-auto">
        <Card className="w-full flex flex-col gap-3">
          <CardHeader>
            {props.data.title ? (
              <CardTitle>{props.data.title?.[props.language]}</CardTitle>
            ) : null}
            {props.data.description?.[props.language] ? (
              <TipTap value={props.data.description[props.language] || ""} />
            ) : null}
          </CardHeader>
          <CardContent>{props.children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
