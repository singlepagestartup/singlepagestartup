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
/**
 * static - saves for github
 * dynamic - on the server
 */
export const FILE_STORAGE_FOLDER =
  process.env["FILE_STORAGE_FOLDER"] || "file-storage/static";
export const BLOB_READ_WRITE_TOKEN = process.env["BLOB_READ_WRITE_TOKEN"];
/**
 * Largest upload the file routes accept, in bytes (issue #304): the multipart
 * body of a create or update, and the body create-from-url fetches. A larger
 * upload is refused with a validation error before it is buffered. Bun refuses
 * request bodies above 128 MiB on its own, so a value above that also needs
 * `maxRequestBodySize` raised in `apps/api/server.ts`.
 */
export const FILE_STORAGE_MAX_UPLOAD_BYTES =
  Number(process.env["FILE_STORAGE_MAX_UPLOAD_BYTES"]) || 50 * 1024 * 1024;
