import type { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      data={props.data}
      language={props.language}
      className={props.className}
      draft={props.draft}
      isDirty={props.isDirty}
      isDeleting={props.isDeleting}
      isReindexing={props.isReindexing}
      isSaving={props.isSaving}
      mode={props.mode}
      needsReindex={props.needsReindex}
      onDraftChange={props.onDraftChange}
      onUnlink={props.onUnlink}
      onDelete={props.onDelete}
      onReindex={props.onReindex}
      onSave={props.onSave}
    />
  );
}
