/** @jest-environment jsdom */
/** Public Form → relation → Step → relation → Input with persisted IDs. */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { Form } from "@sps/shared-ui-shadcn";
import { Component as CrmModuleForm } from "@sps/crm/models/form/frontend/component";
import {
  toRequestSubmission,
  type IRequestFields,
} from "@sps/crm/models/request/sdk/model";

const ids = {
  form: "00000000-0000-4000-8000-000000000001",
  step: "00000000-0000-4000-8000-000000000101",
  otherStep: "00000000-0000-4000-8000-000000000102",
  topic: "00000000-0000-4000-8000-000000000201",
  details: "00000000-0000-4000-8000-000000000202",
  result: "00000000-0000-4000-8000-000000000203",
  contact: "00000000-0000-4000-8000-000000000204",
  email: "00000000-0000-4000-8000-000000000301",
  phone: "00000000-0000-4000-8000-000000000302",
  submission: "00000000-0000-4000-8000-000000000401",
};
let mockRecords: Record<string, any[]>;
const mockReads = jest.fn();
const submitted = jest.fn();
function mockFind(kind: string, props: any) {
  mockReads(kind, props);
  const filters = props?.params?.filters?.and ?? [];
  let data = mockRecords[kind].filter((record) =>
    filters.every((filter: any) =>
      filter.method === "inArray"
        ? filter.value.includes(record[filter.column])
        : record[filter.column] === filter.value,
    ),
  );
  if (
    props?.params?.orderBy?.and?.some(
      (order: any) => order.column === "orderIndex",
    )
  )
    data = [...data].sort((a, b) => a.orderIndex - b.orderIndex);
  return { data, isLoading: false, isFetching: false };
}
function mockRead(kind: string, props: any) {
  mockReads(`${kind}.findById`, props);
  return {
    data: mockRecords[kind].find((record) => record.id === props.id),
    isLoading: false,
  };
}

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/crm/models/form/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    find: (props: any) => mockFind("forms", props),
    findById: (props: any) => mockRead("forms", props),
  },
}));
jest.mock("@sps/crm/models/form/sdk/server", () => ({ api: {} }));
jest.mock("@sps/crm/relations/forms-to-steps/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    find: (props: any) => mockFind("formSteps", props),
    findById: (props: any) => mockRead("formSteps", props),
  },
}));
jest.mock("@sps/crm/relations/forms-to-steps/sdk/server", () => ({ api: {} }));
jest.mock("@sps/crm/models/step/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    find: (props: any) => mockFind("steps", props),
    findById: (props: any) => mockRead("steps", props),
  },
}));
jest.mock("@sps/crm/models/step/sdk/server", () => ({ api: {} }));
jest.mock("@sps/crm/relations/steps-to-inputs/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    find: (props: any) => mockFind("stepInputs", props),
    findById: (props: any) => mockRead("stepInputs", props),
  },
}));
jest.mock("@sps/crm/relations/steps-to-inputs/sdk/server", () => ({ api: {} }));
jest.mock("@sps/crm/models/input/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    find: (props: any) => mockFind("inputs", props),
    findById: (props: any) => mockRead("inputs", props),
  },
}));
jest.mock("@sps/crm/models/input/sdk/server", () => ({ api: {} }));
jest.mock("@sps/crm/relations/inputs-to-options/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: { find: (props: any) => mockFind("inputOptions", props) },
}));
jest.mock("@sps/crm/relations/inputs-to-options/sdk/server", () => ({
  api: {},
}));
jest.mock("@sps/crm/models/option/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: { find: (props: any) => mockFind("options", props) },
}));
jest.mock("@sps/crm/models/option/sdk/server", () => ({ api: {} }));

// Keep each real public router/reader and only remove unrelated admin routes.
jest.mock("../variants", () => ({
  variants: { "support-ai-chat": jest.requireActual("./index").Component },
}));
jest.mock(
  "@sps/crm/relations/forms-to-steps/frontend/component/src/lib/singlepage/variants",
  () => ({
    variants: {
      find: jest.requireActual(
        "@sps/crm/relations/forms-to-steps/frontend/component/src/lib/singlepage/find",
      ).Component,
      default: jest.requireActual(
        "@sps/crm/relations/forms-to-steps/frontend/component/src/lib/singlepage/default",
      ).Component,
    },
  }),
);
jest.mock(
  "@sps/crm/models/step/frontend/component/src/lib/singlepage/variants",
  () => ({
    variants: {
      find: jest.requireActual(
        "@sps/crm/models/step/frontend/component/src/lib/singlepage/find",
      ).Component,
      default: jest.requireActual(
        "@sps/crm/models/step/frontend/component/src/lib/singlepage/default",
      ).Component,
    },
  }),
);
jest.mock(
  "@sps/crm/relations/steps-to-inputs/frontend/component/src/lib/singlepage/variants",
  () => ({
    variants: {
      find: jest.requireActual(
        "@sps/crm/relations/steps-to-inputs/frontend/component/src/lib/singlepage/find",
      ).Component,
      default: jest.requireActual(
        "@sps/crm/relations/steps-to-inputs/frontend/component/src/lib/singlepage/default",
      ).Component,
    },
  }),
);
jest.mock(
  "@sps/crm/models/input/frontend/component/src/lib/singlepage/variants",
  () => ({
    variants: {
      find: jest.requireActual(
        "@sps/crm/models/input/frontend/component/src/lib/singlepage/find",
      ).Component,
      "text-default": jest.requireActual(
        "@sps/crm/models/input/frontend/component/src/lib/singlepage/text-default",
      ).Component,
      "textarea-default": jest.requireActual(
        "@sps/crm/models/input/frontend/component/src/lib/singlepage/textarea-default",
      ).Component,
      "select-option-default": jest.requireActual(
        "@sps/crm/models/input/frontend/component/src/lib/singlepage/select-option-default",
      ).Component,
    },
  }),
);
jest.mock(
  "@sps/crm/relations/inputs-to-options/frontend/component/src/lib/singlepage/variants",
  () => ({
    variants: {
      find: jest.requireActual(
        "@sps/crm/relations/inputs-to-options/frontend/component/src/lib/singlepage/find",
      ).Component,
    },
  }),
);
jest.mock(
  "@sps/crm/models/option/frontend/component/src/lib/singlepage/variants",
  () => ({
    variants: {
      find: jest.requireActual(
        "@sps/crm/models/option/frontend/component/src/lib/singlepage/find",
      ).Component,
      default: ({ data, language }: any) => <span>{data.title[language]}</span>,
    },
  }),
);

function Component({ pending = false }: { pending?: boolean }) {
  const form = useForm<IRequestFields>({ defaultValues: { steps: {} } });
  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) =>
          submitted(toRequestSubmission(values, ids.submission)),
        )}
      >
        <CrmModuleForm
          isServer={false}
          variant="support-ai-chat"
          data={mockRecords.forms[0]}
          dataSource="props"
          language="en"
          form={form}
          pending={pending}
        >
          <button type="submit" disabled={pending}>
            Send request
          </button>
        </CrmModuleForm>
      </form>
    </Form>
  );
}

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.releasePointerCapture = jest.fn();
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
beforeEach(() => {
  mockReads.mockClear();
  submitted.mockReset();
  mockRecords = {
    forms: [{ id: ids.form, className: "", title: { en: "Support" } }],
    formSteps: [
      {
        id: "first-relation",
        formId: ids.form,
        stepId: ids.step,
        orderIndex: 0,
        variant: "default",
      },
      {
        id: "second-relation",
        formId: ids.form,
        stepId: ids.otherStep,
        orderIndex: 1,
        variant: "default",
      },
    ],
    steps: [
      { id: ids.step, variant: "default" },
      { id: ids.otherStep, variant: "default" },
    ],
    stepInputs: [
      {
        id: "topic-relation",
        stepId: ids.step,
        inputId: ids.topic,
        orderIndex: 0,
        variant: "default",
      },
      {
        id: "details-relation",
        stepId: ids.step,
        inputId: ids.details,
        orderIndex: 1,
        variant: "default",
      },
      {
        id: "result-relation",
        stepId: ids.otherStep,
        inputId: ids.result,
        orderIndex: 0,
        variant: "default",
      },
      {
        id: "contact-relation",
        stepId: ids.otherStep,
        inputId: ids.contact,
        orderIndex: 1,
        variant: "default",
      },
    ],
    inputs: [
      {
        id: ids.topic,
        variant: "text-default",
        label: { en: "Topic" },
        isRequired: true,
      },
      {
        id: ids.details,
        variant: "textarea-default",
        label: { en: "Details" },
      },
      {
        id: ids.result,
        variant: "text-default",
        label: { en: "Expected result" },
      },
      {
        id: ids.contact,
        variant: "select-option-default",
        label: { en: "Preferred contact" },
        placeholder: { en: "Choose contact" },
      },
    ],
    inputOptions: [
      {
        id: "email-option",
        inputId: ids.contact,
        optionId: ids.email,
        orderIndex: 0,
      },
      {
        id: "phone-option",
        inputId: ids.contact,
        optionId: ids.phone,
        orderIndex: 1,
      },
    ],
    options: [
      { id: ids.email, variant: "default", title: { en: "Email" } },
      { id: ids.phone, variant: "default", title: { en: "Phone" } },
    ],
  };
});

it("submits two Steps, multiline text and a selected Option UUID through the real public component chain", async () => {
  const { container } = render(<Component />);
  expect(container.querySelectorAll('[data-model="step"]')).toHaveLength(2);
  fireEvent.change(screen.getByRole("textbox", { name: "Topic" }), {
    target: { value: "Billing" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Details" }), {
    target: { value: "First line\nSecond line" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Expected result" }), {
    target: { value: "Please explain" },
  });
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Preferred contact" }),
    { key: "ArrowDown" },
  );
  fireEvent.click(await screen.findByRole("option", { name: "Email" }));
  fireEvent.click(screen.getByRole("button", { name: "Send request" }));
  await waitFor(() => expect(submitted).toHaveBeenCalledTimes(1));
  expect(submitted).toHaveBeenCalledWith({
    submissionId: ids.submission,
    steps: [
      {
        id: ids.step,
        inputs: [
          { id: ids.topic, string: "Billing" },
          { id: ids.details, string: "First line\nSecond line" },
        ],
      },
      {
        id: ids.otherStep,
        inputs: [
          { id: ids.result, string: "Please explain" },
          { id: ids.contact, option: ids.email },
        ],
      },
    ],
  });
  expect(mockReads).toHaveBeenCalledWith(
    "formSteps",
    expect.objectContaining({
      params: expect.objectContaining({
        filters: { and: [{ column: "formId", method: "eq", value: ids.form }] },
      }),
    }),
  );
  for (const stepId of [ids.step, ids.otherStep])
    expect(mockReads).toHaveBeenCalledWith(
      "stepInputs",
      expect.objectContaining({
        params: expect.objectContaining({
          filters: { and: [{ column: "stepId", method: "eq", value: stepId }] },
        }),
      }),
    );
});

it("metadata refresh and Step reordering preserve drafts by persisted Step/Input IDs", async () => {
  const { rerender, container } = render(<Component />);
  fireEvent.change(screen.getByRole("textbox", { name: "Topic" }), {
    target: { value: "Keep my topic" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Expected result" }), {
    target: { value: "Keep my result" },
  });
  mockRecords.formSteps = mockRecords.formSteps.map((record) => ({
    ...record,
    orderIndex: 1 - record.orderIndex,
  }));
  mockRecords.inputs = mockRecords.inputs.map((record) =>
    record.id === ids.topic
      ? { ...record, label: { en: "Updated topic" } }
      : { ...record },
  );
  rerender(<Component />);
  expect(screen.getByRole("textbox", { name: "Updated topic" })).toHaveValue(
    "Keep my topic",
  );
  expect(screen.getByRole("textbox", { name: "Expected result" })).toHaveValue(
    "Keep my result",
  );
  expect(
    [...container.querySelectorAll('[data-model="step"]')].map((node) =>
      node.getAttribute("data-id"),
    ),
  ).toEqual([ids.otherStep, ids.step]);
  expect(
    screen.getByRole("textbox", { name: "Updated topic" }),
  ).toHaveAttribute("name", `steps.${ids.step}.inputs.${ids.topic}.string`);
});

it("pending disables every persisted field and the submit control", () => {
  render(<Component pending />);
  for (const element of [
    ...screen.getAllByRole("textbox"),
    screen.getByRole("combobox"),
    screen.getByRole("button", { name: "Send request" }),
  ])
    expect(element).toBeDisabled();
});

it("required metadata validates before producing a transport payload", async () => {
  render(<Component />);
  fireEvent.click(screen.getByRole("button", { name: "Send request" }));
  expect(await screen.findByText("This field is required.")).toBeVisible();
  expect(submitted).not.toHaveBeenCalled();
});

it("keeps saved Option relation order even when the Option query returns a different order", async () => {
  mockRecords.options.reverse();
  render(<Component />);
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Preferred contact" }),
    { key: "ArrowDown" },
  );
  const options = await screen.findAllByRole("option");
  expect(options.map((option) => option.textContent)).toEqual([
    "Email",
    "Phone",
  ]);
});
