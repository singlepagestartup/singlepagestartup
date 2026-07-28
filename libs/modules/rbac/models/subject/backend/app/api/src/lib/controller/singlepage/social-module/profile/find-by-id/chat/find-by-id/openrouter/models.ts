import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import {
  OpenRouter,
  openRouterReasoningEffortValues,
  type IOpenRouterModel,
  type TOpenRouterReasoningEffort,
} from "@sps/shared-third-parties";
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
  supportsReasoning: boolean;
  reasoning: IOpenRouterChatModelReasoning | null;
}

interface IOpenRouterChatModelReasoning {
  defaultEffort: TOpenRouterReasoningEffort | null;
  defaultEnabled: boolean | null;
  mandatory: boolean;
  supportedEfforts: TOpenRouterReasoningEffort[];
  supportsMaxTokens: boolean;
}

interface IOpenRouterChatModelGroup {
  id: TOpenRouterModelGroup;
  title: string;
  models: IOpenRouterChatModelOption[];
}

export class Handler {
  constructor(_service: Service) {}

  async execute(c: Context, next: any): Promise<Response> {
    try {
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
    const supportedParameters = Array.isArray(props.model.supported_parameters)
      ? props.model.supported_parameters
          .map((item) => {
            return typeof item === "string" ? item.toLowerCase().trim() : "";
          })
          .filter((item): item is string => Boolean(item))
      : [];

    const reasoning = this.toReasoningOption(props.model);

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
      supportedParameters,
      supportsReasoning: Boolean(reasoning),
      reasoning,
    };
  }

  private toReasoningOption(
    model: IOpenRouterModel,
  ): IOpenRouterChatModelReasoning | null {
    const reasoning = model.reasoning;

    if (!reasoning || !("supported_efforts" in reasoning)) {
      return null;
    }

    const supportedEffortsSource =
      reasoning.supported_efforts === null
        ? [...openRouterReasoningEffortValues]
        : reasoning.supported_efforts;

    if (!Array.isArray(supportedEffortsSource)) {
      return null;
    }

    const supportedEfforts = Array.from(
      new Set(
        supportedEffortsSource.filter(
          (effort): effort is TOpenRouterReasoningEffort => {
            return (
              openRouterReasoningEffortValues.includes(effort) &&
              !(reasoning.mandatory === true && effort === "none")
            );
          },
        ),
      ),
    );

    if (!supportedEfforts.length) {
      return null;
    }

    const defaultEffort = supportedEfforts.includes(
      reasoning.default_effort as TOpenRouterReasoningEffort,
    )
      ? (reasoning.default_effort as TOpenRouterReasoningEffort)
      : null;

    return {
      defaultEffort,
      defaultEnabled:
        typeof reasoning.default_enabled === "boolean"
          ? reasoning.default_enabled
          : null,
      mandatory: reasoning.mandatory === true,
      supportedEfforts,
      supportsMaxTokens: reasoning.supports_max_tokens === true,
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
