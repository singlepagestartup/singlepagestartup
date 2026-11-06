export interface SocialPreviewAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  file: File;
}

/** Owns selected and sent preview files until explicit removal or view unmount. */
export function createPreviewAttachmentStore(
  urls: Pick<typeof URL, "createObjectURL" | "revokeObjectURL"> = URL,
) {
  const files = new Map<string, SocialPreviewAttachment>();
  return {
    add(selected: File[]) {
      return selected.map((file) => {
        const attachment: SocialPreviewAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          type: file.type,
          url: urls.createObjectURL(file),
          file,
        };
        files.set(attachment.id, attachment);
        return attachment;
      });
    },
    remove(id: string) {
      const attachment = files.get(id);
      if (!attachment) return;
      urls.revokeObjectURL(attachment.url);
      files.delete(id);
    },
    dispose() {
      for (const attachment of files.values())
        urls.revokeObjectURL(attachment.url);
      files.clear();
    },
  };
}
