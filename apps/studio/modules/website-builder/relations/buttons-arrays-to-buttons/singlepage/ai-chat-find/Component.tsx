import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
} from "../../../../../../workspace/utils/products/ai-chat-relations";
export interface IButtonsArrayButtonRelation {
  id: string;
  buttonsArrayId: string;
  buttonId: string;
  orderIndex: number;
}
export interface IFindProps
  extends ILocalFindProps<IButtonsArrayButtonRelation> {
  children: (relations: IButtonsArrayButtonRelation[]) => ReactNode;
}
export function Component(props: IFindProps) {
  const relations = findLocalRelations(props).sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  return <Fragment>{props.children(relations)}</Fragment>;
}
