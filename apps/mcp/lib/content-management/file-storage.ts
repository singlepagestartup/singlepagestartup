import {
  API_SERVICE_URL,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IContentEntityDescriptor, IContentSdkOptions } from "./types";

const fileStorageFileKey = "file-storage.file";
const base64Fields = ["contentBase64", "base64", "dataBase64"] as const;
const uploadOnlyFields = [
  ...base64Fields,
  "fileName",
  "filename",
  "name",
  "path",
  "localPath",
  "sourcePath",
] as const;

export function isFileStorageFileDescriptor(
  descriptor: IContentEntityDescriptor,
) {
  return descriptor.key === fileStorageFileKey;
}

function getStringField(data: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const value = data[field];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return;
}

function getUploadUrl(data: Record<string, unknown>) {
  const explicitUrl = getStringField(data, ["url", "sourceUrl"]);

  if (explicitUrl) {
    return explicitUrl;
  }

  const file = getStringField(data, ["file"]);

  if (file && /^https?:\/\//i.test(file)) {
    return file;
  }

  return;
}

function getBase64Value(data: Record<string, unknown>) {
  return getStringField(data, [...base64Fields]);
}

function getServerLocalPath(data: Record<string, unknown>) {
  const value = getStringField(data, [
    "file",
    "path",
    "localPath",
    "sourcePath",
  ]);

  if (!value) {
    return;
  }

  if (value.startsWith("/") || value.startsWith("file://")) {
    return value;
  }

  return;
}

function assertNoServerLocalPath(data: Record<string, unknown>) {
  const localPath = getServerLocalPath(data);

  if (!localPath) {
    return;
  }

  throw new Error(
    [
      "Validation error. file-storage.file cannot read MCP client local paths.",
      `Received '${localPath}'.`,
      "Use data.url for a public URL or data.contentBase64 with data.fileName and data.mimeType for generated files.",
    ].join(" "),
  );
}

function createMetadata(data: Record<string, unknown>) {
  return Object.entries(data).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if ((uploadOnlyFields as readonly string[]).includes(key)) {
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {},
  );
}

function parseBase64Upload(data: Record<string, unknown>) {
  const rawBase64 = getBase64Value(data);

  if (!rawBase64) {
    return;
  }

  const dataUrlMatch = rawBase64.match(/^data:([^;]+);base64,(.*)$/s);
  const mimeType =
    dataUrlMatch?.[1] ??
    getStringField(data, ["mimeType", "contentType"]) ??
    "application/octet-stream";
  const contentBase64 = dataUrlMatch?.[2] ?? rawBase64;
  const fileName =
    getStringField(data, ["fileName", "filename", "name"]) ??
    inferFileName(mimeType);

  return {
    contentBase64,
    fileName,
    mimeType,
  };
}

function inferFileName(mimeType: string) {
  const extensionByMimeType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/webp": "webp",
  };

  return `upload.${extensionByMimeType[mimeType] ?? "bin"}`;
}

async function uploadBase64FileRecord(props: {
  descriptor: IContentEntityDescriptor;
  data: Record<string, unknown>;
  options?: IContentSdkOptions;
}) {
  const upload = parseBase64Upload(props.data);

  if (!upload) {
    throw new Error("Validation error. Missing contentBase64");
  }

  const formData = new FormData();
  const file = new File(
    [Buffer.from(upload.contentBase64, "base64")],
    upload.fileName,
    { type: upload.mimeType },
  );

  formData.append("data", JSON.stringify(createMetadata(props.data)));
  formData.append("file", file);

  const res = await fetch(`${API_SERVICE_URL}${props.descriptor.route}`, {
    method: "POST",
    headers: props.options?.headers,
    body: formData,
  });

  const json = await responsePipe<{ data: Record<string, any> }>({ res });

  return transformResponseItem(json);
}

export async function createFileStorageFileRecord(props: {
  descriptor: IContentEntityDescriptor;
  input: {
    data: Record<string, unknown>;
    dryRun: boolean;
  };
  options?: IContentSdkOptions;
}) {
  const url = getUploadUrl(props.input.data);
  const base64Upload = parseBase64Upload(props.input.data);

  if (url) {
    if (props.input.dryRun) {
      return {
        operation: "create",
        module: "file-storage",
        model: "file",
        uploadMode: "create-from-url",
        data: {
          ...createMetadata(props.input.data),
          url,
        },
      };
    }

    if (!props.descriptor.api.createFromUrl) {
      throw new Error(
        "Validation error. file-storage.file SDK does not support createFromUrl",
      );
    }

    return await props.descriptor.api.createFromUrl({
      data: {
        ...createMetadata(props.input.data),
        url,
      },
      options: props.options,
    });
  }

  if (base64Upload) {
    if (props.input.dryRun) {
      return {
        operation: "create",
        module: "file-storage",
        model: "file",
        uploadMode: "base64-multipart",
        file: {
          fileName: base64Upload.fileName,
          mimeType: base64Upload.mimeType,
          contentBase64Length: base64Upload.contentBase64.length,
        },
        data: createMetadata(props.input.data),
      };
    }

    return await uploadBase64FileRecord({
      descriptor: props.descriptor,
      data: props.input.data,
      options: props.options,
    });
  }

  assertNoServerLocalPath(props.input.data);

  return;
}
