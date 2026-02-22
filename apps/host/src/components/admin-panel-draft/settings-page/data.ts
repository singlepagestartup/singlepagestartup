export type TSettingsOperationConfig = {
  endpoint: string;
  method: "GET" | "POST";
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
};

export const settingsOperationConfigs: Record<
  string,
  TSettingsOperationConfig
> = {
  backendCacheClear: {
    endpoint: "/api/http-cache/clear",
    method: "GET",
    title: "Clear backend cache?",
    description:
      "The backend HTTP cache will be cleared immediately for all users.",
    confirmLabel: "Clear cache",
    successMessage: "Backend cache has been cleared.",
  },
  frontendRevalidate: {
    endpoint: "/api/revalidate?path=/&type=layout",
    method: "GET",
    title: "Revalidate frontend layout?",
    description:
      "Frontend layout revalidation will be triggered for the root path.",
    confirmLabel: "Revalidate",
    successMessage: "Frontend revalidation has been triggered.",
  },
};

export type TSettingsOperationKey = keyof typeof settingsOperationConfigs;
