import { Service } from ".";

describe("SES message headers", () => {
  it.each(["to", "from", "subject"])(
    "rejects header injection through %s before delivery",
    async (field) => {
      const send = jest.fn();
      const service = Object.assign(Object.create(Service.prototype), {
        client: { send },
      }) as Service;
      await expect(
        service.sendEmail({
          to: "recipient@example.invalid",
          from: "sender@example.invalid",
          subject: "Summary",
          html: "<p>Summary</p>",
          [field]: "value\r\nBcc: other@example.invalid",
        }),
      ).rejects.toThrow("Validation error. Email headers");
      expect(send).not.toHaveBeenCalled();
    },
  );
});
