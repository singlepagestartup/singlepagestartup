import { Fragment, type ReactNode } from "react";
import {
  findLocalRelations,
  type ILocalFindProps,
  type ISubjectProfileRelation,
} from "../../../../../../workspace/utils/products/ai-chat-models";

export interface ISubjectProfilesProps
  extends ILocalFindProps<ISubjectProfileRelation> {
  children: (relations: ISubjectProfileRelation[]) => ReactNode;
}

export function SubjectProfiles(props: ISubjectProfilesProps) {
  return <Fragment>{props.children(findLocalRelations(props))}</Fragment>;
}
