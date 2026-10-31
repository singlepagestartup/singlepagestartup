import { plainText } from "./utils";

describe("legacy HTML metadata excerpts", () => {
  it.each([
    "<script>alert(1)</script >",
    "<SCRIPT>alert(1)</SCRIPT>",
    "<script>alert(1)</script ignored>",
    "<style>body { color: red }</style >",
    "<STYLE>body { color: red }</STYLE>",
  ])(
    "omits non-content blocks with HTML closing-tag variations: %s",
    (block) => {
      expect(plainText(`<p>Before</p>${block}<p>After</p>`)).toBe(
        "Before After",
      );
    },
  );
});
