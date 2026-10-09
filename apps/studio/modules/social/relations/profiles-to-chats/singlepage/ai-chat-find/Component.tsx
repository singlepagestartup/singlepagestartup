import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
  type IProfileChatRelation,
} from "../../../../../../workspace/utils/products/ai-chat-models";

export interface IProfileChatsProps
  extends ILocalFindProps<IProfileChatRelation> {
  children: (relations: IProfileChatRelation[]) => ReactNode;
}

export function Component(props: IProfileChatsProps) {
  return <Fragment>{props.children(findLocalRelations(props))}</Fragment>;
}
