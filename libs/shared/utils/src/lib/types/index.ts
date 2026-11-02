export interface NextRequestOptions extends RequestInit {
  // Declared here rather than inherited: RequestInit carries `cache` only in the
  // DOM typings, and this type is also compiled against Bun's.
  cache?:
    | "default"
    | "force-cache"
    | "no-cache"
    | "no-store"
    | "only-if-cached"
    | "reload";
  next: {
    revalidate?: number;
    cache?: "force-cache" | "no-store";
    tags?: string[];
  };
}
