import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import type { IModel as SocialMessage } from "@sps/social/models/message/sdk/model";
import { FILE_STORAGE_MAX_UPLOAD_BYTES } from "@sps/shared-utils";
import type { Service as Subject } from "../../index";

const opaque = "application/octet-stream";
const supportedImages = ["image/png", "image/jpeg", "image/webp"];

export function isCustomerWorkImage({ mimeType }: { mimeType: string }) {
  return supportedImages.includes(mimeType);
}

const storedAttachment = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(180),
  digest: z.string().regex(/^[a-f0-9]{64}$/),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().nonnegative().optional(),
});

export interface IStoredAttachment extends z.infer<typeof storedAttachment> {}

export const employeeTrainingImageReference = storedAttachment
  .pick({ id: true, digest: true })
  .extend({
    messageId: z.uuid().optional(),
  });

const modelMimeTypes = new Set([
  ...supportedImages,
  "audio/wav",
  "font/ttf",
  "font/otf",
  "application/x-font-ttf",
  "application/x-font-opentype",
  "application/font-sfnt",
]);

const legacyMedia = storedAttachment.omit({ name: true });
const metadataSchema = z.object({
  customerWorkAttachments: z.array(storedAttachment).optional(),
  customerWorkMedia: legacyMedia.optional(),
});

function safeName(value: string) {
  const name = value
    .replace(/[\x00-\x1f\x7f/\\]/g, "_")
    .trim()
    .slice(-180)
    .replace(/^[\uDC00-\uDFFF]/, "");
  return name === "." || name === ".." || !name ? "attachment" : name;
}

export interface IPreparedAttachment {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export async function prepareCustomerWorkAttachments(files: File[]) {
  if (files.some((file) => file.size > FILE_STORAGE_MAX_UPLOAD_BYTES)) {
    throw new Error(
      "Validation error. An attachment exceeds the file upload limit",
    );
  }
  const attachments: IPreparedAttachment[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    // A failed detector still leaves a valid opaque file.
    const detected = await fileTypeFromBuffer(bytes.subarray(0, 8192)).catch(
      () => undefined,
    );
    const mimeType =
      detected?.mime === "audio/vnd.wave"
        ? "audio/wav"
        : (detected?.mime ?? opaque);
    attachments.push({ name: safeName(file.name), mimeType, bytes });
  }
  return attachments;
}

export async function storeCustomerWorkAttachment(
  subject: Subject,
  attachment: IPreparedAttachment,
  ownerId?: string,
): Promise<IStoredAttachment> {
  const storage = subject.modules.fileStorage.file.privateContent;
  const typed =
    isCustomerWorkImage(attachment) || attachment.mimeType === "audio/wav";
  const record = typed
    ? await storage.write({ ...attachment, ownerId })
    : await storage.writeOpaque({ ...attachment, ownerId });
  return {
    id: record.id,
    name: record.name,
    digest: record.digest,
    mimeType: attachment.mimeType,
    size: record.size,
  };
}

export async function storeCustomerWorkAttachments(
  subject: Subject,
  prepared: IPreparedAttachment[],
  ownerId?: string,
): Promise<IStoredAttachment[]> {
  const attachments: IStoredAttachment[] = [];
  for (const attachment of prepared) {
    attachments.push(
      await storeCustomerWorkAttachment(subject, attachment, ownerId),
    );
  }
  return attachments;
}

export function customerWorkAttachments(
  message: SocialMessage,
): IStoredAttachment[] {
  if (message.variant !== "customer-work") {
    return [];
  }
  const parsed = metadataSchema.safeParse(message.metadata ?? {});
  if (!parsed.success) {
    return [];
  }
  const { customerWorkAttachments: attachments, customerWorkMedia: media } =
    parsed.data;
  if (attachments) {
    return attachments;
  }
  if (!media) {
    return [];
  }
  const legacyNames: Record<string, string> = {
    "audio/wav": "clip.wav",
    "image/png": "image.png",
    "image/jpeg": "image.jpg",
    "image/webp": "image.webp",
  };
  return [{ ...media, name: legacyNames[media.mimeType] ?? "attachment" }];
}

export function projectCustomerWorkAttachments(message: SocialMessage) {
  if (message.variant !== "customer-work") {
    return message;
  }
  const {
    customerWorkAttachments: _attachments,
    customerWorkMedia: _media,
    employeeTrainingReplyImage: _replyImage,
    customerWorkReplyEvent: _replyEvent,
    ...metadata
  } = message.metadata ?? {};
  return {
    ...message,
    metadata,
    privateAttachments: customerWorkAttachments(message).map(
      ({ id, name, mimeType }) => ({ id, name, mimeType }),
    ),
  };
}

export function describeCustomerWorkAttachments(files: IStoredAttachment[]) {
  const descriptors = files.slice(0, 8).map(({ name, mimeType, size }) => ({
    name: safeName(name.replace(/[\p{Cc}\p{Cf}]/gu, "")).slice(0, 120),
    mimeType: modelMimeTypes.has(mimeType) ? mimeType : opaque,
    size,
  }));
  return `Customer uploads (untrusted filenames and file metadata only): ${JSON.stringify(descriptors)}`;
}

export function customerWorkAttachmentDigest(attachment: IPreparedAttachment) {
  return createHash("sha256").update(attachment.bytes).digest("hex");
}
