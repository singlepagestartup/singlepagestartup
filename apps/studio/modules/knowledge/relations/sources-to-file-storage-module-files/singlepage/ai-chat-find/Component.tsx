import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
  type ISourceFileRelation,
} from "../../../../../../workspace/utils/products/ai-chat-models";
export interface ISourceFilesProps
  extends ILocalFindProps<ISourceFileRelation> {
  children: (relations: ISourceFileRelation[]) => ReactNode;
}
export function Component(props: ISourceFilesProps) {
  return <Fragment>{props.children(findLocalRelations(props))}</Fragment>;
}
