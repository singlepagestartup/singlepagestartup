import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as EthereumVirtualMachineCreate } from "./actions/EthereumVirtualMachineCreate";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <div className="border rounded-lg py-5 px-10 flex items-center justify-center flex-col gap-4">
        <p>Create new identity</p>
        <EthereumVirtualMachineCreate
          isServer={props.isServer}
          variant={props.variant}
          data={props.data}
        />
      </div>
    </div>
  );
}
