"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  try {
    const data = await subjectApi.identityFind({
      id: props.data.id,
      options: {
        ...props.apiProps?.options,
        next: { ...props.apiProps?.options?.next, revalidate: 0 },
      },
    });
    return (
      <ChildComponent
        {...props}
        identitiesRead={{ data, isPending: false, isError: false }}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        identitiesRead={{
          isPending: false,
          isError: true,
          error: {
            message:
              error instanceof Error
                ? error.message
                : "Data could not be loaded.",
          },
        }}
      />
    );
  }
}
