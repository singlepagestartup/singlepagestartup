/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PrivateMessageAttachments } from "./PrivateMessageAttachments";

const mockDownload = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    customerWorkAttachment: (...args: unknown[]) => mockDownload(...args),
  },
}));

it("shows the filename and uses only an authenticated download for a script", async () => {
  jest.useFakeTimers();
  const file = new Blob(["const fixture = 1;"], {
    type: "text/javascript",
  });
  mockDownload.mockResolvedValueOnce(file);
  const original = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => "blob:fixture");
  URL.revokeObjectURL = jest.fn();
  const download = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    download(this.href, this.download);
  });
  try {
    const { container } = render(
      <PrivateMessageAttachments
        subjectId="buyer"
        threadId="thread"
        messageId="message"
        attachments={[{ id: "file", name: "preview.js" }]}
        language="en"
      />,
    );
    expect(container.querySelector("a, iframe, object, embed, img")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Download preview.js" }),
    );
    await waitFor(() =>
      expect(download).toHaveBeenCalledWith("blob:fixture", "preview.js"),
    );
    expect(URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: "application/octet-stream" }),
    );
    expect(mockDownload).toHaveBeenCalledWith({
      id: "buyer",
      threadId: "thread",
      messageId: "message",
      attachmentId: "file",
    });
  } finally {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    URL.createObjectURL = original;
    URL.revokeObjectURL = originalRevoke;
    jest.restoreAllMocks();
  }
});
