import { QueryBuilderFilterMethods } from "../configuration";

export type QueryBuilderFilterValue =
  | string
  | Date
  | number
  | boolean
  | [number, number]
  | Array<string | Date | number | boolean>;

interface IQueryBuilderFilter {
  column: string;
  method: keyof QueryBuilderFilterMethods;
  value: QueryBuilderFilterValue;
}

interface IQueryBuilderNullFilter {
  column: string;
  method: "isNull" | "isNotNull";
  value: null;
}

export interface FindServiceProps {
  params?: {
    filters?: {
      and: (IQueryBuilderFilter | IQueryBuilderNullFilter)[];
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
