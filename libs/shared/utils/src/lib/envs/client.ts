export const REACT_QUERY_MAX_CONCURRENT_QUERIES =
  parseInt(
    process.env.NEXT_PUBLIC_REACT_QUERY_MAX_CONCURRENT_QUERIES as string,
  ) || 5;
