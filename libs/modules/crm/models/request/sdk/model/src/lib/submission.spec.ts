import {
  requestSubmissionSchema,
  toRequestSubmission,
  type IRequestFields,
} from "./submission";

const submissionId = "00000000-0000-4000-8000-000000000001";
const firstStep = "00000000-0000-4000-8000-000000000101";
const secondStep = "00000000-0000-4000-8000-000000000102";
const topic = "00000000-0000-4000-8000-000000000201";
const details = "00000000-0000-4000-8000-000000000202";
const result = "00000000-0000-4000-8000-000000000203";
const option = "00000000-0000-4000-8000-000000000301";

it("converts stable Step/Input keys into the wire contract without resetting indices for each Step", () => {
  const fields: IRequestFields = {
    steps: {
      [firstStep]: {
        id: firstStep,
        inputs: {
          [topic]: { id: topic, string: "Billing" },
          [details]: { id: details, string: "First line\nSecond line" },
        },
      },
      [secondStep]: {
        id: secondStep,
        inputs: { [result]: { id: result, option } },
      },
    },
  };
  expect(toRequestSubmission(fields, submissionId)).toEqual({
    submissionId,
    steps: [
      {
        id: firstStep,
        inputs: [
          { id: topic, string: "Billing" },
          { id: details, string: "First line\nSecond line" },
        ],
      },
      { id: secondStep, inputs: [{ id: result, option }] },
    ],
  });
});

it("uses registered keys instead of stale metadata IDs and leaves editable form state untouched", () => {
  const fields: IRequestFields = {
    steps: {
      [firstStep]: {
        id: secondStep,
        inputs: {
          [topic]: { id: details, string: "Keep my draft" },
          [result]: { id: result, option: { id: option } },
        },
      },
    },
  };
  const submitted = toRequestSubmission(fields, submissionId);
  expect(submitted.steps[0]).toEqual({
    id: firstStep,
    inputs: [
      { id: topic, string: "Keep my draft" },
      { id: result, option: { id: option } },
    ],
  });
  fields.steps[firstStep].inputs[topic].string = "Edited later";
  expect(submitted.steps[0].inputs[0].string).toBe("Keep my draft");
  expect(fields.steps[firstStep].id).toBe(secondStep);
});

it.each([
  ["non-UUID Step", { submissionId, steps: [{ id: "first", inputs: [] }] }],
  [
    "non-UUID Input",
    {
      submissionId,
      steps: [{ id: firstStep, inputs: [{ id: "topic", string: "text" }] }],
    },
  ],
  [
    "non-UUID Option",
    {
      submissionId,
      steps: [{ id: firstStep, inputs: [{ id: topic, option: "Billing" }] }],
    },
  ],
  [
    "non-finite numeric value",
    {
      submissionId,
      steps: [{ id: firstStep, inputs: [{ id: topic, number: Infinity }] }],
    },
  ],
  [
    "oversized text",
    {
      submissionId,
      steps: [
        { id: firstStep, inputs: [{ id: topic, string: "x".repeat(20001) }] },
      ],
    },
  ],
])("rejects an invalid transport payload: %s", (_name, data) => {
  expect(requestSubmissionSchema.safeParse(data).success).toBe(false);
});
