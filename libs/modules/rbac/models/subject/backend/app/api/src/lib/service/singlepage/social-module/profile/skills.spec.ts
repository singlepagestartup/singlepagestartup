const mockSkillCreate = jest.fn();
const mockSkillDelete = jest.fn();
const mockLinkCreate = jest.fn();
const mockLinkDelete = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));
jest.mock("@sps/social/models/skill/sdk/server", () => ({
  api: { create: mockSkillCreate, delete: mockSkillDelete },
}));
jest.mock("@sps/social/relations/profiles-to-skills/sdk/server", () => ({
  api: { create: mockLinkCreate, delete: mockLinkDelete },
}));
import { Service } from "./skills";
import {
  AI_CHAT_DOCUMENTS,
  AI_CHAT_DOCUMENT_SKILL_TEMPLATES,
} from "@sps/shared-utils";

function fixture() {
  const records: any[] = [];
  const links: any[] = [];
  const matches = (record: any, { params }: any) =>
    params.filters.and.every((filter: any) =>
      filter.method === "inArray"
        ? filter.value.includes(record[filter.column])
        : record[filter.column] === filter.value,
    );
  const deps = {
    skill: {
      find: jest.fn(async (props) =>
        records.filter((record) => matches(record, props)),
      ),
      update: jest.fn(),
    },
    profilesToSkills: {
      find: jest.fn(async (props) =>
        links.filter((link) => matches(link, props)),
      ),
    },
  };
  mockSkillCreate.mockImplementation(async ({ data }) => {
    const skill = { id: `skill-${records.length}`, ...data };
    records.push(skill);
    return skill;
  });
  mockLinkCreate.mockImplementation(async ({ data }) => {
    const link = { id: `link-${links.length}`, ...data };
    links.push(link);
    return link;
  });
  mockSkillDelete.mockImplementation(async ({ id }) => {
    records.splice(
      records.findIndex((skill) => skill.id === id),
      1,
    );
  });
  mockLinkDelete.mockImplementation(async ({ id }) => {
    links.splice(
      links.findIndex((link) => link.id === id),
      1,
    );
  });
  return { service: new Service(deps as any), records, links, deps };
}

beforeEach(() => jest.resetAllMocks());

it("creates five private professions per assistant in an empty Skill database", async () => {
  const { service, records, links } = fixture();
  const first = await service.ensure("assistant-one");
  const second = await service.ensure("assistant-two");
  expect(records).toHaveLength(10);
  expect(links).toHaveLength(10);
  expect(first.map((skill) => skill.slug)).toEqual(
    AI_CHAT_DOCUMENTS.map((document) => `${document.skillSlug}-assistant-one`),
  );
  expect(
    first.some((skill) => second.some((other) => other.id === skill.id)),
  ).toBe(false);
  for (const [index, document] of AI_CHAT_DOCUMENTS.entries()) {
    expect(first[index].description).toBe(
      AI_CHAT_DOCUMENT_SKILL_TEMPLATES[document.key].description,
    );
    expect(await service.forDocument("assistant-one", document.key)).toBe(
      first[index],
    );
    expect(await service.forDocument("assistant-two", document.key)).toBe(
      second[index],
    );
  }
});

it("reuses private records and links without overwriting edits or affecting another assistant", async () => {
  const { service, records, links, deps } = fixture();
  const first = await service.ensure("assistant-one");
  const second = await service.ensure("assistant-two");
  first[0].description = "Owner's revised instructions";
  expect(await service.ensure("assistant-one")).toEqual(first);
  expect(records).toHaveLength(10);
  expect(links).toHaveLength(10);
  expect(second[0].description).toBe(
    AI_CHAT_DOCUMENT_SKILL_TEMPLATES.brief.description,
  );
  expect(deps.skill.update).not.toHaveBeenCalled();
  expect(mockSkillCreate).toHaveBeenCalledTimes(10);
  expect(mockLinkCreate).toHaveBeenCalledTimes(10);
});

it("accepts a linked legacy profession, prefers the private copy, and rejects a foreign profile", async () => {
  const { service, records, links } = fixture();
  records.push({
    id: "legacy",
    slug: "ai-chat-account-manager",
    description: "Legacy manual instructions",
  });
  links.push({
    id: "legacy-link",
    profileId: "assistant-one",
    skillId: "legacy",
  });
  expect((await service.forDocument("assistant-one", "brief")).id).toBe(
    "legacy",
  );
  const own = await service.ensure("assistant-one");
  expect(await service.forDocument("assistant-one", "brief")).toBe(own[0]);
  await expect(service.forDocument("assistant-two", "brief")).rejects.toThrow(
    "Document skill",
  );
  await expect(service.forDocument("assistant-one", "unknown")).rejects.toThrow(
    "Unknown AI Chat document",
  );
});

it("rolls back new Skill records and links after a failed setup", async () => {
  const { service, records, links } = fixture();
  mockSkillCreate
    .mockImplementationOnce(async ({ data }) => {
      const record = { id: "first", ...data };
      records.push(record);
      return record;
    })
    .mockRejectedValueOnce(new Error("Skill storage unavailable"));
  await expect(service.ensure("assistant-one")).rejects.toThrow(
    "Skill storage unavailable",
  );
  expect(records).toHaveLength(0);
  expect(links).toHaveLength(0);
  expect(mockSkillDelete).toHaveBeenCalledWith(
    expect.objectContaining({ id: "first" }),
  );
});
