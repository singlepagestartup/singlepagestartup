/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
/**
 * BDD Suite: server Page document reader.
 * Given: a resolved Page and structured data from the SEO SDK.
 * When: the public Page entry renders a document.
 * Then: the saved renderer receives the loaded Page and JSON-LD remains safe HTML.
 */
import { PassThrough } from "node:stream";
import { setImmediate, clearImmediate } from "node:timers";
import { renderToPipeableStream } from "react-dom/server";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { api as pageApi } from "@sps/host/models/page/sdk/server";

const renderedProps = jest.fn();
// React's Node streaming renderer uses timers absent from the DOM environment.
Object.assign(globalThis, { setImmediate, clearImmediate });
jest.mock("server-only", () => ({}));
jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { resolvePageSeo: jest.fn() },
}));
jest.mock("../variants", () => ({
  variants: {
    document: jest.requireActual("./index").Component,
    default: (props: any) => {
      renderedProps(props);
      return <main>{props.data.title}</main>;
    },
  },
}));

function renderDocument() {
  return new Promise<string>((resolve, reject) => {
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => {
      html += chunk.toString();
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      <Page isServer={true} variant="document" url="/article" language="ru" />,
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}

it.each(["</script>", "</script >", "</script\t>", "</script\t\n bar>"])(
  "passes one resolved record and safely serializes JSON-LD containing %s",
  async (closingTag) => {
    const headline = `Safe ${closingTag}<script>alert(1)</script>`;
    const page = { id: "page-1", title: "Статья", variant: "default" };
    jest.mocked(pageApi.resolvePageSeo).mockResolvedValue({
      page,
      structuredData: [{ headline }],
    } as any);
    const html = await renderDocument();
    expect(pageApi.resolvePageSeo).toHaveBeenCalledWith("/article", "ru");
    expect(renderedProps).toHaveBeenCalledWith(
      expect.objectContaining({
        data: page,
        dataSource: "props",
        url: "/article",
        language: "ru",
      }),
    );
    expect(html).toContain("Статья");
    expect(html).not.toContain(`${closingTag}<script>`);
    const document = new DOMParser().parseFromString(html, "text/html");
    const scripts = document.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].type).toBe("application/ld+json");
    expect(JSON.parse(scripts[0].textContent!)[0].headline).toBe(headline);
  },
);
