import { z } from "zod";
import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import {
  isOrderPaymentStage,
  type IFunnelStage,
} from "@sps/crm/models/funnel/sdk/model";
import type {
  IOrderWork,
  IOrderPaymentConversation,
} from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as Message } from "@sps/social/models/message/sdk/model";
import {
  isStoreTest,
  type TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import {
  orderCheckoutProviders,
  orderPaymentProviderLabel,
  readOrderCheckoutButtons,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import type { Service as Subject } from "../../index";

type Command = Extract<TCustomerWorkCommand, { operation: "chat-checkout" }>;
type State = IOrderPaymentConversation;
type Button =
  { text: string; callback_data: string } | { text: string; url: string };
interface IContext {
  task: Task;
  work: IOrderWork;
  ru: boolean;
}
interface IPaymentRequest {
  id: string;
  email: string;
  provider: string;
  comment?: string;
  ecommerceModule: { orders: { id: string }[] };
}

export class OrderChatCheckout {
  constructor(
    private readonly subject: Subject,
    private readonly post: (
      task: Task,
      text: string,
      keyboard?: Button[][],
    ) => Promise<Message>,
  ) {}

  async context(
    task: Task,
    stage?: IFunnelStage,
  ): Promise<IContext | undefined> {
    if (
      !stage ||
      !isOrderPaymentStage(stage) ||
      !task.orderId ||
      task.assigneeKind !== "ai" ||
      !task.assigneeId ||
      task.status === "closed" ||
      isStoreTest(task.openingKey)
    ) {
      return;
    }
    const work = await this.subject.modules.ecommerce.order.work.findByOrder(
      task.orderId,
    );
    if (
      !work ||
      work.taskId !== task.id ||
      work.customerId !== task.customerId ||
      work.storeId !== task.storeId ||
      work.state !== "awaiting-payment" ||
      work.paid ||
      (work.kind === "individual-service" &&
        !work.files.some(
          (f) => f.id === work.acceptedFileId && !f.invalidatedByCartEdit,
        ))
    ) {
      return;
    }
    return { task, work, ru: /\p{Script=Cyrillic}/u.test(stage.name) };
  }

  current(work: IOrderWork) {
    const state = work.paymentConversation;
    return state && state.fileId === work.acceptedFileId ? state : undefined;
  }

  decisionButtons(state: State, message: Message, allowPay: boolean) {
    if (state.promptId !== message.id) {
      return [];
    }
    const buttons = readOrderCheckoutButtons(message)?.flat() ?? [];
    return buttons.filter((button) => {
      if (!("callback_data" in button)) {
        return false;
      }
      const value = button.callback_data;
      if (state.step === "method") {
        return (
          value === "back" ||
          this.providers().some((provider) => value === `method:${provider}`)
        );
      }
      if (state.step === "email") {
        return value === "back";
      }
      if (state.step === "comment") {
        return value === "skip" || value === "back";
      }
      return state.step === "ready" && allowPay && value === "pay";
    });
  }

  private providers() {
    return orderCheckoutProviders.filter((provider) =>
      this.subject.modules.billing.paymentIntent.isProviderAllowed({
        provider,
      }),
    );
  }

  private async prompt(
    ctx: IContext,
    state: Omit<State, "promptId" | "fileId">,
    text: string,
    buttons: Button[],
  ) {
    const message = await this.post(
      ctx.task,
      text,
      buttons.map((button) => [button]),
    );
    await this.subject.modules.ecommerce.order.repository.patchFulfillment(
      ctx.work.orderId,
      {
        paymentConversation: {
          ...state,
          fileId: ctx.work.acceptedFileId,
          promptId: message.id,
        },
      },
    );
  }

  private methods(ctx: IContext) {
    const buttons = this.providers().map((provider) => ({
      text: orderPaymentProviderLabel(provider, ctx.ru ? "ru" : "en"),
      callback_data: "method:" + provider,
    }));
    let text = ctx.ru ? "Выберите способ оплаты." : "Choose a payment method.";
    if (!buttons.length) {
      text = ctx.ru
        ? "Сейчас нет доступных способов оплаты."
        : "No payment methods are currently available.";
      buttons.push({
        text: ctx.ru ? "Проверить снова" : "Check again",
        callback_data: "back",
      });
    }
    return this.prompt(ctx, { step: "method" }, text, buttons);
  }

  async begin(ctx: IContext) {
    const orders = this.subject.modules.ecommerce.order.work;
    await orders.withOrderLock(ctx.work.orderId, async () => {
      const work = await orders.findByOrder(ctx.work.orderId);
      if (
        !work ||
        work.state !== "awaiting-payment" ||
        work.paid ||
        work.acceptedFileId !== ctx.work.acceptedFileId ||
        this.current(work)
      ) {
        return;
      }
      await this.open({ ...ctx, work });
    });
  }

  private async open(ctx: IContext) {
    const file = ctx.work.files.find((f) => f.id === ctx.work.acceptedFileId);
    if (file) {
      const currency = await this.subject.modules.billing.currency.findById({
        id: file.currencyId,
      });
      if (!currency) {
        throw new Error(
          "Conflict error. The accepted file currency is unavailable",
        );
      }
      const price =
        new Intl.NumberFormat(ctx.ru ? "ru" : "en", {
          maximumFractionDigits: 12,
        }).format(file.price as `${number}`) +
        " " +
        currency.symbol;
      await this.post(
        ctx.task,
        ctx.ru
          ? `Файл принят. К оплате ${price}.`
          : `File accepted. Amount due: ${price}.`,
      );
    }
    await this.methods(ctx);
  }

  private changeMethod(ru: boolean) {
    return {
      text: ru ? "Изменить способ оплаты" : "Change payment method",
      callback_data: "back",
    };
  }

  private ready(ctx: IContext, state: State, commentMessageId?: string) {
    return this.prompt(
      ctx,
      {
        step: "ready",
        provider: state.provider,
        emailMessageId: state.emailMessageId,
        commentMessageId,
      },
      ctx.ru
        ? "Всё готово. Перейдите к оплате заказа."
        : "Your order is ready for payment.",
      [
        {
          text: ctx.ru ? "Перейти к оплате" : "Proceed to payment",
          callback_data: "pay",
        },
      ],
    );
  }

  async answer(ctx: IContext, state: State, message: Message) {
    if (state.step === "email") {
      const email = z.email().safeParse(message.description?.trim());
      if (!email.success) {
        await this.prompt(
          ctx,
          { step: "email", provider: state.provider },
          ctx.ru
            ? "Проверьте адрес и отправьте email для чека ещё раз."
            : "Check the address and send your receipt email again.",
          [this.changeMethod(ctx.ru)],
        );
        return;
      }
      await this.prompt(
        ctx,
        {
          step: "comment",
          provider: state.provider,
          emailMessageId: message.id,
        },
        ctx.ru
          ? "Добавьте комментарий к заказу или выберите «Без комментария»."
          : "Send an order comment or choose “No comment”.",
        [
          {
            text: ctx.ru ? "Без комментария" : "No comment",
            callback_data: "skip",
          },
          this.changeMethod(ctx.ru),
        ],
      );
    } else if (state.step === "comment") {
      await this.ready(ctx, state, message.id);
    }
  }

  private async click(
    ctx: IContext,
    input: Extract<Command["input"], { kind: "button" }>,
  ): Promise<IPaymentRequest | undefined> {
    const state = this.current(ctx.work);
    if (!state || state.promptId !== input.messageId) {
      return;
    }
    const prompt = await this.subject.modules.social.message.findById({
      id: state.promptId,
    });
    if (
      !prompt ||
      !readOrderCheckoutButtons(prompt)
        ?.flat()
        .some((b) => "callback_data" in b && b.callback_data === input.value)
    ) {
      throw new Error("Validation error. Unknown checkout button");
    }
    if (input.value === "back") {
      await this.methods(ctx);
    } else if (state.step === "method") {
      const provider = this.providers().find(
        (p) => "method:" + p === input.value,
      );
      if (!provider) {
        await this.methods(ctx);
        return;
      }
      const name = orderPaymentProviderLabel(provider, ctx.ru ? "ru" : "en");
      await this.prompt(
        ctx,
        { step: "email", provider },
        ctx.ru
          ? `Способ оплаты — ${name}. Отправьте email для чека.`
          : `Payment method: ${name}. Send your receipt email.`,
        [this.changeMethod(ctx.ru)],
      );
    } else if (state.step === "comment" && input.value === "skip") {
      await this.ready(ctx, state);
    } else if (
      state.step === "ready" &&
      input.value === "pay" &&
      state.provider &&
      state.emailMessageId
    ) {
      if (!this.providers().some((p) => p === state.provider)) {
        await this.methods(ctx);
        return;
      }
      const messages = this.subject.modules.social.message;
      const email = await messages.findById({ id: state.emailMessageId });
      const comment = state.commentMessageId
        ? await messages.findById({ id: state.commentMessageId })
        : undefined;
      return {
        id: ctx.task.customerId,
        provider: state.provider,
        email: z.email().parse(email?.description?.trim()),
        comment: comment?.description ?? undefined,
        ecommerceModule: { orders: [{ id: ctx.work.orderId }] },
      };
    }
    return undefined;
  }

  async execute(
    customerId: string,
    command: Command,
    verifyButton?: (context: IContext) => Promise<void>,
  ) {
    const locked = <T>(
      operation: (ctx: IContext) => Promise<T>,
      requireContext = false,
    ) =>
      this.subject.repository.withSubjectLock({ subjectId: customerId }, () =>
        this.subject.modules.crm.task.withTask(command, async (task) => {
          if (!task.orderId || task.customerId !== customerId) {
            throw new Error("Not Found error. Order not found");
          }
          await this.subject.ecommerceModuleOrderAssertAccess({
            subjectId: customerId,
            orderId: task.orderId,
          });
          const funnel = await this.subject.modules.crm.task.getFunnel(command);
          const ctx = await this.context(
            task,
            funnel.definition.stages.find(
              (s) => s.id === task.stageId && !s.archived,
            ),
          );
          if (ctx) {
            return operation(ctx);
          }
          if (requireContext) {
            throw new Error(
              "Conflict error. The checkout step is no longer current",
            );
          }
          return undefined;
        }),
      );
    const input = command.input;
    const request = await locked(
      async (ctx) => {
        if (input.kind === "button") {
          await verifyButton?.(ctx);
          return this.click(ctx, input);
        }
        await this.begin(ctx);
        return undefined;
      },
      input.kind === "button" && Boolean(verifyButton),
    );
    if (!request || input.kind !== "button") {
      return;
    }

    // Provider dispatch may call back into the API. Release the conversation locks first.
    await this.subject.deanonymize({ id: customerId, email: request.email });
    const result = await this.subject.ecommerceOrderCheckout(request);
    const invoice = result.billingModule.invoices[0];
    if (invoice?.status === "paid" || invoice?.provider === "dummy") {
      await locked(async (ctx) => {
        if (this.current(ctx.work)?.promptId === input.messageId) {
          await this.prompt(
            ctx,
            { step: "confirming" },
            ctx.ru ? "Проверяем оплату заказа." : "Checking your payment.",
            [],
          );
        }
      });
      return;
    }
    const url = z.httpUrl().safeParse(invoice?.paymentUrl).data;
    if (!url) {
      throw new Error(
        "Платёжная система не вернула ссылку. Попробуйте ещё раз.",
      );
    }
    await locked(async (ctx) => {
      const state = this.current(ctx.work);
      if (state?.promptId !== input.messageId) {
        return;
      }
      await this.prompt(
        ctx,
        { step: "link", provider: state.provider },
        ctx.ru ? "Платёжная ссылка готова." : "Your payment link is ready.",
        [{ text: ctx.ru ? "Оплатить заказ" : "Pay for order", url }],
      );
    });
    return url;
  }
}
