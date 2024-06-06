import { IComponentPropsExtended } from "./interface";
import { FormField } from "@sps/ui-adapter";

export function Component(props: IComponentPropsExtended) {
  return (
    <FormField
      {...props.data}
      data-module="sps-crm"
      data-model="elements.input"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      ui="shadcn"
      label={props.data.label || undefined}
      type="range"
    />
  );
}
