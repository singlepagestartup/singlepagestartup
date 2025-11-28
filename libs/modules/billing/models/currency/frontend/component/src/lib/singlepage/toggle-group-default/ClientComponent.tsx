"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { FormField } from "@sps/ui-adapter";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="billing"
      data-model="currency"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <FormField
        ui="shadcn"
        type="toggle-group"
        label={props.label}
        name={props.formFieldName}
        form={props.form}
        options={props.data.map((entity) => [entity.id, entity.symbol])}
      />
    </div>
  );
}
