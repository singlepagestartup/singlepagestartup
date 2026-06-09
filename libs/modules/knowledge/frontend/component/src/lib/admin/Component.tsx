import { Component as EditSuggestion } from "./edit-suggestion/Component";

import { Component as Document } from "./document/Component";

import { Component as Chunk } from "./chunk/Component";

import { Component as Source } from "./source/Component";

import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "edit-suggestion",
      Comp: EditSuggestion,
    },
    {
      name: "document",
      Comp: Document,
    },
    {
      name: "chunk",
      Comp: Chunk,
    },
    {
      name: "source",
      Comp: Source,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="knowledge"
    />
  );
}
