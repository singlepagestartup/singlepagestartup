/**
 * BDD Suite: server Page document reader.
 * Given: a resolved Page and structured data from the SEO SDK.
 * When: the public Page entry renders a document.
 * Then: the saved renderer receives the loaded Page and JSON-LD remains safe HTML.
 */
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";

const renderedProps = jest.fn();
jest.mock("server-only", () => ({}));
jest.mock("@sps/host/models/metadata/sdk/server", () => ({
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

it.each(["</script>", "</script >", "</script\t>"])(
  "passes one resolved record and safely serializes JSON-LD containing %s",
  async (closingTag) => {
    const headline = `Safe ${closingTag}<script>alert(1)</script>`;
    const page = { id: "page-1", title: "Статья", variant: "default" };
    jest.mocked(metadataApi.resolvePageSeo).mockResolvedValue({
      page,
      structuredData: [{ headline }],
    } as any);
    const html = await renderDocument();
    expect(metadataApi.resolvePageSeo).toHaveBeenCalledWith("/article", "ru");
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
    const json = html.match(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/i)?.[1];
    expect(JSON.parse(json!)[0].headline).toBe(headline);
  },
);
