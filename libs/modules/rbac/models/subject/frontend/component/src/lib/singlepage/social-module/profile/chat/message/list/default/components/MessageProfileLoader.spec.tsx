import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import type {
  IModel as IProfile,
  IProfilePresentation,
} from "@sps/social/models/profile/sdk/model";
import { MessageProfileLoader } from "./MessageProfileLoader";
import { ActionProfileLoader } from "./ActionProfileLoader";
import type { IChatAction } from "@sps/social/models/action/sdk/model";

const presentation: IProfilePresentation = {
  id: "profile-a",
  title: { en: "Saved sender" },
  subtitle: {},
  avatar: {
    id: "avatar-a",
    file: "/sender.png",
    mimeType: "image/png",
    extension: "png",
    alt: "Saved sender",
    width: 80,
    height: 80,
  },
};
const participant = {
  id: "profile-a",
  slug: "private-subject-id",
  title: { en: "Saved sender" },
  subtitle: {},
} as IProfile;
const message = {
  id: "message-a",
  authorProfiles: [presentation],
  authorProfileIds: [presentation.id],
} as IChatMessage;

describe("Chat-scoped sender presentations", () => {
  it("retains a departed sender badge and avatar without inventing a full Profile", () => {
    const child = jest.fn(() => null);
    MessageProfileLoader({ message, participants: [], children: child });
    expect(child).toHaveBeenCalledWith({ presentation, profile: undefined });
  });
  it("passes only the exact current participant to existing profile drawer actions", () => {
    const child = jest.fn(() => null);
    MessageProfileLoader({
      message,
      participants: [{ ...participant, id: "other" }, participant],
      children: child,
    });
    expect(child).toHaveBeenCalledWith({ presentation, profile: participant });
  });
  it("uses an unknown badge when no scoped sender is available", () => {
    const child = jest.fn(() => null);
    MessageProfileLoader({
      message: { id: "message-a" } as IChatMessage,
      participants: [participant],
      children: child,
    });
    expect(child).toHaveBeenCalledWith(
      expect.objectContaining({
        presentation: expect.objectContaining({ id: "unknown", avatar: null }),
        profile: undefined,
      }),
    );
  });
  it("uses the scoped actor title without creating a public author URL", () => {
    const child = jest.fn(() => null);
    ActionProfileLoader({
      action: { actorProfiles: [presentation] } as IChatAction,
      language: "en",
      children: child,
    });
    expect(child).toHaveBeenCalledWith({
      id: "profile-a",
      slug: "Saved sender",
      initial: "S",
      href: "#",
    });
  });
});
