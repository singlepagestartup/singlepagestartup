import type { IProjectFile } from "./ai-chat-workspace";

/** Retain the original bytes for previews and downloads; text extraction is separate. */
export async function readProjectFiles(
  files: FileList | File[],
  prefix: string,
): Promise<IProjectFile[]> {
  const prepared = await Promise.all(
    Array.from(files).map(async (file, index) => {
      const plain =
        /\.(txt|md|csv|json)$/i.test(file.name) ||
        file.type.startsWith("text/");
      if (plain && file.size > 100000)
        throw new Error(
          `${file.name} is too long for a document draft. Add a shorter text file.`,
        );
      return {
        file,
        id: `${prefix}-${Date.now()}-${index}`,
        text: plain ? await file.text() : "",
      };
    }),
  );
  return prepared.map(({ file, id, text }) => ({
    id,
    name: file.name,
    size: file.size,
    text,
    mimeType: file.type,
    fileUrl: URL.createObjectURL(file),
  }));
}
