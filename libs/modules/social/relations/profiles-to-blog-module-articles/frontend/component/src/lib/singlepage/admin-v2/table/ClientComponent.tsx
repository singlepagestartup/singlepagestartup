"use client";

import { useCallback } from "react";
import {
  Provider,
  api as clientApi,
} from "@sps/social/relations/profiles-to-blog-module-articles/sdk/client";
import { api as serverApi } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/server";
import { insertSchema } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";
import { Component as AdminForm } from "../form";

export function Component(props: IComponentProps) {
  const renderForm = useCallback<NonNullable<IComponentProps["adminForm"]>>(
    ({ data }) => (
      <AdminForm
        isServer={false}
        variant="admin-v2-form"
        data={data}
        defaultProfileId={props.defaultProfileId}
        defaultBlogModuleArticleId={props.defaultBlogModuleArticleId}
      />
    ),
    [props.defaultProfileId, props.defaultBlogModuleArticleId],
  );

  return (
    <ParentComponent
      {...props}
      isServer={false}
      module="social"
      name="profiles-to-blog-module-articles"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      adminForm={props.adminForm ?? renderForm}
    />
  );
}
