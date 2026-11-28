import {
  AccountPreview,
  type IAccountPreviewProps,
} from "../../AccountPreview";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import type { Meta, StoryObj } from "@storybook/react";
type IPageStoryProps = Pick<IAccountPreviewProps, "signedIn" | "account">;
function Component(props: IPageStoryProps) {
  return <AccountPreview {...props} initialHref="/framework/help" />;
}
const meta = {
  id: "modules-host-models-page-singlepage-ai-chat-help",
  title: "Modules/Host/Page/Singlepage/ai-chat-help",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    signedIn: true,
    account: aiChatAccount,
  },
  argTypes: {
    signedIn: { control: "boolean" },
    account: { control: "object" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
