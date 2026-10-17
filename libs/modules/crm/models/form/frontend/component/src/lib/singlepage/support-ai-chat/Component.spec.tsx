/**
 * The public Form keeps its SDK reader and forwards controlled form state only
 * inside the client subtree. Props mode uses a previously loaded Form record.
 */
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { Component as CrmModuleForm } from "@sps/crm/models/form/frontend/component";
import type { IComponentProps } from "./interface";

const clientRead = jest.fn();
const serverRead = jest.fn();
const providerRender = jest.fn();
const relationRender = jest.fn();

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/crm/models/form/sdk/client", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => {
    providerRender();
    return <>{children}</>;
  },
  api: { findById: (props: unknown) => clientRead(props) },
}));
jest.mock("@sps/crm/models/form/sdk/server", () => ({
  api: { findById: (props: unknown) => serverRead(props) },
}));
jest.mock("../variants", () => ({
  variants: { "support-ai-chat": jest.requireActual("./index").Component },
}));
jest.mock("@sps/crm/relations/forms-to-steps/frontend/component", () => ({
  Component: (props: any) => {
    relationRender(props);
    return props.variant === "find" ? (
      props.children({ data: [{ id: "form-step", stepId: "first-step" }] })
    ) : (
      <section data-step-id={props.data.stepId} data-path={props.path} />
    );
  },
}));

const reference = {
  id: "support-form-id",
  className: "stale-reference",
} as IComponentProps["data"];
const stored = { ...reference, className: "backend-record" };
const props: IComponentProps = {
  isServer: false,
  variant: "support-ai-chat",
  data: reference,
  language: "en",
  form: {} as IComponentProps["form"],
  className: "caller-layout",
  apiProps: { options: { headers: { "X-Support-Test": "record-read" } } },
  children: <button type="submit">Send request</button>,
};
const request = { id: reference.id, ...props.apiProps };

beforeEach(() => {
  clientRead.mockReset();
  serverRead.mockReset();
  providerRender.mockReset();
  relationRender.mockReset();
});

it("loads the client record by ID and passes its ordered Step relation through the client form", () => {
  clientRead.mockReturnValue({ data: stored, isLoading: false });
  const html = renderToStaticMarkup(<CrmModuleForm {...props} />);
  expect(clientRead).toHaveBeenCalledWith(request);
  expect(serverRead).not.toHaveBeenCalled();
  expect(providerRender).toHaveBeenCalledTimes(1);
  expect(html).toContain('data-id="support-form-id"');
  expect(html).toContain("backend-record");
  expect(html).toContain("caller-layout");
  expect(html).not.toContain("stale-reference");
  expect(html).toContain('data-path="steps.first-step."');
  expect(html).toContain("Send request");
  expect(relationRender).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "find",
      isServer: false,
      apiProps: {
        params: {
          filters: {
            and: [{ column: "formId", method: "eq", value: reference.id }],
          },
          orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
        },
      },
    }),
  );
  expect(relationRender).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "default",
      dataSource: "props",
      form: props.form,
      language: "en",
      path: "steps.first-step.",
    }),
  );
});

it("keeps the fields and submit slot out of the view while the Form record is loading", () => {
  clientRead.mockReturnValue({ data: undefined, isLoading: true });
  const html = renderToStaticMarkup(<CrmModuleForm {...props} />);
  expect(clientRead).toHaveBeenCalledWith(request);
  expect(html).not.toContain('data-variant="support-ai-chat"');
  expect(html).not.toContain("Send request");
  expect(relationRender).not.toHaveBeenCalled();
});

it("props mode renders the refreshed record and strips SDK bindings from the interactive view", () => {
  const refreshed = { ...stored, className: "refreshed-record" };
  const variant = CrmModuleForm({
    ...props,
    data: refreshed,
    dataSource: "props",
  }) as ReactElement<any>;
  const parent = (variant.type as Function)(variant.props) as ReactElement<any>;
  const loaded = (parent.type as Function)(parent.props) as ReactElement<any>;
  const clientView = (loaded.type as Function)(
    loaded.props,
  ) as ReactElement<any>;
  for (const key of [
    "api",
    "Provider",
    "clientApi",
    "serverApi",
    "Component",
    "Skeleton",
  ])
    expect(clientView.props).not.toHaveProperty(key);
  expect(clientView.props.form).toBe(props.form);
  expect(clientView.props.isServer).toBe(false);
  const html = renderToStaticMarkup(loaded);
  expect(clientRead).not.toHaveBeenCalled();
  expect(serverRead).not.toHaveBeenCalled();
  expect(providerRender).not.toHaveBeenCalled();
  expect(html).toContain("refreshed-record");
  expect(html).not.toContain("stale-reference");
  expect(html).toContain("Send request");
});
