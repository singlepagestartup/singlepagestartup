import { Handler } from "./is-authorized";
import { Service } from "../service";
import { Context } from "hono";
import { Repository } from "../repository";
import { Configuration } from "../configuration";
import { IRepository, IService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";

jest.mock("../repository");
jest.mock("../service");

describe("Handler", () => {
  let handler: Handler;
  let service: jest.Mocked<IService<(typeof Table)["$inferSelect"]>>;
  let context: jest.Mocked<Context>;
  let repository: jest.Mocked<IRepository>;

  beforeEach(() => {
    repository = new Repository(
      new Configuration(),
    ) as unknown as jest.Mocked<IRepository>;

    service = new Service(repository as any) as jest.Mocked<Service>;
    handler = new Handler(service as any);

    context = {
      req: {
        header: jest.fn(),
        query: jest.fn(),
      },
      json: jest.fn(),
    } as unknown as jest.Mocked<Context>;
  });

  it("should return 200 if valid X-RBAC-SECRET-KEY header is provided", async () => {
    const res = await handler.execute(context, () => {});

    console.log("🚀 ~ it ~ res:", handler);

    // expect(context.json).toHaveBeenCalledWith({ data: expect.anything() });
  });
});
