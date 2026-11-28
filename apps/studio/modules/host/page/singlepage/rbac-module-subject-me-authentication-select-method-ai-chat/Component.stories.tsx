import {
  AccountPreview,
  type IAccountPreviewProps,
} from "../../AccountPreview";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import type { Meta, StoryObj } from "@storybook/react";
type IPageStoryProps = Pick<IAccountPreviewProps, "signedIn" | "account">;
function Component(props: IPageStoryProps) {
  return (
    <AccountPreview
      {...props}
      initialHref="/rbac/subject/authentication/email-and-password"
    />
  );
}
const meta = {
  id: "modules-host-models-page-singlepage-rbac-module-subject-me-authentication-select-method-ai-chat",
  title:
    "Modules/Host/Page/Singlepage/rbac-module-subject-me-authentication-select-method-ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    signedIn: false,
    account: aiChatAccount,
  },
  argTypes: {
    signedIn: { control: "boolean" },
    account: { control: "object" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
