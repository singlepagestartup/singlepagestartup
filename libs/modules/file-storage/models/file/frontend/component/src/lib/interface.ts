import { IComponentProps as ISpsLiteComponentProps } from "./singlepage/interface";
import { IComponentProps as IStartupComponentProps } from "./startup/interface";

export type IComponentProps = ISpsLiteComponentProps | IStartupComponentProps;
export type { IProtectedMediaProviderProps } from "./singlepage/authenticated-content/interface";
