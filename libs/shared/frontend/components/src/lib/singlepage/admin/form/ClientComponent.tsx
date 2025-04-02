"use client";

import {
  Form,
  Card,
  CardContent,
  Button,
  CardFooter,
  CardHeader,
} from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended, IComponentProps } from "./interface";
import { UseFormReturn } from "react-hook-form";
import { ReactNode } from "react";

export function Component<M extends { id: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>> & {
    id?: string;
    module: string;
    form: UseFormReturn<any>;
    name: string;
    children: ReactNode;
    onSubmit: (data: any) => void;
    type?: "model" | "relation";
    status?: "idle" | "pending" | "success" | "error";
  },
) {
  return (
    <div
      data-module={props.module}
      data-id={props.id || ""}
      data-variant={props.variant}
      className={props.className || ""}
      {...(props.type === "relation"
        ? {
            "data-relation": props.name,
          }
        : {
            "data-model": props.name,
          })}
    >
      <Form {...props.form}>
        <Card>
          <CardHeader className="text-lg font-semibold">
            {props?.id ? "Update" : "Create"} {props.name}
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pb-10">
            {props.children}
          </CardContent>
          <CardFooter>
            <Button
              variant="primary"
              onClick={props.form.handleSubmit(props.onSubmit)}
              disabled={props.status === "pending"}
              className={
                props.status === "success"
                  ? "bg-green-500"
                  : props.status === "error"
                    ? "bg-red-500"
                    : ""
              }
            >
              {props.status === "pending"
                ? "Loading..."
                : props?.id
                  ? "Update"
                  : "Create"}
            </Button>
          </CardFooter>
        </Card>
      </Form>
    </div>
  );
}
