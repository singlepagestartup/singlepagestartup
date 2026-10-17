/** @jest-environment jsdom */
/** Subject owns submission identity, request lifetime and retries. CRM owns fields. */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Component } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

const ids = {
  subject: "00000000-0000-4000-8000-000000000001",
  form: "00000000-0000-4000-8000-000000000002",
  step: "00000000-0000-4000-8000-000000000101",
  topic: "00000000-0000-4000-8000-000000000201",
  details: "00000000-0000-4000-8000-000000000202",
  submission: "00000000-0000-4000-8000-000000000301",
};
const mutateAsync = jest.fn();
const randomUUID = jest.fn();
const originalRandomUUID = Object.getOwnPropertyDescriptor(
  crypto,
  "randomUUID",
);
const mockFormReads = jest.fn();
const mockFormView = jest.fn();
let mockPending = false;
let mockForms: any[];

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    crmModuleFromRequestCreate: () => ({ mutateAsync, isPending: mockPending }),
  },
}));
jest.mock("@sps/crm/models/form/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      mockFormReads(props.apiProps);
      return props.children({ data: mockForms });
    }
    mockFormView(props);
    return (
      <>
        {!props.submitted && (
          <fieldset disabled={props.pending}>
            <label>
              Topic
              <input
                {...props.form.register(
                  `steps.${ids.step}.inputs.${ids.topic}.string`,
                )}
              />
            </label>
            <label>
              Details
              <textarea
                {...props.form.register(
                  `steps.${ids.step}.inputs.${ids.details}.string`,
                )}
              />
            </label>
          </fieldset>
        )}
        {props.children}
      </>
    );
  },
}));
jest.mock("@sps/ui-adapter", () => ({
  Icon: () => <span aria-hidden="true" />,
}));

const props = {
  isServer: false,
  variant: "me-crm-module-form-support-ai-chat",
  data: { id: ids.subject },
  crmModuleFormId: ids.form,
  language: "en",
} as IComponentPropsExtended;

beforeAll(() => {
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: randomUUID,
  });
});
afterAll(() => {
  if (originalRandomUUID)
    Object.defineProperty(crypto, "randomUUID", originalRandomUUID);
  else delete (crypto as any).randomUUID;
});
beforeEach(() => {
  mutateAsync.mockReset();
  mockFormReads.mockClear();
  mockFormView.mockClear();
  mockPending = false;
  mockForms = [{ id: ids.form }];
  randomUUID.mockReset().mockReturnValue(ids.submission);
});
afterEach(() => jest.restoreAllMocks());

function fillRequest() {
  fireEvent.change(screen.getByRole("textbox", { name: "Topic" }), {
    target: { value: "Billing" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Details" }), {
    target: { value: "First line\nSecond line" },
  });
}
function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector("form")!);
}

it("submits one request for repeated submit events while the first mutation is unresolved", async () => {
  let resolve: (value: unknown) => void = () => {};
  mutateAsync.mockImplementation(
    () =>
      new Promise((complete) => {
        resolve = complete;
      }),
  );
  const { container } = render(<Component {...props} />);
  fillRequest();
  submit(container);
  submit(container);
  await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
  expect(mockFormReads).toHaveBeenCalledWith({
    params: {
      filters: { and: [{ column: "id", method: "eq", value: ids.form }] },
    },
  });
  expect(mutateAsync).toHaveBeenCalledWith({
    id: ids.subject,
    crmModuleFormId: ids.form,
    data: {
      submissionId: ids.submission,
      steps: [
        {
          id: ids.step,
          inputs: [
            { id: ids.topic, string: "Billing" },
            { id: ids.details, string: "First line\nSecond line" },
          ],
        },
      ],
    },
  });
  await act(async () => {
    resolve({ id: "created-request" });
  });
  expect(screen.getByRole("status")).toBeVisible();
  expect(
    screen.queryByRole("textbox", { name: "Topic" }),
  ).not.toBeInTheDocument();
});

it("failed submission keeps the draft and retries the same idempotency ID", async () => {
  mutateAsync
    .mockRejectedValueOnce(new Error("Test provider unavailable"))
    .mockResolvedValueOnce({ id: "created-request" });
  const { container } = render(<Component {...props} />);
  fillRequest();
  submit(container);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Test provider unavailable",
  );
  expect(screen.getByRole("textbox", { name: "Topic" })).toHaveValue("Billing");
  expect(screen.getByRole("textbox", { name: "Details" })).toHaveValue(
    "First line\nSecond line",
  );
  submit(container);
  await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
  expect(mutateAsync.mock.calls[1][0]).toEqual(mutateAsync.mock.calls[0][0]);
  expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole("status")).toBeVisible();
});

it("pending prevents edits and disables the visible submit control", () => {
  mockPending = true;
  render(<Component {...props} />);
  expect(screen.getByRole("textbox", { name: "Topic" })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "Details" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
  expect(mutateAsync).not.toHaveBeenCalled();
});

it.each([
  { records: [] },
  { records: [{ id: ids.form }, { id: "ambiguous-form" }] },
])(
  "does not expose a submission form without exactly one selected Form",
  ({ records }) => {
    mockForms = records;
    render(<Component {...props} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Support form is unavailable.",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  },
);

it("switching Subject or Form starts a separate draft and forwards the active locale", () => {
  const { rerender } = render(<Component {...props} />);
  fillRequest();
  rerender(
    <Component
      {...props}
      data={{ ...props.data, id: "00000000-0000-4000-8000-000000000011" }}
      language="ru"
    />,
  );
  expect(screen.getByRole("textbox", { name: "Topic" })).toHaveValue("");
  expect(mockFormView).toHaveBeenLastCalledWith(
    expect.objectContaining({ language: "ru" }),
  );
  fillRequest();
  const formId = "00000000-0000-4000-8000-000000000012";
  mockForms = [{ id: formId }];
  rerender(<Component {...props} crmModuleFormId={formId} />);
  expect(screen.getByRole("textbox", { name: "Topic" })).toHaveValue("");
  expect(mutateAsync).not.toHaveBeenCalled();
});

it("successful submission ignores duplicate submits and permits a deliberate edited request with a new ID", async () => {
  const nextId = "00000000-0000-4000-8000-000000000302";
  randomUUID.mockReturnValueOnce(ids.submission).mockReturnValueOnce(nextId);
  mutateAsync.mockResolvedValue({ id: "created-request" });
  const { container } = render(<Component {...props} />);
  fillRequest();
  submit(container);
  expect(await screen.findByRole("status")).toBeVisible();
  await act(async () => {
    submit(container);
  });
  expect(mutateAsync).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Edit request" }));
  expect(screen.getByRole("textbox", { name: "Topic" })).toHaveValue("Billing");
  fireEvent.change(screen.getByRole("textbox", { name: "Topic" }), {
    target: { value: "Updated topic" },
  });
  submit(container);
  await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
  expect(mutateAsync.mock.calls[1][0].data.submissionId).toBe(nextId);
  expect(mutateAsync.mock.calls[1][0].data.steps[0].inputs[0].string).toBe(
    "Updated topic",
  );
});

it.each(["sent", "failed", "queued"] as const)(
  "announces one saved-request receipt with the %s notification outcome",
  async (notificationStatus) => {
    mutateAsync.mockResolvedValue({
      id: "created-request",
      submissionResult: { notificationStatus },
    });
    const { container } = render(<Component {...props} />);
    fillRequest();
    submit(container);
    const status = await screen.findByRole("status");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(status).toHaveTextContent("Support request submitted.");
    if (notificationStatus === "sent") {
      expect(status).not.toHaveTextContent(
        "Notification delivery is not confirmed yet.",
      );
    } else {
      expect(status).toHaveTextContent(
        "Your request is saved. Notification delivery is not confirmed yet.",
      );
    }
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  },
);

it("localizes an unconfirmed notification warning within the same saved-request live region", async () => {
  mutateAsync.mockResolvedValue({
    id: "created-request",
    submissionResult: { notificationStatus: "failed" },
  });
  const { container } = render(<Component {...props} language="ru" />);
  fillRequest();
  submit(container);
  const status = await screen.findByRole("status");
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(status).toHaveTextContent(
    "Заявка сохранена. Доставка уведомления пока не подтверждена.",
  );
});
