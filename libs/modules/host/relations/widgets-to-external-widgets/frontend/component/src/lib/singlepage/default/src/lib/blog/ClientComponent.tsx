"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as BlogWidget } from "@sps/blog/models/widget/frontend/component";

export function Component(
  props: ISpsComponentBase & {
    children?: React.ReactNode;
    widget: any;
  },
) {
  return (
    <RbacSubject
      isServer={false}
      hostUrl={props.hostUrl}
      variant="is-authorized-wrapper"
      apiProps={{
        params: {
          action: {
            method: "GET",
            route: "/api/blog/articles",
          },
        },
      }}
      fallback={<div className="p-5 bg-blue-400">Not authorized</div>}
    >
      <BlogWidget
        isServer={false}
        hostUrl={props.hostUrl}
        data={props.widget}
        variant={props.widget.variant as any}
      />
    </RbacSubject>
  );
}
