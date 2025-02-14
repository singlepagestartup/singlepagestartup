export interface NextRequestOptions extends RequestInit {
  next: {
    revalidate?: number;
    cache?: "force-cache" | "no-store";
    tags?: string[];
  };
}
