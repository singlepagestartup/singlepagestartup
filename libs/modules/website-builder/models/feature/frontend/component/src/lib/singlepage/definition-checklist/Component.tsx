import { memo } from "react";
import { Presentation } from "../definition-card/Component";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo<IComponentPropsExtended>(
  function Component(props) {
    return (
      <Presentation
        data={props.data}
        isServer={props.isServer}
        language={props.language}
        className={props.className}
        children={props.children}
        variant="definition-checklist"
        appearance="checklist"
      />
    );
  },
);
