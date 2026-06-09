import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { OpenRouter, type IOpenRouterModel } from "@sps/shared-third-parties";
import { Service } from "../../../../../../../../service";

type TOpenRouterModelGroup = "text" | "vision_file" | "image" | "audio";

interface IOpenRouterChatModelOption {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
}

interface IOpenRouterChatModelGroup {
  id: TOpenRouterModelGroup;
  title: string;
  models: IOpenRouterChatModelOption[];
}

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const socialModuleProfileId = this.requireParam(
        c,
        "socialModuleProfileId",
      );
      const socialModuleChatId = this.requireParam(c, "socialModuleChatId");

      await this.assertProfileCanAccessChat({
        socialModuleProfileId,
        socialModuleChatId,
      });

      const openRouter = new OpenRouter();
      const models = await openRouter.getModels();

      return c.json({
        data: {
          auto: {
            id: "auto",
            name: "Auto",
            description: "Automatically select the best OpenRouter model.",
          },
          groups: this.groupModels(models),
        },
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private requireParam(c: Context, name: string) {
    const value = c.req.param(name);

    if (!value) {
      throw new Error(`Validation error. No ${name} provided`);
    }

    return value;
  }

  private async assertProfileCanAccessChat(props: {
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const relations = await this.service.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: props.socialModuleChatId,
            },
          ],
        },
        limit: 1,
      },
    });

    if (!relations?.length) {
      throw new Error(
        "Authorization error. Requested social-module chat does not belong to profile",
      );
    }
  }

  private groupModels(models: IOpenRouterModel[]): IOpenRouterChatModelGroup[] {
    const groups: IOpenRouterChatModelGroup[] = [
      {
        id: "text",
        title: "Text",
        models: [],
      },
      {
        id: "vision_file",
        title: "Vision/File",
        models: [],
      },
      {
        id: "image",
        title: "Image",
        models: [],
      },
      {
        id: "audio",
        title: "Audio",
        models: [],
      },
    ];
    const groupsById = new Map(groups.map((group) => [group.id, group]));

    for (const model of models) {
      const inputModalities = this.getModalities(
        model.architecture?.input_modalities,
      );
      const outputModalities = this.getModalities(
        model.architecture?.output_modalities,
      );
      const option = this.toOption({
        model,
        inputModalities,
        outputModalities,
      });

      if (outputModalities.includes("audio")) {
        groupsById.get("audio")?.models.push(option);
        continue;
      }

      if (outputModalities.includes("image")) {
        groupsById.get("image")?.models.push(option);
        continue;
      }

      if (
        inputModalities.includes("image") ||
        inputModalities.includes("file")
      ) {
        groupsById.get("vision_file")?.models.push(option);
        continue;
      }

      if (outputModalities.includes("text")) {
        groupsById.get("text")?.models.push(option);
      }
    }

    return groups
      .map((group) => {
        return {
          ...group,
          models: group.models.sort((a, b) => a.name.localeCompare(b.name)),
        };
      })
      .filter((group) => group.models.length);
  }

  private toOption(props: {
    model: IOpenRouterModel;
    inputModalities: string[];
    outputModalities: string[];
  }): IOpenRouterChatModelOption {
    return {
      id: props.model.id,
      name: props.model.name || props.model.id,
      description: props.model.description || "",
      contextLength:
        Number(props.model.context_length) ||
        Number(props.model.top_provider?.context_length) ||
        0,
      inputModalities: props.inputModalities,
      outputModalities: props.outputModalities,
      supportedParameters: Array.isArray(props.model.supported_parameters)
        ? props.model.supported_parameters
        : [],
    };
  }

  private getModalities(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        return typeof item === "string" ? item.toLowerCase().trim() : "";
      })
      .filter((item): item is string => Boolean(item));
  }
}
