import { IComponentPropsExtended, IComponentProps } from "./interface";
import { UseFormReturn } from "react-hook-form";
import { ReactNode } from "react";
import { Component as ClientComponent } from "./ClientComponent";

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
  return <ClientComponent {...props} />;
}
