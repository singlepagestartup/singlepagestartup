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
      data-module="rbac"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col max-w-7xl mx-auto",
        props.data.className,
      )}
    >
      <Card className="w-full flex flex-col gap-3">
        <CardHeader>
          {props.data.title ? <CardTitle>{props.data.title}</CardTitle> : null}
          {props.data.description ? (
            <TipTap value={props.data.description} />
          ) : null}
        </CardHeader>
        <CardContent>{props.children}</CardContent>
      </Card>
    </div>
  );
}
