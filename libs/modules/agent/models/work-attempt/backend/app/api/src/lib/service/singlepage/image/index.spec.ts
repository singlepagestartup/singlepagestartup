import { StageSkillsUnavailable } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/knowledge";
import { CoverWork } from "./index";

it("returns a cover-stage reply when a selected skill is no longer linked", async () => {
  const input = {
    storeId: "store",
    taskId: "task",
    assigneeId: "agent",
    eventId: "event",
    assignmentRevision: 2,
  };
  const error = new StageSkillsUnavailable(false);
  const contextForRun = jest.fn().mockRejectedValue(error);
  const resolve = jest.fn();
  const cover = new CoverWork({
    modules: {
      crm: {
        task: {
          getWork: jest.fn().mockResolvedValue({
            task: {
              id: input.taskId,
              storeId: input.storeId,
              customerId: "buyer",
              orderId: "order",
            },
            stage: { output: "image", imageBrief: "marketplace-cover" },
          }),
        },
      },
      ecommerce: {
        order: {
          work: {
            findByOrder: jest.fn().mockResolvedValue({
              taskId: input.taskId,
              storeId: input.storeId,
              customerId: "buyer",
              kind: "individual-service",
              paid: false,
            }),
          },
        },
      },
      rbac: {
        subject: {
          customerWork: { contextForRun },
          providerConnections: { resolve },
        },
      },
    },
  } as unknown as ConstructorParameters<typeof CoverWork>[0]);

  await expect(cover.prepare(input, true)).resolves.toEqual({
    text: error.reply,
    imageDraftDigest: null,
  });
  expect(resolve).not.toHaveBeenCalled();
});
