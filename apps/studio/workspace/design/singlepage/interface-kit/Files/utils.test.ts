import { describe, expect, test } from "bun:test";
import { filePreviewKind, reorderFile } from "./utils";
import type { ILocalFile } from "./interface";

describe("draft attachments", () => {
  const files: ILocalFile[] = [
    "first.csv",
    "second.log",
    "third.jpg",
    "fourth.md",
  ].map((name) => ({
    id: name,
    name,
    type: "",
    size: 10,
    localFile: new File([name], name),
  }));

  test("drag insertion retains file references and the original array", () => {
    const dragged = reorderFile(files, "fourth.md", "first.csv", "after");
    expect(dragged.map((file) => file.name)).toEqual([
      "first.csv",
      "fourth.md",
      "second.log",
      "third.jpg",
    ]);
    expect(dragged[1].localFile).toBe(files[3].localFile!);
    expect(files.map((file) => file.name)).toEqual([
      "first.csv",
      "second.log",
      "third.jpg",
      "fourth.md",
    ]);
  });

  test.each([
    [
      "first.csv",
      "third.jpg",
      "before",
      ["second.log", "first.csv", "third.jpg", "fourth.md"],
    ],
    [
      "first.csv",
      "third.jpg",
      "after",
      ["second.log", "third.jpg", "first.csv", "fourth.md"],
    ],
    [
      "fourth.md",
      "second.log",
      "before",
      ["first.csv", "fourth.md", "second.log", "third.jpg"],
    ],
    [
      "fourth.md",
      "second.log",
      "after",
      ["first.csv", "second.log", "fourth.md", "third.jpg"],
    ],
    [
      "first.csv",
      "fourth.md",
      "after",
      ["second.log", "third.jpg", "fourth.md", "first.csv"],
    ],
    [
      "fourth.md",
      "first.csv",
      "before",
      ["fourth.md", "first.csv", "second.log", "third.jpg"],
    ],
  ] as const)(
    "inserts %s %s on its %s edge",
    (id, target, position, expected) => {
      expect(
        reorderFile(files, id, target, position).map((file) => file.name),
      ).toEqual([...expected]);
    },
  );

  test("boundaries and stale drop targets leave attachments unchanged", () => {
    expect(reorderFile(files, "first.csv", "second.log", "before")).toBe(files);
    expect(reorderFile(files, "second.log", "first.csv", "after")).toBe(files);
    expect(reorderFile(files, "removed.txt", "first.csv", "before")).toBe(
      files,
    );
    expect(reorderFile(files, "first.csv", "removed.txt", "after")).toBe(files);
    expect(reorderFile(files, "first.csv", "first.csv", "before")).toBe(files);
  });

  test.each([
    ["report.csv", "text/csv", "text"],
    ["server.log", "", "text"],
    ["photo.JPG", "", "image"],
    ["brief.md", "application/octet-stream", "markdown"],
    ["report.PDF", "", "pdf"],
    ["markup.html", "text/html", "text"],
    ["graphic.svg", "image/svg+xml", "unsupported"],
    ["archive.zip", "application/zip", "unsupported"],
  ] as const)(
    "selects a preview for %s without executing documents",
    (name, type, expected) => {
      expect(filePreviewKind({ id: name, name, type, size: 0 })).toBe(expected);
    },
  );
});
