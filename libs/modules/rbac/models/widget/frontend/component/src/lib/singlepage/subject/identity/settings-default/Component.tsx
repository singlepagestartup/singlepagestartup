import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col max-w-7xl mx-auto", props.className)}
    >
      <Card className="w-full flex flex-col gap-3">
        <CardHeader>
          {props.data.title ? <CardTitle>{props.data.title}</CardTitle> : null}
          {props.data.description ? (
            <TipTap value={props.data.description} />
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="w-full grid grid-cols-4 py-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Provider</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Information</p>
            </div>
          </div>
          {props.children}
        </CardContent>
      </Card>
    </div>
  );
}
