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
      attachments={props.attachments}
      isDirty={props.isDirty}
      isDeleting={props.isDeleting}
      isSaving={props.isSaving}
      mode={props.mode}
      needsReindex={props.needsReindex}
      retryIndexOnSave={props.retryIndexOnSave}
      saveBlocked={props.saveBlocked}
      onDraftChange={props.onDraftChange}
      onDelete={props.onDelete}
      onSave={props.onSave}
    />
  );
}
