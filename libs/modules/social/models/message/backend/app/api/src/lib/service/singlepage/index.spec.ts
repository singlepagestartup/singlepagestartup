import { Service } from "./index";

it("dates both sides of a checkout exchange at send time in an existing chat", async () => {
  const insert = jest.fn(async (message) => message);
  const service = new Service({ insert } as unknown as ConstructorParameters<
    typeof Service
  >[0]);
  const channel = { createdAt: new Date("2026-11-25T18:46:11Z") };
  const sentAt = new Date("2026-11-25T21:52:06.483Z");
  const repliedAt = new Date("2026-11-25T21:52:06.600Z");
  jest.useFakeTimers();
  try {
    jest.setSystemTime(sentAt);
    const input = await service.createWorkMessage({
      ...channel,
      description: "invalid-address",
    });
    jest.setSystemTime(repliedAt);
    const reply = await service.createWorkMessage({
      description: "Please check the address.",
    });
    expect(input.createdAt).toEqual(sentAt);
    expect(reply.createdAt).toEqual(repliedAt);
  } finally {
    jest.useRealTimers();
  }
});
