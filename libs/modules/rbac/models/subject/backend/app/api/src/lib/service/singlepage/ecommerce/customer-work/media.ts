import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import type { TWorkOperation } from "@sps/crm/models/funnel/sdk/model";
import type { Service as Subject } from "../../index";

const maxBytes = 2 * 1024 * 1024;

export async function prepareCustomerWorkMedia(
  file: File,
  operations: TWorkOperation[],
) {
  if (!file.size || file.size > maxBytes) {
    throw new Error(
      "Validation error. Attach one image or WAV file up to 2 MiB",
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(bytes);
  const image =
    detected &&
    ["image/png", "image/jpeg", "image/webp"].includes(detected.mime);
  const audio =
    detected?.mime === "audio/wav" || detected?.mime === "audio/vnd.wave";
  if (image && operations.includes("vision")) {
    return { name: `image.${detected.ext}`, mimeType: detected.mime, bytes };
  }
  if (audio && operations.includes("transcription")) {
    return { name: "clip.wav", mimeType: "audio/wav", bytes };
  }
  throw new Error(
    "Validation error. This stage does not accept the attached media type",
  );
}

export type TPreparedMedia = Awaited<
  ReturnType<typeof prepareCustomerWorkMedia>
>;

export async function storeCustomerWorkMedia(
  subject: Subject,
  media: TPreparedMedia,
) {
  const record = await subject.modules.fileStorage.privateFile.write(media);
  return { id: record.id, digest: record.digest, mimeType: record.mimeType };
}

export const customerWorkMediaDigest = (media: TPreparedMedia) =>
  createHash("sha256").update(media.bytes).digest("hex");
