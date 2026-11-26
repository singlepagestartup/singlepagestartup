export function criteria(fields: Record<string, string | boolean>) {
  return {
    params: {
      filters: {
        and: Object.entries(fields).map(([column, value]) => ({
          column,
          method: "eq" as const,
          value,
        })),
      },
    },
  };
}

export function inIds(
  column: string,
  values: Iterable<string>,
  fields: Record<string, string | boolean> = {},
) {
  return {
    params: {
      filters: {
        and: [
          ...criteria(fields).params.filters.and,
          { column, method: "inArray" as const, value: [...new Set(values)] },
        ],
      },
    },
  };
}
