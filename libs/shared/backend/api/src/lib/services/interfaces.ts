import { QueryBuilderFilterMethods } from "../configuration";

export type QueryBuilderFilterValue =
  | string
  | Date
  | number
  | boolean
  | [number, number]
  | Array<string | Date | number | boolean>;

export interface FindServiceProps {
  params?: {
    filters?: {
      and: {
        column: string;
        method: keyof QueryBuilderFilterMethods;
        value: QueryBuilderFilterValue;
      }[];
    };
    orderBy?: {
      and: {
        column: string;
        method: "asc" | "desc";
      }[];
    };
    offset?: number;
    limit?: number;
  };
}

export interface FindByIdServiceProps {
  id: string;
  params?: {
    populate: any;
  };
}
