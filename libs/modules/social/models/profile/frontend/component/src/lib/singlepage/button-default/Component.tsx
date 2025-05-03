import { Button } from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <Button
      data-module="social"
      data-model="profile"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className="w-fit"
      variant="outline"
      size="sm"
    >
      {props.data.slug}
    </Button>
  );
}
