"use client";

import {
  api as parentApi,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "../singlepage";
export {
  AUTHENTICATION_STORAGE_EVENT,
  Provider,
  clearAuthenticationTokens,
  persistAuthenticationTokens,
  queryClient,
} from "../singlepage";

export type IProps = IParentProps & {};

export type IResult = IParentResult & {};

export const api = parentApi;
