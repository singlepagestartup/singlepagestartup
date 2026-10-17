import { randomUUID } from "node:crypto";
import {
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { Configuration as SkillConfiguration } from "@sps/social/models/skill/backend/app/api/src/lib/configuration";
import { Repository as SkillRepository } from "@sps/social/models/skill/backend/app/api/src/lib/repository";
import { Service as SkillService } from "@sps/social/models/skill/backend/app/api/src/lib/service";
import { Configuration as LinkConfiguration } from "@sps/social/relations/profiles-to-skills/backend/app/api/src/lib/configuration";
import { Repository as LinkRepository } from "@sps/social/relations/profiles-to-skills/backend/app/api/src/lib/repository";
import { Service as LinkService } from "@sps/social/relations/profiles-to-skills/backend/app/api/src/lib/service";
import { Configuration as ProfileConfiguration } from "@sps/social/models/profile/backend/app/api/src/lib/configuration";
import { Repository as ProfileRepository } from "@sps/social/models/profile/backend/app/api/src/lib/repository";
import { AI_CHAT_DOCUMENTS } from "@sps/shared-utils";
import { Service } from "./skills";

const createSkill = jest.fn();
const deleteSkill = jest.fn();
const createLink = jest.fn();
const deleteLink = jest.fn();
jest.mock("@sps/social/models/skill/sdk/server", () => ({
  api: {
    create: (...args: any[]) => createSkill(...args),
    delete: (...args: any[]) => deleteSkill(...args),
  },
}));
jest.mock("@sps/social/relations/profiles-to-skills/sdk/server", () => ({
  api: {
    create: (...args: any[]) => createLink(...args),
    delete: (...args: any[]) => deleteLink(...args),
  },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

it("persists independent editable professions for two profiles and rolls back a failed third setup", async () => {
  const skill = new SkillService(new SkillRepository(new SkillConfiguration()));
  const profilesToSkills = new LinkService(
    new LinkRepository(new LinkConfiguration()),
  );
  const profiles = new ProfileRepository(new ProfileConfiguration());
  const service = new Service({ skill, profilesToSkills } as any);
  createSkill.mockImplementation((props) => skill.create({ data: props.data }));
  deleteSkill.mockImplementation((props) => skill.delete({ id: props.id }));
  createLink.mockImplementation((props) =>
    profilesToSkills.create({ data: props.data }),
  );
  deleteLink.mockImplementation((props) =>
    profilesToSkills.delete({ id: props.id }),
  );
  const fixtures = await Promise.all(
    [1, 2, 3].map((n) =>
      profiles.insert({
        slug: `private-skills-${n}-${randomUUID()}`,
        variant: "artificial-intelligence",
      }),
    ),
  );
  const slugs = fixtures.flatMap((profile) =>
    AI_CHAT_DOCUMENTS.map((document) => `${document.skillSlug}-${profile.id}`),
  );
  try {
    const first = await service.ensure(fixtures[0].id);
    const second = await service.ensure(fixtures[1].id);
    expect(new Set([...first, ...second].map((record) => record.id)).size).toBe(
      10,
    );
    await skill.update({
      id: first[0].id,
      data: {
        title: first[0].title,
        slug: first[0].slug,
        description: "Owner's custom Brief instructions",
      },
    });
    expect((await service.ensure(fixtures[0].id))[0].description).toBe(
      "Owner's custom Brief instructions",
    );
    expect(
      (await service.forDocument(fixtures[1].id, "brief")).description,
    ).toBe(second[0].description);
    for (const profile of fixtures.slice(0, 2)) {
      const links = await profilesToSkills.find({
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: profile.id }],
          },
        },
      });
      expect(links).toHaveLength(5);
    }
    await expect(service.forDocument(fixtures[2].id, "brief")).rejects.toThrow(
      "Document skill",
    );
    createLink
      .mockImplementationOnce((props) =>
        profilesToSkills.create({ data: props.data }),
      )
      .mockRejectedValueOnce(new Error("Simulated link failure"));
    await expect(service.ensure(fixtures[2].id)).rejects.toThrow(
      "Simulated link failure",
    );
    expect(
      await skill.find({
        params: {
          filters: {
            and: [
              { column: "slug", method: "inArray", value: slugs.slice(10) },
            ],
          },
        },
      }),
    ).toHaveLength(0);
    expect(
      await profilesToSkills.find({
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: fixtures[2].id }],
          },
        },
      }),
    ).toHaveLength(0);
  } finally {
    for (const profile of fixtures)
      await profiles.deleteFirstByField("id", profile.id);
    const records = await skill.find({
      params: {
        filters: { and: [{ column: "slug", method: "inArray", value: slugs }] },
      },
    });
    for (const record of records) await skill.delete({ id: record.id });
  }
});
