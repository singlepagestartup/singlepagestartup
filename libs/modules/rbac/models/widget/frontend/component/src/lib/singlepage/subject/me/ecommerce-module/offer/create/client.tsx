"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={
        <p className="p-4 text-sm text-muted-foreground">
          Sign in to create a seller offer.
        </p>
      }
    >
      {({ data, authenticated }) =>
        authenticated && data ? (
          <ChildComponent
            isServer={false}
            variant={props.variant}
            ecommerceModuleStoreId={props.ecommerceModuleStoreId}
            subjectId={data.id}
          />
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            Sign in to create a seller offer.
          </p>
        )
      }
    </Subject>
  );
}
