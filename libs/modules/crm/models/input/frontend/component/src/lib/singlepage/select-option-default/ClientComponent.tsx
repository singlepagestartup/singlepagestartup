"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";
import { ReactNode, useEffect } from "react";
import { IModel as IOption } from "@sps/crm/models/option/sdk/model";

export function Component(
  props: IComponentPropsExtended & {
    options: [
      IOption,
      string,
      ReactNode | ((props: any) => ReactNode | undefined),
    ][];
  },
) {
  useEffect(() => {
    props.form.setValue(`${props.path}id`, props.data.id);
    props.form.setValue(`${props.path}slug`, props.data.slug);
    props.form.setValue(`${props.path}adminTitle`, props.data.adminTitle);
    props.form.setValue(`${props.path}className`, props.data.className);
    props.form.setValue(`${props.path}description`, props.data.description);
    props.form.setValue(`${props.path}isRequired`, props.data.isRequired);
    props.form.setValue(`${props.path}label`, props.data.label);
    props.form.setValue(`${props.path}placeholder`, props.data.placeholder);
    props.form.setValue(`${props.path}title`, props.data.title);
    props.form.setValue(`${props.path}subtitle`, props.data.subtitle);
    props.form.setValue(`${props.path}type`, props.data.type);
    props.form.setValue(`${props.path}variant`, props.data.variant);
    props.form.setValue(`${props.path}string`, "");
    props.form.setValue(`${props.path}number`, undefined);
    props.form.setValue(`${props.path}boolean`, undefined);
    props.form.setValue(`${props.path}option`, undefined);
    props.form.setValue(`${props.path}file`, undefined);
  }, [props.path]);

  return (
    <FormField
      ui="shadcn"
      data-module="crm"
      data-model="input"
      type="select"
      label={props.data.label?.[props.language] ?? ""}
      name={`${props.path}option`}
      form={props.form}
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      placeholder={props.data.placeholder?.[props.language] ?? ""}
      options={props.options}
      className={cn(
        "flex w-full flex-col",
        props.data.className,
        props.className,
      )}
    />
  );
}
