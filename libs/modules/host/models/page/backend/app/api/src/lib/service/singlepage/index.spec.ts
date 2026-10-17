import { Service } from "./index";

it("returns null for a route without the requested profile segment", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.findByUrl = jest.fn(async () => ({
    url: "/ai-chat/projects",
  })) as any;
  await expect(
    service.urlSegmentValue({
      url: "/ai-chat/projects",
      segment: "social.profiles.id",
    }),
  ).resolves.toBeNull();
});

it("keeps the actual profile segment on project routes", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.findByUrl = jest.fn(async () => ({
    url: "/ai-chat/social/profiles/[social.profiles.id]",
  })) as any;
  await expect(
    service.urlSegmentValue({
      url: "/ai-chat/social/profiles/profile",
      segment: "social.profiles.id",
    }),
  ).resolves.toBe("profile");
});
