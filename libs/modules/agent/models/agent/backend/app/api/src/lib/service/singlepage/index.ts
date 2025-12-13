import "reflect-metadata";
import { injectable } from "inversify";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/agent/backend/repository/database";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { IModel as ISocialModuleAction } from "@sps/social/models/action/sdk/model";
import { IModel as IRbacModuleSubject } from "@sps/rbac/models/subject/sdk/model";
import { api as rbacModuleSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import * as jwt from "hono/jwt";
import { blobifyFiles } from "@sps/backend-utils";
import { OpenRouter } from "@sps/shared-third-parties";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async agentSocialModuleProfileHandler(
    props:
      | {
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleMessage: ISocialModuleMessage;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        }
      | {
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleAction: ISocialModuleAction;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        },
  ) {
    const telegramBotCommands = ["/start"];
    const telegramBotCallbackQueries = ["button_1", "button_2"];

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
      );
    }

    const rbacModuleSubjectsToSocialModuleProfiles =
      await rbacModuleSubjectsToSocialModuleProfilesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: props.shouldReplySocialModuleProfile.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    if (!rbacModuleSubjectsToSocialModuleProfiles?.length) {
      return;
    }

    const rbacModuleSubject = await rbacModuleSubjectApi.findById({
      id: rbacModuleSubjectsToSocialModuleProfiles[0].subjectId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!rbacModuleSubject) {
      return;
    }

    const jwtToken = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        iat: Math.floor(Date.now() / 1000),
        subject: rbacModuleSubject,
      },
      RBAC_JWT_SECRET,
    );

    if (props.shouldReplySocialModuleProfile.slug === "telegram-bot") {
      if ("socialModuleMessage" in props) {
        const telegramBotCommandMessage = telegramBotCommands.find(
          (command) => {
            return props.socialModuleMessage.description?.startsWith(command);
          },
        );

        if (telegramBotCommandMessage) {
          await this.telegramBotCommandReplyMessageCreate({
            jwtToken,
            rbacModuleSubject,
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
            socialModuleChat: props.socialModuleChat,
            socialModuleMessage: props.socialModuleMessage,
            messageFromSocialModuleProfile:
              props.messageFromSocialModuleProfile,
          });
        }
      } else if ("socialModuleAction" in props) {
        if (props.socialModuleAction.payload?.telegram?.callback_query) {
          await this.telegramBotCallbackQueryHandler({
            jwtToken,
            rbacModuleSubject,
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
            socialModuleChat: props.socialModuleChat,
            socialModuleAction: props.socialModuleAction,
            messageFromSocialModuleProfile:
              props.messageFromSocialModuleProfile,
          });
        }
      }
    } else if (props.shouldReplySocialModuleProfile.slug === "open-router") {
      if ("socialModuleMessage" in props) {
        const telegramBotCommandMessage = telegramBotCommands.find(
          (command) => {
            return props.socialModuleMessage.description?.startsWith(command);
          },
        );

        if (telegramBotCommandMessage) {
          return;
        }

        console.log(
          "🚀 ~ agentSocialModuleProfileHandler ~ telegramBotCommandMessage:",
          telegramBotCommandMessage,
          props.socialModuleMessage.description,
        );

        await this.openRouterReplyMessageCreate({
          jwtToken,
          rbacModuleSubject,
          shouldReplySocialModuleProfile: props.shouldReplySocialModuleProfile,
          socialModuleChat: props.socialModuleChat,
          socialModuleMessage: props.socialModuleMessage,
          messageFromSocialModuleProfile: props.messageFromSocialModuleProfile,
        });
      }
    }
  }

  async telegramBotCallbackQueryHandler(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleAction: ISocialModuleAction;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    const callbackQueryData =
      props.socialModuleAction.payload?.telegram?.callback_query?.data;

    if (!callbackQueryData) {
      throw new Error("Validation error. Callback query data is missing");
    }

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: {
          description: "telegramBotCallbackQueryHandler",
        },
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
  }

  async telegramBotCommandReplyMessageCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    if (props.socialModuleMessage.description?.startsWith("/start")) {
      return this.telegramBotWelcomeMessageCreate(props).then(async () => {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve("");
          }, 4000);
        });
        await this.telegramBotWelcomeMessageWithKeyboardCreate(props);
      });
    }

    rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate({
      id: props.rbacModuleSubject.id,
      socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      data: {
        description: `Caught command ${props.socialModuleMessage.description}`,
        interaction: {
          inline_keyboard: [
            [
              {
                text: "Button 1",
                callback_data: "button_1",
              },
              {
                text: "Button 2",
                callback_data: "button_2",
              },
            ],
          ],
        },
      },
      options: {
        headers: {
          Authorization: "Bearer " + props.jwtToken,
        },
      },
    });
  }

  async telegramBotWelcomeMessageCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const generateTemplateSocilaModuleMessageAttachmentStartFiles =
      await fileStorageModuleFileApi.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "eq",
                value:
                  "generate-template-social-module-message-attachment-start",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    const data = {
      description: "Welcome to the club, Buddy!",
    };

    if (generateTemplateSocilaModuleMessageAttachmentStartFiles?.length) {
      data["files"] = await blobifyFiles({
        files: generateTemplateSocilaModuleMessageAttachmentStartFiles.map(
          (generateTemplateSocilaModuleMessageAttachmentStartFile) => {
            return {
              ...generateTemplateSocilaModuleMessageAttachmentStartFile,
              title: generateTemplateSocilaModuleMessageAttachmentStartFile.id,
              type:
                generateTemplateSocilaModuleMessageAttachmentStartFile.mimeType ??
                "",
              extension:
                generateTemplateSocilaModuleMessageAttachmentStartFile.extension ??
                "",
              url: generateTemplateSocilaModuleMessageAttachmentStartFile.file.includes(
                "https",
              )
                ? generateTemplateSocilaModuleMessageAttachmentStartFile.file
                : `${NEXT_PUBLIC_API_SERVICE_URL}/public${generateTemplateSocilaModuleMessageAttachmentStartFile.file}`,
            };
          },
        ),
      });
    }

    rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate({
      id: props.rbacModuleSubject.id,
      socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      data,
      options: {
        headers: {
          Authorization: "Bearer " + props.jwtToken,
        },
      },
    });
  }

  async telegramBotWelcomeMessageWithKeyboardCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const data = {
      description: "Here is our menu, select what you want.",
      interaction: {
        inline_keyboard: [
          [
            {
              text: "Button 1",
              callback_data: "button_1",
            },
            {
              text: "Button 2",
              callback_data: "button_2",
            },
          ],
        ],
      },
    };

    rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate({
      id: props.rbacModuleSubject.id,
      socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      data,
      options: {
        headers: {
          Authorization: "Bearer " + props.jwtToken,
        },
      },
    });
  }

  async openRouterReplyMessageCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const availableModels = [
      "amazon/nova-2-lite-v1:free",
      "arcee-ai/trinity-mini:free",
      "tngtech/tng-r1t-chimera:free",
      // is temporarily rate-limited upstream
      // "allenai/olmo-3-32b-think:free",
      "kwaipilot/kat-coder-pro:free",
      "nvidia/nemotron-nano-12b-v2-vl:free",
      "alibaba/tongyi-deepresearch-30b-a3b:free",
    ];

    const openRouter = new OpenRouter();
    const selectModelForRequest = await openRouter.generateText({
      model: "nex-agi/deepseek-v3.1-nex-n1:free",
      context: [
        {
          role: "user",
          content: `I have a task:\n${props.socialModuleMessage.description}\nSelect the most suitable AI model, that can finish that task with the best result. Available models:${availableModels.map((model) => "'" + model + "'").join(",")}. Send me a reply with the exact model name without any additional text. Don't try to do the task itself, choose a model`,
        },
      ],
    });

    console.log(
      "🚀 ~ openRouterReplyMessageCreate ~ selectModelForRequest:",
      selectModelForRequest,
    );

    if (!availableModels.includes(selectModelForRequest.replaceAll("'", ""))) {
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "Упс! Что-то пошло не так, попробуйте еще раз",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
    }

    const generatedMessageDescription = await openRouter.generateText({
      model: selectModelForRequest,
      max_tokens: 800,
      context: [
        {
          role: "user",
          content: props.socialModuleMessage.description || "",
        },
      ],
    });

    const transformedMessageDescription = await openRouter.generateText({
      model: "kwaipilot/kat-coder-pro:free",
      context: [
        // {
        //   role: "system",
        //   content:
        //     "You know the Telegram Bot API documentation. You need to format the text content sent by the user for sending through Telegram Bot with 'parse_mode: HTML'. Don't change the text content, just the formatting so it's easy to read in the message sent by Telegram Bot. Replace\n**some text** to <b>some text</b>\n### heading text to <b>heading text</b>\nmultilines code blocks put into <code>const n = 4; const d = 2;...</code>\nAI generated lines (---) just remove\ndo not use ol,ul,li replace them by '-','1. 2. 3. ...\nYou can only use <b>, <i>, <u>, <s>, <a>, <code>, <pre> tags",
        // },
        {
          role: "system",
          content: `
You are a formatter for Telegram Bot API messages.

Your task is to prepare user-provided text for sending via Telegram Bot using parse_mode = "MarkdownV2".

Input:
- Raw user text. It may contain any characters, including HTML, Markdown, JSON, logs, stack traces, links, or code.

Output:
- A single text string that is safe to send to Telegram with MarkdownV2.
- Output ONLY the formatted text. Do not add explanations, comments, or metadata.

Strict rules:

1. Do NOT change the meaning or wording of the text.
   You may only:
   - add line breaks,
   - improve visual structure (paragraphs, headings, lists),
   - apply MarkdownV2 formatting,
   - escape characters according to Telegram rules.

2. Telegram MarkdownV2 escaping rules:

   - In normal text, escape the following characters by prefixing them with a backslash:
     _ * [ ] ( ) ~ \` > # + - = | { } . !

   - The backslash character itself must usually be escaped as \\

   - Any ASCII character with code from 1 to 126 may be escaped with a preceding backslash to force literal interpretation.

   - Inside code (\`code\`) and preformatted (\`pre\`) blocks:
     - Escape ONLY backticks (\`) and backslashes (\) by prefixing them with a backslash.

   - Inside the parentheses part of inline links [text](...):
     - Escape ) and \ characters.

3. Do NOT output raw HTML.
   Any HTML tags must be rendered as plain text by escaping them so Telegram does not interpret them as markup.

4. Code handling:
   - Short technical fragments, commands, identifiers, or paths should be wrapped in inline code using backticks.
   - Multiline technical content (JSON, logs, stack traces, configuration, code) should be wrapped in fenced pre blocks.
   - Apply the correct escaping rules inside these blocks.

5. Ambiguity rules:
   - In MarkdownV2, double underscores __ are greedily parsed as underline.
     To separate underline and italic, insert an empty bold entity if needed.

6. Readability:
   - Preserve the original structure when possible.
   - Split long text into paragraphs.
   - Use clear spacing and formatting, but never alter the semantic content.

7. Output requirements:
   - Output ONLY the final formatted message text.
   - No Markdown fences, no explanations, no emojis, no additional formatting outside Telegram MarkdownV2 rules.
Important note:
If this text is later embedded into a programming language string (JSON, JavaScript, etc.),
additional escaping required by that language is out of scope.
Your responsibility is only Telegram MarkdownV2 correctness.`,
        },
        {
          role: "user",
          content: generatedMessageDescription,
        },
      ],
    });

    // const generateTemplateSocilaModuleMessageAttachmentStartFiles =
    //   await fileStorageModuleFileApi.find({
    //     params: {
    //       filters: {
    //         and: [
    //           {
    //             column: "variant",
    //             method: "eq",
    //             value:
    //               "generate-template-social-module-message-attachment-start",
    //           },
    //         ],
    //       },
    //     },
    //     options: {
    //       headers: {
    //         "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
    //       },
    //     },
    //   });

    const data = {
      description: transformedMessageDescription,
    };

    if (data.description == "") {
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "Упс! Что-то пошло не так, попробуйте еще раз",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
    }

    // if (generateTemplateSocilaModuleMessageAttachmentStartFiles?.length) {
    //   data["files"] = await blobifyFiles({
    //     files: generateTemplateSocilaModuleMessageAttachmentStartFiles.map(
    //       (generateTemplateSocilaModuleMessageAttachmentStartFile) => {
    //         return {
    //           ...generateTemplateSocilaModuleMessageAttachmentStartFile,
    //           title: generateTemplateSocilaModuleMessageAttachmentStartFile.id,
    //           type:
    //             generateTemplateSocilaModuleMessageAttachmentStartFile.mimeType ??
    //             "",
    //           extension:
    //             generateTemplateSocilaModuleMessageAttachmentStartFile.extension ??
    //             "",
    //           url: generateTemplateSocilaModuleMessageAttachmentStartFile.file.includes(
    //             "https",
    //           )
    //             ? generateTemplateSocilaModuleMessageAttachmentStartFile.file
    //             : `${NEXT_PUBLIC_API_SERVICE_URL}/public${generateTemplateSocilaModuleMessageAttachmentStartFile.file}`,
    //         };
    //       },
    //     ),
    //   });
    // }

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
  }
}
