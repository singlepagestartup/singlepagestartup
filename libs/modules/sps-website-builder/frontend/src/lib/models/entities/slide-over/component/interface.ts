import type { IEntity as IBackendPage } from "@sps/sps-website-builder-contracts-extended/lib/models/page/interfaces";
import { Dispatch, SetStateAction } from "react";
import { IModelExtended } from "../_model";

export interface IComponentProps {
  isServer: false;
  showSkeletons?: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isOpen: boolean;
  page?: IBackendPage;
}
export interface IComponentPropsExtended
  extends IComponentProps,
    IModelExtended {}
