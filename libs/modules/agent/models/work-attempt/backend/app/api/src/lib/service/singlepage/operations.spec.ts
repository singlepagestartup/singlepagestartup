import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
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

const model = "text-embedding-3-large";
const question = "The brief is for a catalogue studio.";
const source = { id: "expert-reference", version: "indexed" };

function entryWork(stageEntryKnowledgeQuery?: string) {
  const contextForRun = jest.fn().mockResolvedValue({
    messages: [
      { role: "user", content: "A message whose authorship was not verified." },
      { role: "system", content: "The assigned stage has just started." },
    ],
    stageEntryKnowledgeQuery,
    knowledgeSourceIds: [source.id],
    knowledgeCandidateVersions: [source],
  });
  const resolveWork = jest.fn(async (_store, _assignee, capability) => ({
    provider: "openai",
    model: capability === "embedding" ? model : "gpt-5.4-mini-2026-03-17",
  }));
  const work = new Operations({
    modules: {
      crm: {
        task: {
          getWork: jest.fn().mockResolvedValue({
            task: {
              id: "task",
              storeId: "store",
              publicationId: "publication",
            },
            stage: {
              operations: [
                "request-routing",
                "tool-selection",
                "knowledge-search",
              ],
            },
            funding: { payer: "customer", multiplier: "2" },
          }),
        },
      },
      rbac: {
        subject: {
          providerConnections: { resolveWork, workScope: jest.fn() },
          customerWork: { contextForRun },
        },
      },
      knowledge: { source: {} },
    },
  } as unknown as ConstructorParameters<typeof Operations>[0]);
  const run = { assignmentRevision: 1 } as ICustomerWorkRun;
  return { work, run, resolveWork, contextForRun };
}

afterEach(() => jest.restoreAllMocks());

it("skips the provider and paid search on stage entry without an authorized buyer question", async () => {
  const { work, run, contextForRun, resolveWork } = entryWork();
  const perform = jest.fn();
  const search = jest.spyOn(
    KnowledgeService.prototype,
    "searchAuthorizedSources",
  );

  await expect(work.plan(run, perform)).resolves.toEqual({});
  expect(contextForRun).toHaveBeenCalledWith(run, { knowledgeScopeOnly: true });
  expect(resolveWork).not.toHaveBeenCalled();
  expect(search).not.toHaveBeenCalled();
  expect(perform).not.toHaveBeenCalled();
});

it.each(["delivered", "failed"])(
  "uses the explicitly authorized stage-entry query only through one paid operation when it is %s",
  async (state) => {
    const { work, run, contextForRun } = entryWork(question);
    const data = {
      id: "embedding-attempt",
      state,
      result: { embeddings: { model, dimensions: 2, values: [[1, 0]] } },
    };
    const perform = jest.fn().mockResolvedValue(data);
    const search = jest
      .spyOn(KnowledgeService.prototype, "searchAuthorizedSources")
      .mockImplementation(async ({ query, embedQuery }) => {
        const embedding = await embedQuery?.(query, {
          provider: "openai",
          model,
          dimensions: 2,
        });
        expect(embedding).toEqual(state === "delivered" ? [1, 0] : undefined);
        if (!embedding) {
          return [];
        }
        return [
          {
            id: "chunk",
            text: "List open questions in the brief.",
            sourceId: source.id,
            sourceVersion: source.version,
            sourceTitle: "Brief method",
            chunkIndex: 0,
            distance: 0,
            similarity: 1,
            retrievalRole: "seed",
            metadata: {},
          },
        ];
      });

    const plan = await work.plan(run, perform);
    expect(contextForRun).toHaveBeenCalledWith(run, {
      knowledgeScopeOnly: true,
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(perform).toHaveBeenCalledTimes(1);
    expect(perform).toHaveBeenCalledWith({
      operation: "knowledge-search",
      input: {
        capability: "embedding",
        inputs: [question],
        dimensions: 2,
        sourceIds: [source.id],
      },
    });
    if (state === "failed") {
      expect(plan).toEqual({ blocked: data });
    } else {
      expect(plan.sourceVersions).toEqual([source]);
      expect(plan.evidence).toContainEqual({
        role: "system",
        content: expect.stringContaining("List open questions in the brief."),
      });
    }
  },
);
