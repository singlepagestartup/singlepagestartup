export interface ILocalFindProps<T> {
  variant: "find";
  data: T[];
  apiProps: {
    params: {
      filters: {
        and: {
          column: keyof T;
          method: "eq" | "in";
          value: string | string[];
        }[];
      };
    };
  };
}

export function findLocalRelations<T>(props: ILocalFindProps<T>): T[] {
  // An empty filter must not expose records from other profiles or subjects.
  const filters = props.apiProps.params.filters.and;
  if (!filters.length) return [];
  return props.data.filter((record) =>
    filters.every(({ column, method, value }) =>
      method === "in"
        ? Array.isArray(value) && value.includes(String(record[column]))
        : record[column] === value,
    ),
  );
}
