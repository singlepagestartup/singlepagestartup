import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
  type IProfileSourceRelation,
} from "../../../../../../workspace/utils/products/ai-chat-models";

export interface IProfileSourcesProps
  extends ILocalFindProps<IProfileSourceRelation> {
  children: (relations: IProfileSourceRelation[]) => ReactNode;
}

export function ProfileSources(props: IProfileSourcesProps) {
  return <Fragment>{props.children(findLocalRelations(props))}</Fragment>;
}
