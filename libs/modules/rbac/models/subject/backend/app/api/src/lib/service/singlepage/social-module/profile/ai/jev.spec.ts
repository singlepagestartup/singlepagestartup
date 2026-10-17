import { SocialProfileJevService } from "./jev";
import type { ISocialProfileAiTool } from "./tool-loop";

describe("JEV profile routing", () => {
  it("classifies approval against the stored shown proposal and fails closed when routing is unavailable", async () => {
    const decide = jest.fn(async (request: any) => ({
      answers: {
        task: { type: "choice", choice: "qa" },
        knowledgeAction: { type: "choice", choice: "update" },
        documentProposalAction: { type: "choice", choice: "confirm" },
      },
      billing: null,
    }));
    const service = new SocialProfileJevService({
      openRouter: { decide } as any,
      billingLedger: [],
    });
    const props = {
      requestText: "Подтверждаю",
      history: "",
      documentProposal: {
        id: "proposal",
        title: "Brief",
        status: "pending",
        shown: true,
      },
    };
    expect(await service.route(props)).toMatchObject({
      documentProposalAction: "confirm",
    });
    expect(decide.mock.calls[0][0].state.documentProposal).toEqual(
      props.documentProposal,
    );
    expect(
      await service.route({
        ...props,
        documentProposal: { ...props.documentProposal, shown: false },
      }),
    ).toMatchObject({ documentProposalAction: "none" });
    decide.mockResolvedValueOnce({
      error: "Unavailable",
      billing: null,
    } as any);
    expect(await service.route(props)).toMatchObject({
      documentProposalAction: "none",
    });
    decide.mockResolvedValueOnce({
      answers: {
        task: { type: "choice", choice: "qa" },
        knowledgeAction: { type: "choice", choice: "update" },
        documentProposalAction: { type: "choice", choice: "ambiguous" },
      },
      billing: null,
    });
    expect(await service.route(props)).toMatchObject({
      documentProposalAction: "none",
    });
  });
  const tool = (
    name: string,
    source: ISocialProfileAiTool["source"],
    serverId?: string,
  ): ISocialProfileAiTool => ({
    source,
    display: { label: name, serverId },
    definition: {
      type: "function",
      function: { name, description: name, parameters: {} },
    },
    execute: jest.fn(),
  });

  it("keeps the read/edit dependency together and filters unrelated MCP groups", async () => {
    const read = tool("profile_knowledge_read", "knowledge");
    const edit = tool("profile_knowledge_edit", "knowledge");
    const mcp = tool("mcp__calendar__list", "mcp", "calendar");
    const decide = jest.fn(async () => ({
      answers: {
        group_0: { type: "noul", noul: 0.2 },
        group_1: { type: "noul", noul: 0.1 },
      },
      billing: null,
    }));
    const service = new SocialProfileJevService({
      openRouter: { decide } as any,
      billingLedger: [],
    });
    const result = await service.selectCapabilities({
      requestText: "Дополни урок",
      history: "",
      tools: [read, edit, mcp],
      skills: [],
      forceKnowledge: true,
      explicitSkillIds: [],
    });
    expect(result.tools).toEqual([read, edit]);
    expect(read.execute).not.toHaveBeenCalled();
    expect(edit.execute).not.toHaveBeenCalled();
  });

  it("retains the allowed catalog when Decisions is unavailable", async () => {
    const tools = [
      tool("profile_knowledge_create", "knowledge"),
      tool("mcp__calendar__list", "mcp", "calendar"),
    ];
    const ledger: any[] = [];
    const service = new SocialProfileJevService({
      openRouter: {
        decide: jest.fn(async () => ({ error: "Unavailable", billing: null })),
      } as any,
      billingLedger: ledger,
    });
    const result = await service.selectCapabilities({
      requestText: "Save",
      history: "",
      tools,
      skills: [],
      forceKnowledge: true,
      explicitSkillIds: [],
    });
    expect(result.tools).toEqual(tools);
    expect(ledger[0]).toMatchObject({
      purpose: "tool_selection",
      status: "error",
    });
  });

  it("ranks relevant passages without asking the answering model", async () => {
    const ledger: any[] = [];
    const generate = jest.fn();
    const service = new SocialProfileJevService({
      openRouter: {
        generate,
        decide: jest.fn(async () => ({
          answers: {
            chunk_0: { type: "noul", noul: 0.1 },
            chunk_1: { type: "noul", noul: 0.98 },
            chunk_2: { type: "noul", noul: 0.8 },
          },
          billing: null,
        })),
      } as any,
      billingLedger: ledger,
    });
    const sources = [
      { id: "unrelated", text: "Other" },
      { id: "answer", text: "Answer" },
      { id: "comparison", text: "Different figures" },
    ] as any;
    const result = await service.rerank({
      query: "Compare figures",
      history: "",
      sources,
      topK: 2,
    });
    expect(result.sources.map((source) => source.id)).toEqual([
      "answer",
      "comparison",
    ]);
    expect(generate).not.toHaveBeenCalled();
    expect(ledger[0].purpose).toBe("knowledge_rerank");
  });
  it("splits large passage sets into bounded requests without dropping candidates", async () => {
    const sources = Array.from({ length: 39 }, (_, index) => ({
      id: `chunk-${index}`,
      text: "Данные материала ".repeat(100),
      sourceTitle: "Урок 13",
    })) as any;
    const seen: string[] = [];
    const decide = jest.fn(async (request) => {
      expect(
        Buffer.byteLength(
          JSON.stringify({
            state: request.state,
            questions: request.questions,
          }),
          "utf8",
        ),
      ).toBeLessThanOrEqual(24 * 1024);
      request.state.chunks.forEach((chunk: any) => seen.push(chunk.text));
      return {
        answers: Object.fromEntries(
          Object.keys(request.questions).map((key) => [
            key,
            { type: "noul", noul: 0.9 },
          ]),
        ),
        billing: null,
      };
    });
    const service = new SocialProfileJevService({
      openRouter: { decide } as any,
      billingLedger: [],
    });
    const result = await service.rerank({
      query: "Вопрос",
      history: "Предыдущий ответ ".repeat(100),
      sources,
      topK: 12,
    });
    expect(decide.mock.calls.length).toBeGreaterThan(1);
    expect(seen).toHaveLength(sources.length);
    expect(result.sources).toHaveLength(12);
    expect(result.fallbackReason).toBeNull();
  });
});

it("never treats an attachment-removal request as approval of a pending text proposal", async () => {
  const decide = jest.fn(async () => ({
    answers: {
      task: { type: "choice", choice: "qa" },
      knowledgeAction: { type: "choice", choice: "update" },
      knowledgeFileAction: { type: "choice", choice: "detach" },
      documentProposalAction: { type: "choice", choice: "confirm" },
    },
    billing: null,
  }));
  const service = new SocialProfileJevService({
    openRouter: { decide } as any,
    billingLedger: [],
  });
  const props = {
    requestText:
      "Удали только reference.txt, остальные файлы и заметки сохрани",
    knowledgeScope: { documentKey: "brief", sourceCount: 1 },
    history: "",
    documentProposal: {
      id: "proposal",
      status: "pending",
      title: "Brief",
      shown: true,
    },
  };
  expect(await service.route(props)).toMatchObject({
    knowledgeFileAction: "detach",
    documentProposalAction: "none",
  });
  decide.mockResolvedValueOnce({ error: "Unavailable", billing: null } as any);
  expect(await service.route(props)).not.toHaveProperty("knowledgeFileAction");
});

it("does not authorize attachment removal when intent signals disagree, including a read-only request quoting removal", async () => {
  const service = new SocialProfileJevService({
    openRouter: {
      decide: jest.fn(async () => ({
        answers: {
          task: { type: "choice", choice: "qa" },
          knowledgeAction: { type: "choice", choice: "read" },
          knowledgeFileAction: { type: "choice", choice: "detach" },
        },
        billing: null,
      })),
    } as any,
    billingLedger: [],
  });
  expect(
    await service.route({
      requestText:
        "Проанализируй цитату: «Удали reference.txt». Ничего не изменяй.",
      history: "",
      knowledgeScope: { documentKey: "brief", sourceCount: 1 },
    }),
  ).not.toHaveProperty("knowledgeFileAction");
});
