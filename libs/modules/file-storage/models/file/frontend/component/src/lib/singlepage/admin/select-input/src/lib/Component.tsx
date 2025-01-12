"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { FormField } from "@sps/ui-adapter";
import Image from "next/image";
import { BACKEND_URL } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="file-storage"
      data-model="file"
      data-variant={props.variant}
      className={`${props.className || ""}`}
    >
      <FormField
        ui="shadcn"
        type="select"
        name={props.formFieldName}
        label="file"
        form={props.form}
        placeholder="Select file"
        options={props.data.map((entity) => {
          if (props.renderField && entity[props.renderField]) {
            const renderValue = entity[props.renderField];
            if (typeof renderValue === "string") {
              return [entity.id, renderValue];
            }
          }

          return [entity.id, <MiniImage {...entity} />];
        })}
      />
    </div>
  );
}

function MiniImage(props: IComponentPropsExtended["data"][0]) {
  const url = props.file.startsWith("http")
    ? props.file
    : `${BACKEND_URL}${props.file}`;

  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex h-10 w-10 relative flex-shrink-0">
        <Image src={url} alt="" fill={true} />
      </div>
      <p className="text-xs">{props.id}</p>
    </div>
  );
}
