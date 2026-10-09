import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
} from "../../../../../../workspace/utils/products/ai-chat-models";
import type { IThreadMessageRelation } from "../../../../../../workspace/utils/products/ai-chat-threads";
export interface IThreadMessagesProps
  extends ILocalFindProps<IThreadMessageRelation> {
  children: (relations: IThreadMessageRelation[]) => ReactNode;
}
export function Component(props: IThreadMessagesProps) {
  return <Fragment>{props.children(findLocalRelations(props))}</Fragment>;
}
