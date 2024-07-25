"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/sps-website-builder/models/hero-section-block/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/admin-table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  useEffect(() => {
    if (deleteEntity.data) {
      //
    }
  }, [deleteEntity.data]);

  return (
    <ParentComponent
      id={props.data.id}
      module="sps-website-builder"
      name="hero-section-block"
      adminForm={props.adminForm ? props.adminForm(props) : null}
      onDelete={() => {
        if (props.data?.id) {
          deleteEntity.mutate({ id: props.data.id });
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 pt-6">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Title</p>
          <p className="truncate">{props.data.title}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
