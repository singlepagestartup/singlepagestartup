import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-relation="subjects-to-identities"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className="w-full py-10 text-center flex flex-col gap-1"
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Relation: subjects-to-identities</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
