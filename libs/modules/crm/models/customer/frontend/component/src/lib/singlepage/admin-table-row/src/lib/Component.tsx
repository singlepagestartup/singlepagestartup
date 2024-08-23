"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/crm/models/customer/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      id={props.data.id}
      module="website-builder"
      name="customer"
      adminForm={props.adminForm ? props.adminForm(props) : null}
      onDelete={() => {
        if (props.data?.id) {
          deleteEntity.mutate({ id: props.data.id });
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 pt-6">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">First Name</p>
          <p className="truncate">{props.data.firstName}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Last Name</p>
          <p className="truncate">{props.data.lastName}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="truncate">{props.data.phone}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="truncate">{props.data.email}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
