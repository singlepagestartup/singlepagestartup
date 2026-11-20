import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  const title =
    props.data.title?.[props.language]?.trim() ||
    Object.values(props.data.title ?? {}).find((value) => value?.trim()) ||
    props.data.adminTitle?.trim() ||
    props.data.slug;
  return (
    <Card
      data-module="ecommerce"
      data-model="store"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  );
}
