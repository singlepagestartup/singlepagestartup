"use client";

import {
  api as parentApi,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "../singlepage/singlepage";
export { Provider, queryClient } from "../singlepage/singlepage";

export type IProps = IParentProps & {};

export type IResult = IParentResult & {};

export const api = parentApi;
