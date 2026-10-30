import { api as crudApi } from "./crud";
import {
  action as generate,
  generatePageSeo,
  resolvePageSeo,
} from "./actions/generate";

export type { IGeneratePageSeoProps, IPageSeoResult } from "./actions/generate";

export type IProps = {};

export type IResult = {};

export const api = {
  ...crudApi,
  generate,
  generatePageSeo,
  resolvePageSeo,
};
