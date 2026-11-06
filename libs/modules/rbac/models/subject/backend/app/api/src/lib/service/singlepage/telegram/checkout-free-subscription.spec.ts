import { Service as CommonFree } from "../billing/free-subscription";
import { Service } from "./checkout-free-subscription";

it("uses the common trusted Free bootstrap for Telegram and preserves its result", async () => {
  const result = { billingModule: { invoices: [{ id: "zero-invoice" }] } };
  const common = jest
    .spyOn(CommonFree.prototype, "execute")
    .mockResolvedValue(result as any);
  try {
    const service = new Service({} as any);
    expect(
      await service.execute({ id: "registered", chatId: "telegram-chat" }),
    ).toBe(result);
    expect(common).toHaveBeenCalledWith({
      id: "registered",
      chatId: "telegram-chat",
    });
  } finally {
    common.mockRestore();
  }
});

it("does not start a Telegram bootstrap without a Chat ID", async () => {
  const common = jest.spyOn(CommonFree.prototype, "execute");
  try {
    expect(
      await new Service({} as any).execute({ id: "registered" }),
    ).toBeNull();
    expect(common).not.toHaveBeenCalled();
  } finally {
    common.mockRestore();
  }
});
