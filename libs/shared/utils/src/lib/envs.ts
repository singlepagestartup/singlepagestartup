export const BACKEND_URL =
  process.env["NEXT_PUBLIC_BACKEND_URL"] || "http://localhost:3000";
export const HOST_URL =
  process.env["NEXT_PUBLIC_HOST_URL"] || "http://localhost:3000";
export const SENTRY_DSN = process.env["NEXT_PUBLIC_SENTRY_DSN"] || "";

export const RBAC_COOKIE_SESSION_SECRET =
  process.env["RBAC_COOKIE_SESSION_SECRET"];
export const RBAC_COOKIE_SESSION_EXPIRATION_SECONDS =
  process.env["RBAC_COOKIE_SESSION_EXPIRATION_SECONDS"] || "3600";
export const RBAC_COOKIE_SESSION_NAME =
  process.env["RBAC_COOKIE_SESSION_NAME"] || "rbac_ce_sn";
export const RBAC_SECRET_KEY = process.env["RBAC_SECRET_KEY"];
export const RBAC_SESSION_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_SESSION_LIFETIME_IN_SECONDS"]) || Number("3600");
export const RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS =
  Number(process.env["NEXT_PUBLIC_RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS"]) ||
  Number("3600");
export const RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS"]) ||
  Number("86400");
export const RBAC_JWT_SECRET = process.env["RBAC_JWT_SECRET"];

export const DATABASE_HOST = `${process.env["DATABASE_HOST"] || process.env["POSTGRES_HOST"] || "localhost"}`;

export const DATABASE_PORT = parseInt(
  `${process.env["DATABASE_PORT"] || "5432"}`,
);
export const DATABASE_NAME = `${process.env["DATABASE_NAME"] || process.env["POSTGRES_DATABASE"] || "sps"}`;

export const DATABASE_USERNAME = `${process.env["DATABASE_USERNAME"] || process.env["POSTGRES_USER"] || "sps"}`;

export const DATABASE_PASSWORD = `${
  process.env["DATABASE_PASSWORD"] ||
  process.env["POSTGRES_PASSWORD"] ||
  "password"
}`;

export const DATABASE_NO_SSL = process.env["DATABASE_NO_SSL"];

export const DATABASE_URL = `postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;

const DEFAULT_DATABASE_OPTIONS = {
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  user: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
};

export const DATABASE_OPTIONS = DATABASE_NO_SSL
  ? DEFAULT_DATABASE_OPTIONS
  : {
      ...DEFAULT_DATABASE_OPTIONS,
      ssl: true,
    };

export const NEXT_PUBLIC_HOST_METADATA_TITLE =
  process.env["NEXT_PUBLIC_HOST_METADATA_TITLE"] || "Single Page Startup";
export const NEXT_PUBLIC_HOST_METADATA_DESCRIPTION =
  process.env["NEXT_PUBLIC_HOST_METADATA_DESCRIPTION"] ||
  "The fastest way to create service oriented Next.js project.";
export const NEXT_PUBLIC_HOST_METADATA_ICON =
  process.env["NEXT_PUBLIC_HOST_METADATA_ICON"] || "/images/favicon.svg";
export const NEXT_PUBLIC_HOST_METADATA_KEYWORDS =
  process.env["NEXT_PUBLIC_HOST_METADATA_KEYWORDS"] ||
  "nextjs,startup,sps,singlepagestartup,nx";

export const KV_PROVIDER: "redis" | "vercel-kv" =
  process.env["KV_PROVIDER"] === "redis" ? "redis" : "vercel-kv";
export const KV_HOST = process.env["KV_HOST"] || "localhost";
export const KV_PORT = Number(process.env["KV_PORT"]) || 80;
export const KV_SSL = process.env["KV_SSL"] || "true";
export const KV_TTL = Number(process.env["KV_TTL"]) || 30;
export const KV_URL = process.env["KV_URL"]?.replace("redis://", "rediss://");
export const KV_USERNAME = process.env["KV_USERNAME"] || "default";
export const KV_PASSWORD = process.env["KV_PASSWORD"];
export const KV_REST_API_URL = process.env["KV_REST_API_URL"];
export const KV_REST_API_TOKEN = process.env["KV_REST_API_TOKEN"];
export const KV_REST_API_READ_ONLY_TOKEN =
  process.env["KV_REST_API_READ_ONLY_TOKEN"];

export const WALLET_CONNECT_PROJECT_ID =
  process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] || "";

export const MIDDLEWARE_LOGGER = process.env["MIDDLEWARE_LOGGER"];
export const MIDDLEWARE_HTTP_CACHE = process.env["MIDDLEWARE_HTTP_CACHE"];

export const STALE_TIME =
  Number(process.env["NEXT_PUBLIC_STALE_TIME"]) || 60 * 1000;

export const REVALIDATE: number | undefined =
  Number(process.env["NEXT_PUBLIC_REVALIDATE"]) || undefined;

export const FILE_STORAGE_PROVIDER: "vercel-blob" | "local" | "aws-s3" =
  process.env["FILE_STORAGE_PROVIDER"] === undefined
    ? "local"
    : ["vercel-blob", "local", "aws-s3"].includes(
          process.env["FILE_STORAGE_PROVIDER"],
        )
      ? (process.env["FILE_STORAGE_PROVIDER"] as
          | "vercel-blob"
          | "local"
          | "aws-s3")
      : "local";
export const BLOB_READ_WRITE_TOKEN = process.env["BLOB_READ_WRITE_TOKEN"];

export const STRIPE_PUBLISHABLE_KEY =
  process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];
export const STRIPE_SECRET_KEY = process.env["STRIPE_SECRET_KEY"];
export const STRIPE_RETURN_URL = process.env["STRIPE_RETURN_URL"];

export const O_X_PROCESSING_SHOP_ID = process.env["O_X_PROCESSING_SHOP_ID"];
export const O_X_PROCESSING_TEST_PAYMENTS =
  process.env["O_X_PROCESSING_TEST_PAYMENTS"];
export const O_X_PROCESSING_WEBHOOK_PASSWORD =
  process.env["O_X_PROCESSING_WEBHOOK_PASSWORD"];
export const O_X_PROCESSING_RETURN_URL =
  process.env["O_X_PROCESSING_RETURN_URL"];

export const AWS_ACCESS_KEY_ID = process.env["AWS_ACCESS_KEY_ID"];
export const AWS_SECRET_ACCESS_KEY = process.env["AWS_SECRET_ACCESS_KEY"];
export const AWS_S3_BUCKET_NAME = process.env["AWS_S3_BUCKET_NAME"];
export const AWS_REGION = process.env["AWS_REGION"];
export const AWS_SES_FROM_EMAIL = process.env["AWS_SES_FROM_EMAIL"];

export const PAYSELECTION_RUB_SECRET_KEY =
  process.env["PAYSELECTION_RUB_SECRET_KEY"];
export const PAYSELECTION_RUB_SITE_ID =
  process.env["NEXT_PUBLIC_PAYSELECTION_RUB_SITE_ID"];
export const PAYSELECTION_RUB_SITE_NAME =
  process.env["NEXT_PUBLIC_PAYSELECTION_RUB_SITE_NAME"];
export const PAYSELECTION_RUB_PUBLIC_KEY =
  process.env["NEXT_PUBLIC_PAYSELECTION_RUB_PUBLIC_KEY"];
export const PAYSELECTION_RUB_WEBHOOK_URL =
  process.env["PAYSELECTION_RUB_WEBHOOK_URL"];

export const PAYSELECTION_INT_SECRET_KEY =
  process.env["PAYSELECTION_INT_SECRET_KEY"];
export const PAYSELECTION_INT_SITE_ID =
  process.env["NEXT_PUBLIC_PAYSELECTION_INT_SITE_ID"];
export const PAYSELECTION_INT_SITE_NAME =
  process.env["NEXT_PUBLIC_PAYSELECTION_INT_SITE_NAME"];
export const PAYSELECTION_INT_PUBLIC_KEY =
  process.env["NEXT_PUBLIC_PAYSELECTION_INT_PUBLIC_KEY"];
export const PAYSELECTION_INT_WEBHOOK_URL =
  process.env["PAYSELECTION_INT_WEBHOOK_URL"];

export const GOOGLE_TAG_MANAGER_ID =
  process.env["NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID"];

export const GOOGLE_ANALYTICS_ID =
  process.env["NEXT_PUBLIC_GOOGLE_ANALYTICS_ID"];

export const CLOUDPAYMENTS_PUBLIC_ID = process.env["CLOUDPAYMENTS_PUBLIC_ID"];
export const CLOUDPAYMENTS_API_SECRET = process.env["CLOUDPAYMENTS_API_SECRET"];

export const TELEGRAM_BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
export const TELEGRAM_BOT_BACKEND_URL =
  process.env["TELEGRAM_BOT_BACKEND_URL"] ?? BACKEND_URL;
