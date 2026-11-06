interface IUploadFile {
  name: string;
  file: File;
}

export function parseSingleFileUpload(
  body: Record<string, string | File | (string | File)[]>,
) {
  let upload: IUploadFile | undefined;
  let rawMetadata: string | undefined;

  for (const [name, field] of Object.entries(body)) {
    const values = Array.isArray(field) ? field : [field];
    for (const value of values) {
      if (value instanceof File) {
        if (upload) {
          throw new Error("Validation error. Multiple files are not allowed");
        }
        upload = { name, file: value };
      } else if (name === "data") {
        rawMetadata = value;
      }
    }
  }

  let metadata: Record<string, unknown> | undefined;
  if (rawMetadata) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawMetadata);
    } catch {
      throw new Error("Validation error. Invalid file metadata");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Validation error. Invalid file metadata");
    }
    metadata = parsed as Record<string, unknown>;
  }
  return { upload, metadata };
}
