"use client";

import { Select } from "@sps/ui-adapter";
import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type {
  ICrmWorkspaceOffer,
  ICrmWorkspacePublication,
  TCrmWorkspaceCommand,
  TCrmWorkspaceCommandResult,
} from "@sps/rbac/models/subject/sdk/model";
import { Field } from "./Editor/Fields";
import { fieldClass, secondaryClass } from "./primitives";

interface ITestRunProps {
  storeId: string;
  language: string;
  publication: ICrmWorkspacePublication;
  offers: ICrmWorkspaceOffer[];
  taskId?: string;
  execute: (
    command: TCrmWorkspaceCommand,
  ) => Promise<TCrmWorkspaceCommandResult>;
}

export function TestRun({
  storeId,
  language,
  publication,
  offers,
  taskId,
  execute,
}: ITestRunProps) {
  const router = useRouter();
  const [offerId, setOfferId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<{ selection: string; key: string }>(undefined);
  const bindings = publication.bindings;
  const eligible = offers.filter((offer) => {
    const applies =
      bindings.offerIds.includes(offer.id) ||
      bindings.productIds.includes(offer.productId) ||
      (!bindings.productIds.length &&
        !bindings.offerIds.length &&
        !bindings.formIds.length);
    const selectable =
      publication.kind === "consultation" ||
      (publication.kind === "physical-order" && offer.kind === "physical") ||
      (publication.kind === "individual-service" &&
        offer.kind === "service" &&
        offer.requiresResultAcceptance);
    return applies && selectable;
  });
  const offer = eligible.find(({ id }) => id === offerId) ?? eligible[0];

  async function run(resume: boolean) {
    if (pending || (resume ? !taskId : !offer)) return;
    const selection = resume ? `task:${taskId}` : `offer:${offer.id}`;
    if (operation.current?.selection !== selection) {
      operation.current = { selection, key: crypto.randomUUID() };
    }
    const operationKey = operation.current.key;
    setError("");
    setPending(true);
    try {
      const result = await execute(
        resume && taskId
          ? { kind: "refresh-test", test: { storeId, taskId, operationKey } }
          : {
              kind: "start-test",
              test: {
                storeId,
                funnelId: publication.funnelId,
                productId: offer.productId,
                offerId: offer.id,
                operationKey,
              },
            },
      );
      if (result.kind === "start-test" || result.kind === "refresh-test") {
        operation.current = undefined;
        router.push(
          `/${language}/social/chats/${result.data.chatId}/threads/${result.data.threadId}`,
        );
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Не удалось открыть тестовый чат.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <h2 className="font-semibold">Тест воронки</h2>
        <p className="text-sm text-muted-foreground">
          {publication.name} · Версия {publication.version}. Расход токенов
          списывается с вашего баланса.
        </p>
      </div>
      {!publication.definition.workFunding && (
        <p className="text-sm text-muted-foreground">
          Настройте бюджет токенов и опубликуйте новую версию.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        {offer ? (
          <Field label="Товар для теста">
            <Select
              ui="shadcn"
              className={fieldClass}
              value={offer.id}
              onValueChange={setOfferId}
              options={eligible.map((item) => ({
                value: item.id,
                label: item.title,
              }))}
            />
          </Field>
        ) : (
          <p className="text-sm text-muted-foreground">
            Привяжите к воронке подходящий товар магазина.
          </p>
        )}
        <button
          type="button"
          className={secondaryClass}
          disabled={pending || !offer || !publication.definition.workFunding}
          onClick={() => void run(false)}
        >
          <FlaskConical aria-hidden="true" className="size-4" />
          Запустить тест
        </button>
        {taskId && (
          <button
            type="button"
            className={secondaryClass}
            disabled={pending || !publication.definition.workFunding}
            onClick={() => void run(true)}
          >
            Продолжить тест на этой версии
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
