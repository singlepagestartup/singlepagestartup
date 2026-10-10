import {
  documentAgent,
  resolveThreadAgent,
  snapshotAgent,
  AI_CHAT_AGENTS,
} from "./ai-chat-agent-resolver";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  AI_CHAT_DOCUMENT_GUIDES,
  parseProjectDocumentDefinitions,
  parseProjectDocumentGuides,
  projectDocumentGuide,
  validateProjectDocumentGuides,
} from "../../products/singlepage/ai-chat/website/content";
import {
  createProjectProfile,
  attachProjectAsset,
  createProjectTopic,
  detachProjectFile,
  topicAgentContext,
  documentAgentContext,
  documentWorkingOn,
  hasProjectMaterials,
  prepareProjectDocuments,
  projectDocumentText,
  sendProjectMessage,
  topicDocumentContext,
} from "./ai-chat-workspace";

const definitions = parseProjectDocumentDefinitions(
  readFileSync(
    new URL(
      "../../products/singlepage/ai-chat/website/project-workspace.md",
      import.meta.url,
    ),
    "utf8",
  ),
);
const projectDefinitions = Object.values(definitions).filter(
  (item) => item.id !== "product",
);
function projectWithDrafts() {
  return prepareProjectDocuments(
    {
      ...createProjectProfile("workshop", "Pottery workshops"),
      notes: "Weekend workshops for adults.",
      sources: [
        { id: "notes", name: "Notes.md", text: "Make cups by hand.", size: 20 },
        {
          id: "image",
          name: "Studio.jpg",
          text: "",
          size: 2000,
          mimeType: "image/jpeg",
          fileUrl: "blob:studio",
        },
      ],
    },
    projectDefinitions,
  );
}

describe("AI Chat project workflow", () => {
  test("preserves Markdown and significant whitespace through export and current agent context", () => {
    const project = projectWithDrafts();
    const markdown =
      "    code with indentation\n\n### Offer\n\n**Cup workshop**\n\n- [ ] Confirm dates\n\n| Offer | Price |\n| --- | --- |\n| Cup | Unknown |\n\nHard break  \nNext line\n";
    const document = {
      ...project.documents[0],
      values: { "Project and products": markdown },
    };
    const expected = `## Project and products\n\n${markdown}`;
    expect(projectDocumentText(document)).toContain(expected);
    expect(documentAgentContext(project, document)[0].text).toBe(expected);
    expect(
      topicDocumentContext({ ...project, documents: [document] }, [
        document.id,
      ])[0].text,
    ).toContain(expected);
  });
  test("requires a project name and scaffolds documents without materials", () => {
    expect(() => createProjectProfile("project", "  ")).toThrow();
    const project = createProjectProfile("project", "  Pottery  ");
    expect(project.name).toBe("Pottery");
    expect(project.stage).toBe("upload");
    expect(hasProjectMaterials(project)).toBe(false);
    const scaffold = prepareProjectDocuments(project, projectDefinitions);
    expect(scaffold.documents).toHaveLength(5);
    expect(scaffold.documents[0].values).toEqual({
      "Project and products": "Pottery",
    });
    expect(
      scaffold.documents.every((document) => !document.assets?.length),
    ).toBe(true);
  });
  test("keeps supplied text attributed and leaves unsupported decisions open", () => {
    const project = projectWithDrafts();
    expect(project.documents.map((item) => item.title)).toEqual([
      "Brief",
      "Strategy",
      "Brand",
      "Design",
      "Products",
    ]);
    expect(projectDocumentText(project.documents[0])).toContain(
      "Notes.md:\nMake cups by hand.",
    );
    expect(projectDocumentText(project.documents[0])).toContain(
      "Studio.jpg: attached material; interpretation needs review.",
    );
    expect(project.documents[1].values).toEqual({});
    expect(definitions.product.sections.map((item) => item.title)).toEqual([
      "Product identity",
      "Customer Segments",
      "Problem and desired progress",
      "Value Propositions",
      "Offer and usage",
      "Revenue Streams",
      "Key Activities",
      "Key Resources",
      "Key Partnerships",
      "Cost Structure",
      "Assumptions and decision rules",
      "Business goals and metrics",
      "Sales",
      "Promotion",
      "Analytics & Research",
    ]);
  });

  test("threads start without materials and use current profile knowledge on every response", () => {
    let project = createProjectTopic(
      createProjectProfile("empty", "Empty"),
      "topic",
      "Start",
      [],
    );
    expect(project.topics).toHaveLength(1);
    expect(topicAgentContext(project, project.topics[0])).toEqual([]);
    project = { ...project, documents: projectWithDrafts().documents };
    const first = sendProjectMessage(project, "topic", {
      userId: "u1",
      assistantId: "a1",
      text: "First",
      reply: "Answer",
    });
    const oldText = first.topics[0].messages.at(-1)!.context![0].text;
    const updated = {
      ...first,
      documents: first.documents.map((document, index) =>
        index === 0
          ? {
              ...document,
              values: {
                ...document.values,
                "Current state": "New current knowledge",
              },
            }
          : document,
      ),
    };
    const second = sendProjectMessage(updated, "topic", {
      userId: "u2",
      assistantId: "a2",
      text: "Next",
      reply: "Answer",
    });
    expect(second.topics[0].messages.at(-1)?.context).toHaveLength(
      updated.documents.length,
    );
    expect(second.topics[0].messages.at(-1)?.context?.[0].text).toContain(
      "New current knowledge",
    );
    expect(second.topics[0].messages.at(-3)?.context?.[0].text).toBe(oldText);
    expect(oldText).not.toContain("New current knowledge");
  });
  test("detach removes only the selected Source/File link and keeps shared stored files", () => {
    const project = projectWithDrafts();
    const document = project.documents[0];
    const file = project.sources[1];
    const linked = attachProjectAsset(
      attachProjectAsset(document, file, document.sections[0].title, "first"),
      file,
      document.sections[1].title,
      "second",
    );
    const detached = detachProjectFile(
      linked,
      file.id,
      document.sections[0].title,
    );
    expect(
      detached.assets?.some(
        (asset) =>
          asset.file.id === file.id &&
          asset.section === document.sections[0].title,
      ),
    ).toBe(false);
    expect(
      detached.assets?.some(
        (asset) =>
          asset.file.id === file.id &&
          asset.section === document.sections[1].title,
      ),
    ).toBe(true);
    expect(project.sources).toContain(file);
  });
  test("another project starts without the first project's materials or threads", () => {
    const first = projectWithDrafts();
    const second = createProjectProfile("second", "Another project");
    expect(second.sources).toEqual([]);
    expect(second.documents).toEqual([]);
    expect(second.topics).toEqual([]);
    expect(first.documents).toHaveLength(5);
  });
  test("sending files without text keeps document changes pending and retains the file bytes", () => {
    const project = projectWithDrafts();
    const file = {
      id: "chat-image",
      name: "Reference.jpg",
      text: "",
      size: 20,
      mimeType: "image/jpeg",
      fileUrl: "blob:chat-image",
    };
    project.documents[0] = {
      ...project.documents[0],
      draftFiles: [file],
      proposal: { section: "Current state", text: "An earlier proposal." },
    };
    const before = project.documents[0];
    const sent = sendProjectMessage(project, "brief", {
      userId: "user",
      assistantId: "answer",
      text: "  ",
      reply: "What should we check?",
      section: "Current state",
    });
    const after = sent.documents[0];
    expect(after.values).toEqual(before.values);
    expect(after.proposal).toEqual(before.proposal!);
    expect(after.draftFiles).toEqual([]);
    expect(after.messages.at(-2)?.files?.[0]).toEqual(file);
    expect(after.messages.at(-1)?.filesUsed?.[0]).toEqual(file);
    expect(sent.sources.at(-1)).toEqual(file);
    file.name = "Changed filename";
    expect(after.messages.at(-2)?.files?.[0].name).toBe("Reference.jpg");
  });
  test("conversation files stay isolated and follow-up messages use only that conversation's files", () => {
    const project = projectWithDrafts();
    const first = {
      id: "first-file",
      name: "Audience.md",
      text: "Adults trying pottery.",
      size: 22,
      fileUrl: "blob:audience",
    };
    const other = {
      ...first,
      id: "other-file",
      name: "Brand.md",
      fileUrl: "blob:brand",
    };
    project.documents[1].draftFiles = [first];
    project.documents[2].draftFiles = [other];
    const sent = sendProjectMessage(project, "strategy", {
      userId: "user",
      assistantId: "answer",
      text: "Adults trying pottery.",
      reply: "Check the proposed update.",
      section: "Audiences and product roles",
    });
    expect(sent.documents[1].values).toEqual({});
    expect(sent.documents[1].proposal).toEqual({
      section: "Audiences and product roles",
      text: "Adults trying pottery.",
    });
    expect(sent.documents[2]).toBe(project.documents[2]);
    expect(sent.sources.some((file) => file.id === other.id)).toBe(false);
    const continued = sendProjectMessage(sent, "strategy", {
      userId: "next",
      assistantId: "next-answer",
      text: "Refine this audience.",
      reply: "Check the revision.",
      section: "Audiences and product roles",
    });
    expect(continued.documents[1].messages.at(-1)?.filesUsed).toEqual([first]);
    expect(
      continued.sources.filter((file) => file.id === first.id),
    ).toHaveLength(1);
    expect(createProjectProfile("second", "Another project").sources).toEqual(
      [],
    );
    expect(
      sendProjectMessage(continued, "strategy", {
        userId: "empty",
        assistantId: "empty-answer",
        text: " ",
        reply: "Nothing to send.",
      }),
    ).toBe(continued);
  });
  test("thread attachments supplement the current knowledge context", () => {
    const project = projectWithDrafts();
    const threaded = createProjectTopic(project, "offer", "Offer", ["brief"]);
    const file = {
      id: "offer-file",
      name: "Offer.md",
      text: "Weekend beginner workshops.",
      size: 26,
      fileUrl: "blob:offer",
    };
    threaded.topics[0].draftFiles = [file];
    const sent = sendProjectMessage(threaded, "offer", {
      userId: "user",
      assistantId: "answer",
      text: "",
      reply: "What should we work on?",
    });
    const reply = sent.topics[0].messages.at(-1)!;
    expect(reply.context?.[0].text).toBe(
      projectDocumentText(project.documents[0]),
    );
    expect(reply.filesUsed).toEqual([file]);
    expect(sent.topics[0].draftFiles).toEqual([]);
    expect(sent.documents).toEqual(project.documents);
    expect(sent.sources.at(-1)).toEqual(file);
    expect(() =>
      sendProjectMessage(sent, "missing", {
        userId: "bad",
        assistantId: "bad-answer",
        text: "Hi",
        reply: "Hi",
      }),
    ).toThrow();
  });
  test("visual sources become attributable references without inferred visual decisions", () => {
    const project = projectWithDrafts();
    const request = project.documents[0];
    const design = project.documents.find(
      (document) => document.id === "design",
    )!;
    expect(request.assets?.[0].section).toBe("Visual reference intake");
    expect(design.assets?.[0].section).toBe("Outputs and provenance");
    expect(design.assets?.[0].file.fileUrl).toBe("blob:studio");
    expect(design.values).toEqual({});
    expect(project.documents[1].assets).toEqual([]);
  });
});

describe("AI Chat document guidance", () => {
  test("keeps canonical Studio fields and their published guidance in sync", () => {
    const text = readFileSync(
      new URL(
        "../../products/singlepage/ai-chat/content/document-guides.md",
        import.meta.url,
      ),
      "utf8",
    );
    const guides = parseProjectDocumentGuides(text);
    expect(() =>
      validateProjectDocumentGuides(definitions, guides),
    ).not.toThrow();
    for (const [id, guide] of Object.entries(guides)) {
      const published =
        AI_CHAT_DOCUMENT_GUIDES[id as keyof typeof AI_CHAT_DOCUMENT_GUIDES];
      const template = readFileSync(
        new URL(`../../../../../${published.templateSource}`, import.meta.url),
        "utf8",
      );
      expect(published.templateSha256).toBe(
        createHash("sha256").update(template).digest("hex"),
      );
      expect(published.body).toBe(guide.body);
      expect(guide.basis).toBe(published.basis);
      expect(published.sections as Record<string, string>).toEqual(
        guide.sections,
      );
      const headings = [...template.matchAll(/^## (.+)$/gm)].map(
        (match) => match[1],
      );
      if (id === "products") {
        expect(
          definitions[id].sections.map((section) => section.title),
        ).toEqual(["Products"]);
      } else {
        expect(
          definitions[id].sections
            .slice(0, headings.length)
            .map((section) => section.title),
        ).toEqual(headings);
      }
      expect(guide.body).toMatch(/\[.+?\]\(https:\/\//);
      for (const body of Object.values(guide.sections)) {
        expect(body).toContain("## Why this section exists");
        expect(body).toContain("## What to record");
        expect(body).toContain("## Review boundary");
      }
    }
  });
  test("rejects incomplete guidance instead of publishing silent gaps", () => {
    const guides = structuredClone(AI_CHAT_DOCUMENT_GUIDES);
    delete (guides.brief.sections as Record<string, string>)["Current state"];
    expect(() => validateProjectDocumentGuides(definitions, guides)).toThrow(
      "brief",
    );
    expect(() =>
      parseProjectDocumentGuides(
        "<!-- document: brief -->\n# Brief.md\n\n<!-- section: Empty -->",
      ),
    ).toThrow();
    expect(() =>
      parseProjectDocumentGuides(
        "<!-- document: brief -->\n# Brief.md\nBody\n<!-- document: brief -->\n# Brief.md\nOther body",
      ),
    ).toThrow("Duplicate");
  });
  test("uses Product guidance for created offers and keeps intake in its owning sections", () => {
    expect(
      projectDocumentGuide(AI_CHAT_DOCUMENT_GUIDES, "workspace-product-1"),
    ).toBe(AI_CHAT_DOCUMENT_GUIDES.product);
    expect(projectDocumentGuide(AI_CHAT_DOCUMENT_GUIDES, "product-1")).toBe(
      AI_CHAT_DOCUMENT_GUIDES.product,
    );
    expect(
      projectDocumentGuide(AI_CHAT_DOCUMENT_GUIDES, "unknown"),
    ).toBeUndefined();
    const brief = projectWithDrafts().documents[0];
    expect(brief.values["Current state"]).toStartWith(
      "Supplied intake (needs review):",
    );
    expect(brief.values["Customers and value"]).toBeUndefined();
    expect(brief.assets?.[0].section).toBe("Visual reference intake");
    expect(
      brief.sections.some(
        (section) => section.title === brief.assets?.[0].section,
      ),
    ).toBe(true);
  });
});

describe("AI Chat agent profiles", () => {
  test("keeps an explicit no-agent thread and its document context through messages and serialization", () => {
    const base = projectWithDrafts();
    const project = {
      ...base,
      documents: base.documents.map((document) =>
        document.id === "strategy"
          ? {
              ...document,
              values: {
                [document.sections[0].title]: "Adults trying pottery.",
              },
            }
          : document,
      ),
    };
    const created = createProjectTopic(
      project,
      "no-agent",
      "Open discussion",
      ["brief", "strategy"],
      null,
    );
    expect(created.topics[0].agent).toBeNull();
    expect(created.topics[0].messages[0].agent).toBeNull();
    const restored = JSON.parse(JSON.stringify(created));
    restored.topics[0].draftFiles = [
      { id: "extra", name: "Extra.md", text: "New evidence", size: 12 },
    ];
    const sent = sendProjectMessage(restored, "no-agent", {
      userId: "u",
      assistantId: "a",
      text: "Discuss the attached documents.",
      reply: "Let's review the project.",
    });
    const answer = sent.topics[0].messages.at(-1)!;
    expect(answer.agent).toBeNull();
    expect(answer.context?.map((item) => item.name)).toEqual([
      "Brief.md",
      "Strategy.md",
      "Brand.md",
      "Design.md",
      "Products.md",
    ]);
    expect(answer.context?.[0].text).toBe(
      projectDocumentText(project.documents[0]),
    );
    expect(answer.filesUsed?.[0].text).toBe("New evidence");
    expect(sent.topics[0].agent).toBeNull();
    expect(sent.topics[0].messages[1].text).toBe(
      "Discuss the attached documents.",
    );
    expect(resolveThreadAgent(null)).toBeNull();
    expect(resolveThreadAgent(undefined)?.id).toBe(documentAgent("thread").id);
  });
  test("retains historical attribution when switching between a role and no agent", () => {
    const base = projectWithDrafts();
    const project = base;
    const created = createProjectTopic(project, "switch", "Discussion", [
      "brief",
    ]);
    const noAgent = {
      ...created,
      topics: created.topics.map((topic) => ({ ...topic, agent: null })),
    };
    const first = sendProjectMessage(noAgent, "switch", {
      userId: "u1",
      assistantId: "a1",
      text: "Discuss without a role.",
      reply: "First answer",
    });
    const withRole = {
      ...first,
      topics: first.topics.map((topic) => ({
        ...topic,
        agent: documentAgent("brief"),
      })),
    };
    const second = sendProjectMessage(withRole, "switch", {
      userId: "u2",
      assistantId: "a2",
      text: "Now collect the brief.",
      reply: "Second answer",
    });
    expect(second.topics[0].messages[0].agent?.id).toBe(
      documentAgent("thread").id,
    );
    expect(
      second.topics[0].messages.find((message) => message.id === "a1")?.agent,
    ).toBeNull();
    expect(second.topics[0].messages.at(-1)?.agent?.id).toBe("account-manager");
    const legacy = {
      ...second,
      topics: second.topics.map((topic) => ({ ...topic, agent: undefined })),
    };
    const legacyReply = sendProjectMessage(legacy, "switch", {
      userId: "u3",
      assistantId: "a3",
      text: "Continue a legacy thread.",
      reply: "Legacy answer",
    });
    expect(legacyReply.topics[0].messages.at(-1)?.agent?.id).toBe(
      documentAgent("thread").id,
    );
  });
  test("assigns the document specialist and preserves the replying agent", () => {
    const project = projectWithDrafts();
    expect(
      project.documents.find((item) => item.id === "brief")?.messages[0].agent
        ?.id,
    ).toBe("account-manager");
    expect(
      project.documents.find((item) => item.id === "design")?.messages[0].agent
        ?.id,
    ).toBe("brand-designer");
    expect(documentAgent("thread-product-1").id).toBe("business-analyst");
    const next = sendProjectMessage(project, "strategy", {
      userId: "u",
      assistantId: "a",
      text: "Reach beginners",
      reply: "Review the audience",
    });
    expect(
      next.documents.find((item) => item.id === "strategy")?.messages.at(-1)
        ?.agent?.id,
    ).toBe("strategist");
  });
  test("uses reconciled AI Chat roles with traceable canonical versions", () => {
    expect(AI_CHAT_AGENTS.map((agent) => agent.id)).toEqual([
      "account-manager",
      "brand-designer",
      "business-analyst",
      "communication-strategist",
      "market-researcher",
      "strategist",
      "web-designer",
    ]);
    for (const agent of AI_CHAT_AGENTS) {
      const source = readFileSync(
        new URL(`../../../../../${agent.source}`, import.meta.url),
        "utf8",
      );
      const adaptation = readFileSync(
        new URL(`../../../../../${agent.adaptationSource}`, import.meta.url),
        "utf8",
      );
      expect(agent.role).toBe(
        adaptation.replace(/^---\n[\s\S]*?\n---\n/, "").trim(),
      );
      expect(agent.sourceSha256).toBe(
        createHash("sha256").update(source).digest("hex"),
      );
      expect(adaptation).toContain(`source_sha256: ${agent.sourceSha256}`);
      expect(adaptation).toContain(`source: ${agent.source}`);
      expect(adaptation).toContain(`description: ${agent.description}`);
      for (const section of [
        "Mission and boundary",
        "Method",
        "Thresholds and red flags",
        "Handoff",
      ])
        expect(agent.role).toContain(`## ${section}`);
      expect(agent.role).not.toMatch(
        /\.agents\/|tools\/studio\/|<layer>|40-products|10-strategy|00-business|SOURCES\.md|Request\.md/,
      );
      expect(agent).not.toHaveProperty("skills");
      expect(agent).not.toHaveProperty("knowledge");
      expect(agent).not.toHaveProperty("knowledgeSources");
    }
  });
  test("binds role responsibilities to the actual document and attachment sections", () => {
    expect(definitions.brief.title).toBe("Brief");
    expect(definitions).not.toHaveProperty("request");
    for (const section of definitions.brief.sections)
      expect(documentAgent("brief").role).toContain(section.title);
    for (const section of definitions.strategy.sections)
      expect(documentAgent("strategy").role).toContain(section.title);
    expect(documentAgent("strategy").role).toContain("in Products");
    expect(documentAgent("design").name).toBe("Brand Designer");
    expect(documentAgent("design").role).toContain(
      "Design.md → Outputs and provenance → Files",
    );
    expect(documentAgent("design").role).toContain(
      "inputs and outputs to the owning section as Files",
    );
    expect(documentAgent("products").role).toContain("Products.md inventory");
    expect(documentAgent("products").role).toContain("Revenue Streams");
    expect(documentAgent("products").role).not.toMatch(
      /frontmatter|segments: \[\]|v2 segment workspace/,
    );
  });
  test("uses all current profile knowledge and retains earlier role snapshots", () => {
    const base = projectWithDrafts();
    const project = base;
    const agent = {
      ...snapshotAgent(documentAgent("thread")),
      id: "custom-coach",
      name: "Workshop Coach",
      custom: true,
      source: undefined,
      role: "# Workshop Coach\n\nPrepare beginner pottery sessions using the attached project documents.",
    };
    const originalRole = agent.role;
    let next = createProjectTopic(
      project,
      "coaching",
      "Class plan",
      ["brief"],
      agent,
    );
    agent.role = "Changed outside the thread";
    const original = next.topics[0];
    expect(original.agent?.role).toBe(originalRole);
    expect(original.messages[0].agent?.role).toBe(originalRole);
    expect(topicAgentContext(next, original).map((item) => item.name)).toEqual([
      "Brief.md",
      "Strategy.md",
      "Brand.md",
      "Design.md",
      "Products.md",
    ]);
    next = {
      ...next,
      topics: next.topics.map((item) => ({
        ...item,
        agent: documentAgent("strategy"),
      })),
    };
    next = sendProjectMessage(next, "coaching", {
      userId: "u",
      assistantId: "a",
      text: "Who should we reach?",
      reply: "Review the audience",
    });
    expect(next.topics[0].messages[0].agent?.name).toBe("Workshop Coach");
    expect(next.topics[0].messages.at(-1)?.agent?.role).toBe(
      documentAgent("strategy").role,
    );
    expect(
      next.topics[0].messages.at(-1)?.context?.map((item) => item.name),
    ).toEqual([
      "Brief.md",
      "Strategy.md",
      "Brand.md",
      "Design.md",
      "Products.md",
    ]);
    expect(
      createProjectProfile("another", "Another project").agents,
    ).toBeUndefined();
  });
  test("includes the active document even when empty and omits unknown placeholders", () => {
    const project = projectWithDrafts();
    const strategy = project.documents.find(
      (document) => document.id === "strategy",
    )!;
    const emptyContext = documentAgentContext(project, strategy);
    expect(emptyContext[0]).toMatchObject({
      name: "Strategy.md",
      status: "draft",
      text: "",
    });
    expect(
      emptyContext.some(
        (item) => item.name === "Brief.md" && item.text.includes(project.notes),
      ),
    ).toBe(true);
    const partial = {
      ...strategy,
      values: {
        "Audiences and product roles":
          "Adults trying pottery for the first time.",
      },
    };
    const draft = documentAgentContext(project, partial).find(
      (item) => item.name === "Strategy.md",
    )!;
    expect(draft.status).toBe("draft");
    expect(draft.text).toBe(
      "## Audiences and product roles\n\nAdults trying pottery for the first time.",
    );
    expect(draft.text).not.toContain("Unknown");
    expect(draft.text).not.toContain("Measurement and priorities");
  });
  test("records whole-document and multiple-section work without replacing sections", () => {
    const project = projectWithDrafts();
    const document = project.documents[0];
    const whole = sendProjectMessage(project, document.id, {
      userId: "whole-user",
      assistantId: "whole-answer",
      text: "Review the whole brief.",
      reply: "Let's discuss the brief.",
      sections: [],
    });
    expect(whole.documents[0].values).toEqual(document.values);
    expect(whole.documents[0].proposal).toBeUndefined();
    expect(whole.documents[0].messages.at(-1)?.workingOn).toEqual({
      documentName: "Brief.md",
      sections: [],
    });
    const selection = ["Current state", "Business and resources"];
    const multiple = sendProjectMessage(whole, document.id, {
      userId: "multiple-user",
      assistantId: "multiple-answer",
      text: "Check how the constraints affect the current situation.",
      reply: "Let's discuss both sections.",
      sections: selection,
    });
    const answer = multiple.documents[0].messages.at(-1)!;
    expect(answer.workingOn?.sections).toEqual(selection);
    expect(multiple.documents[0].values).toEqual(document.values);
    expect(multiple.documents[0].proposal).toBeUndefined();
    expect(answer.context?.[0].name).toBe("Brief.md");
    expect(answer.context?.[0].text).toContain("## Current state");
    selection.push("Project and products");
    document.values["Project and products"] = "Changed after the answer";
    document.assets![0].file.name = "Changed.jpg";
    expect(answer.workingOn?.sections).toHaveLength(2);
    expect(answer.context?.[0].text).not.toContain("Changed after the answer");
    expect(answer.context?.[0].assets?.[0].file.name).toBe("Studio.jpg");
    expect(whole.documents[0].messages.at(-1)?.workingOn?.sections).toEqual([]);
    expect(
      documentWorkingOn(document, [
        "Project and products",
        "Project and products",
        "Missing",
      ]).sections,
    ).toEqual(["Project and products"]);
  });
  test("uses current knowledge without repeating intake or other chat attachments", () => {
    const project = projectWithDrafts();
    project.documents[2].draftFiles = [
      {
        id: "brand-only",
        name: "Brand-private.md",
        text: "Only this brand conversation uses this file.",
        size: 44,
      },
    ];
    let sent = sendProjectMessage(project, "brand", {
      userId: "brand-user",
      assistantId: "brand-answer",
      text: "Use this attachment.",
      reply: "Attached.",
    });
    const strategy = sent.documents[1];
    expect(
      documentAgentContext(sent, strategy).some(
        (item) => item.name === "Brand-private.md",
      ),
    ).toBe(false);
    expect(
      documentAgentContext(sent, strategy).map((item) => item.name),
    ).toEqual([
      "Strategy.md",
      "Brief.md",
      "Brand.md",
      "Design.md",
      "Products.md",
    ]);
    sent = sendProjectMessage(sent, "strategy", {
      userId: "strategy-user",
      assistantId: "strategy-answer",
      text: "Define the audience.",
      reply: "Review this audience.",
      sections: ["Audiences and product roles"],
    });
    expect(sent.documents[1].proposal?.section).toBe(
      "Audiences and product roles",
    );
    expect(
      sent.documents[1].messages.at(-1)?.context?.map((item) => item.name),
    ).toEqual([
      "Strategy.md",
      "Brief.md",
      "Brand.md",
      "Design.md",
      "Products.md",
    ]);
  });
});
