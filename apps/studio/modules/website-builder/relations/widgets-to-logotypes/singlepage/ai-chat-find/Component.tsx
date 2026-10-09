import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
} from "../../../../../../workspace/utils/products/ai-chat-relations";
export interface IWidgetLogotypeRelation {
  id: string;
  widgetId: string;
  logotypeId: string;
  orderIndex: number;
}
export interface IFindProps extends ILocalFindProps<IWidgetLogotypeRelation> {
  children: (relations: IWidgetLogotypeRelation[]) => ReactNode;
}
export function Component(props: IFindProps) {
  const relations = findLocalRelations(props).sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  return <Fragment>{props.children(relations)}</Fragment>;
}
