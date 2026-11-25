import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { Component as Table } from "./index";
import { firstPage, type IStoreTablePage } from "./interface";

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

it("runs the scoped server reader through the public entrypoint and hands its page to the client adapter", async () => {
  const data = { items: ["Order A"], total: 1 };
  const readPage = jest.fn(async () => data);
  const renderClient = jest.fn((initialData: IStoreTablePage<string>) => (
    <div>{initialData.items.join(", ")}</div>
  ));
  const output = new PassThrough();
  const chunks: Buffer[] = [];
  const html = new Promise<string>((resolve, reject) => {
    output.on("data", (chunk: Buffer) => chunks.push(chunk));
    output.on("end", () => resolve(Buffer.concat(chunks).toString()));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      <Table
        isServer
        language="en"
        Provider={({ children }) => <section>{children}</section>}
        readPage={readPage}
        renderClient={renderClient}
      />,
      { onAllReady: () => stream.pipe(output), onError: reject },
    );
  });
  expect(await html).toContain("<div>Order A</div>");
  expect(readPage).toHaveBeenCalledWith(firstPage);
  expect(renderClient.mock.calls).toEqual([[data]]);
});
