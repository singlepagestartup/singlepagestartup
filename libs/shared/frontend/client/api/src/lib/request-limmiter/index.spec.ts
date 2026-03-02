import { RequestLimiter } from "./index";

describe("RequestLimiter", () => {
  it("respects max concurrency", async () => {
    const limiter = new RequestLimiter(2);
    let active = 0;
    let maxObserved = 0;

    const createTask = (id: number) =>
      limiter.run(async () => {
        active++;
        maxObserved = Math.max(maxObserved, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active--;
        return id;
      });

    const results = await Promise.all([
      createTask(1),
      createTask(2),
      createTask(3),
      createTask(4),
    ]);

    expect(results).toEqual([1, 2, 3, 4]);
    expect(maxObserved).toBeLessThanOrEqual(2);
  });

  it("processes queued tasks in FIFO order", async () => {
    const limiter = new RequestLimiter(1);
    const executionOrder: number[] = [];

    const createTask = (id: number) =>
      limiter.run(async () => {
        executionOrder.push(id);
        await new Promise((resolve) => setTimeout(resolve, 5));
      });

    await Promise.all([createTask(1), createTask(2), createTask(3)]);

    expect(executionOrder).toEqual([1, 2, 3]);
  });
});
