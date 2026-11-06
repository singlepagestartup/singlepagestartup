import { ConsoleLogger } from "../providers/console";

it("keeps the source and driver code without printing raw logger arguments", () => {
  const output = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  try {
    const marker = "private-client-value";
    const driver = Object.assign(new Error("insert into ... " + marker), {
      code: "23503",
      params: [marker],
    });
    new ConsoleLogger().error("customer " + marker, driver, {
      password: marker,
    });
    expect(output).toHaveBeenCalledTimes(1);
    const serialized = String(output.mock.calls[0][0]);
    expect(serialized).not.toContain(marker);
    expect(JSON.parse(serialized)).toMatchObject({
      event: "runtime.error",
      locations: [
        {
          code: "23503",
          frames: expect.arrayContaining([
            expect.stringMatching(/error-record\/index.spec.ts:\d+:\d+$/),
          ]),
        },
      ],
    });
  } finally {
    output.mockRestore();
  }
});
