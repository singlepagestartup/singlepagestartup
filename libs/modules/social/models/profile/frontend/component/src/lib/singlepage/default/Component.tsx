import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Card, CardHeader, CardTitle } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <Card
      data-module="social"
      data-model="profile"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <CardHeader>
        <CardTitle>{props.data.title?.[props.language]}</CardTitle>
      </CardHeader>
    </Card>
  );
}
