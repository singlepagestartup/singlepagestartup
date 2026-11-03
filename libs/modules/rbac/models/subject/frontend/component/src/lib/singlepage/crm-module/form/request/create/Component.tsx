import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      key={`${props.data.id}:${props.crmModuleForm.id}`}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      language={props.language}
      className={props.className}
      crmModuleForm={props.crmModuleForm}
    />
  );
}
