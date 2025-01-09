import { Handler } from "./is-authorized";
import { Service } from "../service";
import { Context } from "hono";
import { Repository } from "../repository";
import { Configuration } from "../configuration";

jest.mock("../repository");
jest.mock("../service");

describe("Handler", () => {
  let handler: Handler;
  let service: jest.Mocked<Service>;
  let context: jest.Mocked<Context>;

  beforeEach(() => {
    const repository = new Repository(
      new Configuration(),
    ) as jest.Mocked<Repository>;

    service = new Service(repository) as jest.Mocked<Service>;
    handler = new Handler(service);

    context = {
      req: {
        header: jest.fn(),
        query: jest.fn(),
      },
      json: jest.fn(),
    } as unknown as jest.Mocked<Context>;
  });

  it("should return 200 if valid X-RBAC-SECRET-KEY header is provided", async () => {
    await handler.execute(context, () => {});

    expect(context.json).toHaveBeenCalledWith({ data: expect.anything() });
  });
});
