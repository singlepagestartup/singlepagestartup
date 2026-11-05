import { gzipSync } from "node:zlib";
import { assertKnowledgeAttachmentBytes } from ".";
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
it.each([
  {
    name: "logo.SVG",
    mimeType: "application/octet-stream",
    bytes: Buffer.from("not SVG"),
  },
  {
    name: "photo.png",
    mimeType: "image/svg+xml; charset=utf-8",
    bytes: Buffer.from("not SVG"),
  },
  { name: "notes.txt", mimeType: "text/plain", bytes: Buffer.from(svg) },
  {
    name: "photo.png",
    mimeType: "image/png",
    bytes: Buffer.from('<?xml version="1.0"?>\n' + svg),
  },
  { name: "file.bin", bytes: Buffer.from("\ufeff" + svg) },
  {
    name: "file.bin",
    bytes: Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from(svg, "utf16le"),
    ]),
  },
  {
    name: "file.bin",
    bytes: Buffer.concat([
      Buffer.from([0xfe, 0xff]),
      Buffer.from(svg, "utf16le").swap16(),
    ]),
  },
  {
    name: "photo.png",
    mimeType: "application/octet-stream",
    bytes: gzipSync(Buffer.from(svg)),
  },
  { name: "logo.svgz", bytes: Buffer.from("not compressed") },
  { name: "/uploads/logo.svg?download=1", bytes: Buffer.alloc(0) },
  {
    name: "notes.txt",
    bytes: Buffer.from(
      '<?xml version="1.0"?><!-- comment --><!DOCTYPE svg [<!ENTITY example "unused">]><svg/>',
    ),
  },
  {
    name: "notes.md",
    bytes: Buffer.from(
      '<!-- before root -->\n<svg:svg xmlns:svg="http://www.w3.org/2000/svg"/>',
    ),
  },
])("rejects SVG regardless of declaration: $name $mimeType", (input) => {
  expect(() => assertKnowledgeAttachmentBytes(input)).toThrow("SVG");
});
it.each([
  Buffer.from("Ordinary project notes"),
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("%PDF-1.7"),
  Buffer.from("# Markdown notes\n\nExample:\n```xml\n<svg><path/></svg>\n```"),
  Buffer.from("Use <svg> in an example; this file contains ordinary notes."),
  Buffer.from("<!-- Markdown comment -->\n# Notes\n\n<svg> is a code example."),
])("preserves supported non-SVG bytes", (bytes) => {
  expect(() =>
    assertKnowledgeAttachmentBytes({ bytes, name: "fixture.txt" }),
  ).not.toThrow();
});
it("rejects an unbounded XML prolog without scanning an entire large attachment", () => {
  expect(() =>
    assertKnowledgeAttachmentBytes({
      name: "notes.txt",
      bytes: Buffer.from("<!--" + " ".repeat(128 * 1024) + "--><svg/>"),
    }),
  ).toThrow("header exceeds");
});
