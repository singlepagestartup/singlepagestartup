"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  try {
    const data = await subjectApi.socialModuleProfileFind({
      id: props.data.id,
      params: {
        filters: {
          and: [{ column: "variant", method: "eq", value: "default" }],
        },
      },
      options: props.apiProps?.options,
    });
    return (
      <ChildComponent
        {...props}
        profilesRead={{ data, isPending: false, isError: false }}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        profilesRead={{
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
