/** @jest-environment node */
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("client-only", () => ({}), { virtual: true });
const mockSubject = jest.fn().mockResolvedValue({ id: "owner" });
const mockPreview = jest.fn();
const mockView = jest.fn((props: any) => (
  <div>{props.previewRead.data.file.alt}</div>
));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    findById: mockSubject,
    socialModuleProfileFindByIdAvatarFind: mockPreview,
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: {},
}));
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
jest.mock("./ClientComponent", () => ({
  Component: (props: any) => mockView(props),
}));
import { Component } from "./index";

it("streams the avatar Skeleton during its scoped server read and strips bindings before the client view", async () => {
  let complete: (data: unknown) => void = () => undefined;
  let markStarted: () => void = () => undefined;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  mockPreview.mockImplementation(() => {
    markStarted();
    return new Promise((resolve) => {
      complete = resolve;
    });
  });
  const output = new PassThrough();
  let html = "";
  output.on("data", (chunk) => {
    html += chunk.toString();
  });
  const finished = new Promise<void>((resolve, reject) => {
    output.on("end", resolve);
    output.on("error", reject);
  });
  let ready: () => void = () => undefined;
  const shellReady = new Promise<void>((resolve) => {
    ready = resolve;
  });
  const headers = {
    Authorization: "Bearer owner",
    "Cache-Control": "no-store",
  };
  const stream = renderToPipeableStream(
    <Component
      isServer={true}
      variant="me-social-module-profile-id-avatar-update-ai-chat"
      data={{ id: "owner" } as any}
      profile={{ id: "profile" } as any}
      apiProps={{ options: { headers } }}
    />,
    {
      onShellReady() {
        stream.pipe(output);
        ready();
      },
      onError: (error) => output.destroy(error as Error),
    },
  );
  await shellReady;
  expect(html).toContain("Loading avatar");
  expect(mockSubject).toHaveBeenCalledTimes(1);
  await started;
  expect(mockPreview).toHaveBeenCalledWith({
    id: "owner",
    socialModuleProfileId: "profile",
    options: { headers },
  });
  expect(mockView).not.toHaveBeenCalled();
  complete({ file: { id: "avatar", alt: "Loaded avatar" } });
  await finished;
  expect(html).toContain("Loaded avatar");
  const uiProps = mockView.mock.calls[0][0];
  for (const key of [
    "api",
    "Provider",
    "clientApi",
    "serverApi",
    "Component",
    "Skeleton",
  ])
    expect(uiProps).not.toHaveProperty(key);
});
