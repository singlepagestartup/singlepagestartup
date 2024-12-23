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
