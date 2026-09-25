/**
 * BDD Suite: Portable Studio document downloads
 * Given Studio renders canonical documents and visual compositions
 * When a reviewer downloads Markdown or HTML
 * Then the files retain readable structure, context, and standalone page content
 */
import { describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

import {
  downloadFileName,
  downloadSlug,
  markdownDownloadContent,
  standaloneHtmlDownload,
} from "./downloads";

describe("Studio document downloads", () => {
  /**
   * BDD Scenario: Canonical Markdown is portable
   * Given a reviewed document contains frontmatter, headings, and a table
   * When its download body is prepared
   * Then review metadata is removed while the authored Markdown structure remains
   */
  test("keeps authored Markdown structure without review metadata", () => {
    const source = `---\nconfirmation:\n  confirmed: false\n---\n\n# Product\n\n## Who it is for\n\n| Segment | Need |\n| --- | --- |\n| Makers | A foundation |`;
    const result = markdownDownloadContent(source);
    expect(result).toStartWith("# Product\n\n## Who it is for");
    expect(result).toContain("| Makers | A foundation |");
    expect(result).not.toContain("confirmation:");
    expect(result).toEndWith("\n");
  });

  /**
   * BDD Scenario: Page downloads retain their visible title
   * Given a product page body has no authored level-one heading
   * When its Markdown download is prepared with the catalog title
   * Then the downloaded page starts with that title without changing titled sources
   */
  test("adds the visible page title when Markdown has none", () => {
    expect(markdownDownloadContent("Page body.", "Workspace map")).toBe(
      "# Workspace map\n\nPage body.\n",
    );
    expect(
      markdownDownloadContent(
        "# Authored title\n\nPage body.",
        "Catalog title",
      ),
    ).toBe("# Authored title\n\nPage body.\n");
  });

  /**
   * BDD Scenario: Segment context is retained in the file name
   * Given two Sales pages belong to different named customer segments
   * When their download names are generated
   * Then the full human-readable segment names distinguish the Markdown files
   */
  test("builds contextual safe file names", () => {
    expect(
      downloadFileName(
        downloadSlug(
          "Code Framework",
          "Makers building with a coding agent",
          "Sales",
        ),
        "md",
      ),
    ).toBe("code-framework-makers-building-with-a-coding-agent-sales.md");
    expect(
      downloadFileName(
        "Code Framework-Coding agents selecting for a person or team",
        "md",
      ),
    ).toBe("code-framework-coding-agents-selecting-for-a-person-or-team.md");
  });

  /**
   * BDD Scenario: Visual pages become standalone HTML
   * Given a rendered page contains styles, controls, links, and structured content
   * When the HTML download is serialized
   * Then controls are omitted and the remaining document can be opened independently
   */
  test("serializes a standalone visual page without export controls", async () => {
    const dom = new JSDOM(
      `<html lang="en"><head><style>.card{color:teal}</style></head><body><main id="page"><div data-export-controls><button>Download</button></div><section class="card"><h1>Brand</h1><a href="/proof">Proof</a><img src="/identity.svg" alt="Identity"></section></main></body></html>`,
      { url: "http://localhost:4320/iframe.html" },
    );
    const fetchDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "fetch",
    );
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: async () => ({
        ok: true,
        blob: async () =>
          new dom.window.Blob(["<svg></svg>"], { type: "image/svg+xml" }),
      }),
    });
    try {
      const result = await standaloneHtmlDownload(
        dom.window.document.getElementById("page")!,
        "Brand",
      );
      expect(result).toContain("<!doctype html>");
      expect(result).toContain("<title>Brand</title>");
      expect(result).toContain(".card {color: teal;}");
      expect(result).toContain('href="http://localhost:4320/proof"');
      expect(result).toContain("<h1>Brand</h1>");
      expect(result).toContain('src="data:image/svg+xml;base64,');
      expect(result).not.toContain("Download</button>");
    } finally {
      if (fetchDescriptor)
        Object.defineProperty(globalThis, "fetch", fetchDescriptor);
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });
});
