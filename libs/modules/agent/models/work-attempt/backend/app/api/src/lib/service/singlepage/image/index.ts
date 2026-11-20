import { createHash } from "node:crypto";
import type {
  ICustomerWorkRun,
  ICustomerWorkRunAttachment,
} from "@sps/rbac/models/subject/sdk/model";
import type { IProviderType } from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import { StageSkillsUnavailable } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/knowledge";
import type { Service as WorkAttempt } from "../index";
import {
  captionLayer,
  coverDigest,
  describeAppearance,
  fontByteLimit,
  isCoverConfirmation,
  photoByteLimit,
  prepareCoverPhoto,
  readCoverBrief,
  type ICoverBrief,
  type ICoverLayers,
  type TCoverIssue,
} from "./utils";

type TContext = Awaited<
  ReturnType<
    WorkAttempt["modules"]["rbac"]["subject"]["customerWork"]["contextForRun"]
  >
>;
type TBriefContext = NonNullable<TContext["imageBrief"]>;

export interface IConfirmedCover {
  digest: string;
  publicationId: string;
  stageId: string;
  brief: ICoverBrief;
  layers: ICoverLayers;
  provider: IProviderType;
  sourceImage?: Uint8Array;
}

interface ICoverReply {
  text: string;
  imageDraftDigest?: string | null;
}

export class CoverWork {
  constructor(private readonly service: WorkAttempt) {}

  async prepare(
    input: ICustomerWorkRun,
    newDraft = false,
  ): Promise<IConfirmedCover | ICoverReply | null> {
    const { task, stage, funding } =
      await this.service.modules.crm.task.getWork({
        ...input,
        expectedAssignmentRevision: input.assignmentRevision,
      });
    if (stage.output !== "image" || stage.imageBrief !== "marketplace-cover") {
      return null;
    }

    const work = task.orderId
      ? await this.service.modules.ecommerce.order.work.findByOrder(
          task.orderId,
        )
      : null;
    if (
      work?.kind !== "individual-service" ||
      work.paid ||
      work.customerId !== task.customerId ||
      work.taskId !== task.id ||
      work.storeId !== task.storeId
    ) {
      throw new Error(
        "Conflict error. The cover needs an unpaid individual-service order",
      );
    }
    let context;
    try {
      context =
        await this.service.modules.rbac.subject.customerWork.contextForRun(
          input,
        );
    } catch (error) {
      if (error instanceof StageSkillsUnavailable) {
        return { text: error.reply, imageDraftDigest: null };
      }
      throw error;
    }
    const { imageBrief, attachments } = context;
    if (!imageBrief) {
      throw new Error("Conflict error. The cover brief is unavailable");
    }
    const russian = imageBrief.replies.some(({ text }) =>
      /\p{Script=Cyrillic}/u.test(text),
    );
    const parsed = readCoverBrief(imageBrief.replies, attachments);
    if ("issues" in parsed) {
      return this.clarify(parsed.issues, russian);
    }

    const { brief } = parsed;
    const binding =
      await this.service.modules.rbac.subject.providerConnections.resolve(
        task.storeId,
        input.assigneeId,
        "image",
        {
          modelId: newDraft ? undefined : context.requestedModelId,
          reasoning: newDraft ? undefined : context.requestedReasoning,
          defaultOnly: funding?.payer === "customer",
        },
      );
    const artwork = await this.artwork(brief, binding.provider === "openai");
    if (typeof artwork === "string") {
      return this.clarify([artwork], russian);
    }
    const { layers, sourceImage } = artwork;
    const digest = coverDigest(
      brief,
      sourceImage ? "provider-edit" : undefined,
      context.skillGuidance,
    );
    const approval = newDraft ? "new-draft" : this.approval(imageBrief, digest);
    if (approval === "repeat") {
      return {
        text: russian
          ? "Вы уже подтвердили этот бриф."
          : "You already confirmed this brief.",
      };
    }
    if (imageBrief.draftDigest === digest && approval === "none") {
      return {
        text: russian
          ? "Чтобы начать работу по этому брифу, ответьте «Генерируй»."
          : "Reply ‘Generate’ to start work on this brief.",
      };
    }

    if (approval !== "approved") {
      return this.propose(
        brief,
        digest,
        russian,
        Boolean(sourceImage),
        context.skillTitles ?? [],
      );
    }
    return {
      digest,
      publicationId: task.publicationId,
      stageId: stage.id,
      brief,
      layers,
      provider: binding.provider,
      sourceImage,
    };
  }

  assertConfirmed(context: TContext, cover: IConfirmedCover) {
    const { imageBrief, attachments } = context;
    if (!imageBrief || this.approval(imageBrief, cover.digest) !== "approved") {
      throw new Error("Conflict error. The cover draft confirmation changed");
    }
    const parsed = readCoverBrief(imageBrief.replies, attachments);
    const productMode = cover.sourceImage ? "provider-edit" : undefined;
    if (
      !("brief" in parsed) ||
      coverDigest(parsed.brief, productMode, context.skillGuidance) !==
        cover.digest
    ) {
      throw new Error("Conflict error. The confirmed cover inputs changed");
    }
  }

  private approval(context: TBriefContext, digest: string) {
    const trigger = context.replies.at(-1);
    if (
      !trigger ||
      trigger.id !== context.triggerMessageId ||
      !isCoverConfirmation(trigger.text)
    ) {
      return "none";
    }
    const anchor = context.replies.findIndex(
      ({ id }) => id === context.draftReplyAnchorId,
    );
    if (
      context.draftDigest !== digest ||
      anchor < 0 ||
      anchor === context.replies.length - 1
    ) {
      return "new-draft";
    }
    if (
      context.replies
        .slice(anchor + 1, -1)
        .some(({ text }) => isCoverConfirmation(text))
    ) {
      return "repeat";
    }
    return "approved";
  }

  private async storedBytes(
    attachment: ICustomerWorkRunAttachment,
    limit: number,
  ) {
    const file = await this.service.modules.fileStorage.privateFile.findById({
      id: attachment.id,
    });
    if (
      !file ||
      file.size > limit ||
      file.bytes.length !== file.size ||
      file.digest !== attachment.digest ||
      createHash("sha256").update(file.bytes).digest("hex") !==
        attachment.digest
    ) {
      throw new Error("The uploaded attachment is unavailable");
    }
    return file.bytes;
  }

  private async artwork(
    brief: ICoverBrief,
    allowEdit: boolean,
  ): Promise<{ layers: ICoverLayers; sourceImage?: Uint8Array } | TCoverIssue> {
    let photo;
    try {
      const bytes = await this.storedBytes(brief.photo, photoByteLimit);
      photo = await prepareCoverPhoto(bytes, brief, allowEdit);
    } catch {
      return "photo";
    }
    const layers: ICoverLayers = { size: brief.size };
    if ("product" in photo) {
      layers.product = photo.product;
    }
    const sourceImage = "sourceImage" in photo ? photo.sourceImage : undefined;
    if (!brief.font) {
      return { layers, sourceImage };
    }
    try {
      const bytes = await this.storedBytes(brief.font, fontByteLimit);
      layers.caption = await captionLayer(bytes, brief);
      return { layers, sourceImage };
    } catch {
      return "font";
    }
  }

  private clarify(issues: TCoverIssue[], russian: boolean): ICoverReply {
    const prompts = russian
      ? {
          size: "Укажите один размер, например 1200×1600, или пропорции 3:4.",
          background:
            "Опишите фон, например «Фон: кремовый с тёмно-зелёными деталями».",
          photo: "Пришлите фото товара в PNG, JPEG или WebP.",
          caption:
            "Пришлите точный текст «Подпись: …» или напишите «Без надписи».",
          "caption-color":
            "Укажите один точный цвет надписи, например «Цвет текста: #183C32».",
          "caption-background":
            "Напишите «Подложка надписи: без плашки» или «Подложка надписи: с плашкой».",
          font: "Пришлите файл TTF или OTF, в котором есть символы для подписи.",
        }
      : {
          size: "Enter one size such as 1200×1600, or an aspect ratio such as 3:4.",
          background:
            "Describe the background, for example ‘Background: cream with dark green accents’.",
          photo: "Upload a product photo in PNG, JPEG, or WebP.",
          caption:
            "Provide ‘Caption: …’ with the exact wording, or enter ‘No caption’.",
          "caption-color":
            "Specify one exact caption color, for example ‘Caption color: #183C32’.",
          "caption-background":
            "Enter ‘Caption background: transparent’ or ‘Caption background: panel’.",
          font: "Upload a TTF or OTF font that includes the caption characters.",
        };
    return {
      text: issues.map((issue) => prompts[issue]).join("\n"),
      imageDraftDigest: null,
    };
  }

  private propose(
    brief: ICoverBrief,
    digest: string,
    russian: boolean,
    usesPhotoReference: boolean,
    skillTitles: string[],
  ): ICoverReply {
    const size = `${brief.size.width}×${brief.size.height} px`;
    let captionBackground = "";
    if (brief.captionBackground === "transparent") {
      captionBackground = russian
        ? "Надпись без плашки."
        : "The caption has a transparent background.";
    } else if (brief.captionBackground === "panel") {
      captionBackground = russian
        ? "Надпись на плашке."
        : "The caption has a background panel.";
    }
    const text = russian
      ? [
          `Обложка ${size}.`,
          `Фото товара «${brief.photo.name}».`,
          usesPhotoReference
            ? "Используем фото как образец товара для новой сцены."
            : "",
          describeAppearance(brief.appearance, true),
          skillTitles.length
            ? `При генерации учтём навыки ${skillTitles.map((title) => `«${title}»`).join(", ")}.`
            : "",
          brief.caption
            ? `Надпись «${brief.caption}», шрифт «${brief.font?.name}».`
            : "Без надписи.",
          brief.captionColor ? `Цвет текста — ${brief.captionColor}.` : "",
          captionBackground,
          "Если всё верно, ответьте «Генерируй».",
        ]
      : [
          `Cover ${size}.`,
          `Product photo ‘${brief.photo.name}’.`,
          usesPhotoReference
            ? "The photo will guide the appearance of the product in the new scene."
            : "",
          describeAppearance(brief.appearance),
          skillTitles.length
            ? `The image will use ${skillTitles.map((title) => `‘${title}’`).join(", ")}.`
            : "",
          brief.caption
            ? `Caption ‘${brief.caption}’ in font ‘${brief.font?.name}’.`
            : "No caption.",
          brief.captionColor ? `Caption color — ${brief.captionColor}.` : "",
          captionBackground,
          "Reply ‘Generate’ to confirm.",
        ];
    return { text: text.filter(Boolean).join("\n"), imageDraftDigest: digest };
  }
}
