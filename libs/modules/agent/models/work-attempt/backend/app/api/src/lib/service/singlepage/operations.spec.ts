import type { ICustomerWorkRun } from "@sps/rbac/models/subject/sdk/model";
import { Operations } from "./operations";

it.each([
  { label: "an unset list", operations: undefined },
  { label: "an empty list", operations: [] },
  { label: "legacy media flags", operations: ["vision", "transcription"] },
])(
  "makes no preparatory model call for a message containing attachments with $label",
  async ({ operations }) => {
    const resolveWork = jest.fn();
    const contextForRun = jest.fn().mockResolvedValue({
      messages: [{ role: "user", content: "" }],
      inputAttachments: [{ id: "first" }, { id: "second" }],
    });
    const perform = jest.fn();
    const work = new Operations({
      modules: {
        crm: {
          task: {
            getWork: jest
              .fn()
              .mockResolvedValue({ task: {}, stage: { operations } }),
          },
        },
        rbac: {
          subject: {
            providerConnections: { resolveWork },
            customerWork: { contextForRun },
          },
        },
      },
    } as unknown as ConstructorParameters<typeof Operations>[0]);
    const run = { assignmentRevision: 1 } as ICustomerWorkRun;

    await expect(work.plan(run, perform)).resolves.toEqual({});
    expect(resolveWork).not.toHaveBeenCalled();
    expect(contextForRun).not.toHaveBeenCalled();
    expect(perform).not.toHaveBeenCalled();
  },
);
