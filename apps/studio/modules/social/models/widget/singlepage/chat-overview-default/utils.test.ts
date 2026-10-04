import { describe, expect, it } from "bun:test";
import { createPreviewAttachmentStore } from "./utils";

describe("local chat attachment ownership", () => {
  it("retains actual same-named files separately and does not release sent files when a draft clears", async () => {
    const revoked: string[] = [];
    let next = 0;
    const store = createPreviewAttachmentStore({
      createObjectURL: () => `blob:preview-${++next}`,
      revokeObjectURL: (url) => revoked.push(url),
    });
    const original = new File(["original"], "notes.txt", {
      type: "text/plain",
    });
    const replacement = new File(["replacement"], "notes.txt", {
      type: "text/plain",
    });
    let draft = store.add([original, replacement]);
    const sent = [...draft];
    draft = [];
    expect(sent[0].file).toBe(original);
    expect(sent[1].file).toBe(replacement);
    expect(await sent[0].file.text()).toBe("original");
    expect(await sent[1].file.text()).toBe("replacement");
    expect(new Set(sent.map((file) => file.id)).size).toBe(2);
    expect(draft).toHaveLength(0);
    expect(revoked).toEqual([]);
    store.dispose();
    expect(revoked).toEqual(sent.map((file) => file.url));
  });
  it("revokes removed draft files once and releases only the remaining files on unmount", () => {
    const revoked: string[] = [];
    let next = 0;
    const store = createPreviewAttachmentStore({
      createObjectURL: () => `blob:preview-${++next}`,
      revokeObjectURL: (url) => revoked.push(url),
    });
    const [removed, retained] = store.add([
      new File(["a"], "a.txt"),
      new File(["b"], "b.txt"),
    ]);
    store.remove(removed.id);
    store.remove(removed.id);
    expect(revoked).toEqual([removed.url]);
    store.dispose();
    store.dispose();
    expect(revoked).toEqual([removed.url, retained.url]);
  });
  it("replaces a chat image without releasing other retained files", async () => {
    const revoked: string[] = [];
    let next = 0;
    const store = createPreviewAttachmentStore({
      createObjectURL: () => `blob:preview-${++next}`,
      revokeObjectURL: (url) => revoked.push(url),
    });
    const [previousImage, messageFile] = store.add([
      new File(["old-image"], "chat.png", { type: "image/png" }),
      new File(["message content"], "notes.txt", { type: "text/plain" }),
    ]);
    const [replacementImage] = store.add([
      new File(["new-image"], "chat.png", { type: "image/png" }),
    ]);
    store.remove(previousImage.id);
    expect(revoked).toEqual([previousImage.url]);
    expect(await replacementImage.file.text()).toBe("new-image");
    expect(await messageFile.file.text()).toBe("message content");
    store.dispose();
    expect(revoked).toEqual([
      previousImage.url,
      messageFile.url,
      replacementImage.url,
    ]);
  });
});
