import {
  prepareModuleWidgetCutover,
  runWidgetCutoverCli,
} from "./module-widget-links";
import type { IWidgetCutoverAdapter } from "./ai-chat-widget-links";
export interface ISocialWidgetInput {
  targets: { hostLinkId: string; socialWidgetId: string }[];
}
export async function prepareSocialWidgetCutover(
  input: ISocialWidgetInput,
  adapter: IWidgetCutoverAdapter,
) {
  return prepareModuleWidgetCutover(
    {
      sourceModule: "social",
      schema: "sps.social-widget-cutover.v1",
      slugPrefix: "social-chat",
      presentationVariant: "content-social-chat-default",
      variants: {
        "chat-list-default":
          "subject-me-social-module-profile-chat-list-default",
        "chat-overview-default":
          "subject-me-social-module-profile-chat-overview-default",
      },
    },
    {
      targets: input.targets.map((t) => ({
        hostLinkId: t.hostLinkId,
        sourceWidgetId: t.socialWidgetId,
      })),
    },
    adapter,
  );
}
if (import.meta.main)
  runWidgetCutoverCli(
    "sps.social-widget-cutover.v1",
    prepareSocialWidgetCutover,
  ).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
