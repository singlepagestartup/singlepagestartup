import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
} from "../../../../../../workspace/utils/products/ai-chat-models";
import type { IChatThreadRelation } from "../../../../../../workspace/utils/products/ai-chat-threads";
export interface IChatThreadsProps
  extends ILocalFindProps<IChatThreadRelation> {
  children: (relations: IChatThreadRelation[]) => ReactNode;
}
export function ChatThreads(props: IChatThreadsProps) {
  return <Fragment>{props.children(findLocalRelations(props))}</Fragment>;
}
