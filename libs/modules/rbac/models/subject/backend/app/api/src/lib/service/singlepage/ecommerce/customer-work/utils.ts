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
