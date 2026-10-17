/** @jest-environment node */
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
import { Component } from "./index";

it("streams the supplied Skeleton before a delayed server SDK result", async () => {
  let resolve: (value: unknown) => void = () => undefined;
  const pending = new Promise((done) => {
    resolve = done;
  });
  const read = jest.fn(() => pending);
  const output = new PassThrough();
  let html = "";
  output.on("data", (chunk) => {
    html += chunk.toString();
  });
  const done = new Promise<void>((resolve, reject) => {
    output.on("end", resolve);
    output.on("error", reject);
  });
  let shellReady: () => void = () => undefined;
  const shell = new Promise<void>((resolve) => {
    shellReady = resolve;
  });
  const stream = renderToPipeableStream(
    <Component
      isServer={true}
      variant="test"
      data={{ id: "record" }}
      Provider={({ children }: any) => children}
      clientApi={{} as any}
      serverApi={{ findById: read } as any}
      Skeleton={<div role="status">Server record skeleton</div>}
      Component={(props: any) => <div>{props.data.title}</div>}
    />,
    {
      onShellReady() {
        stream.pipe(output);
        shellReady();
      },
      onError: (error) => output.destroy(error as Error),
    },
  );
  await shell;
  expect(html).toContain("Server record skeleton");
  expect(html).not.toContain("Loaded record");
  expect(read).toHaveBeenCalledTimes(1);
  resolve({ id: "record", title: "Loaded record" });
  await done;
  expect(html).toContain("Loaded record");
});
