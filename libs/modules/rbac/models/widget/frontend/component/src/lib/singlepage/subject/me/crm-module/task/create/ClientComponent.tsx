"use client";

import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  settingsFormStyles,
} from "@sps/shared-ui-shadcn";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../../ecommerce-module/store/StoreSection";
import { StoreSectionStatus } from "../../../ecommerce-module/store/StoreSectionStatus";
import { Field } from "../../../../../subject-me-crm-module-store-workspace/Fields";

import { taskHref } from "../../../../../subject-me-crm-module-store-workspace/view-model";

interface IIntakeProps {
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
  canManageTasks: boolean;
}

type TMode = "order" | "ask" | "add";

function Intake({
  subjectId,
  storeId,
  storeSlug,
  language,
  canManageTasks,
}: IIntakeProps) {
  const router = useRouter();
  const command = api.crmWorkspace.useCommand(subjectId);
  const [mode, setMode] = useState<TMode>("order");
  const offers = api.crmWorkspace.useIntake(
    subjectId,
    mode === "order" ? "" : storeId,
  );
  const options = api.crmWorkspace.useOptions(
    subjectId,
    canManageTasks ? storeId : "",
  );
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [offerId, setOfferId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const previous = useRef<{ key: string; selection: string }>(null);
  const ru = language === "ru";
  const eligible = offers.data?.filter(
    (offer) => mode === "ask" || offer.requiresResultAcceptance,
  );
  const offer = eligible?.find(({ id }) => id === offerId);
  return (
    <form
      className="grid min-w-0 gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        try {
          if (mode === "order") {
            const result = await command.mutateAsync({
              kind: "open-order-work",
              participantIds,
              order: { storeId, orderId: orderId.trim() },
            });
            router.push(taskHref(language, storeSlug, result.data.id));
          } else if (offer) {
            const selection = `${mode}:${offer.id}`;
            if (previous.current?.selection !== selection) {
              previous.current = { key: crypto.randomUUID(), selection };
            }
            const result = await command.mutateAsync({
              kind: "start-work",
              participantIds,
              work: {
                storeId,
                productId: offer.productId,
                offerId: offer.id,
                operation: mode,
                operationKey: previous.current.key,
              },
            });
            router.push(taskHref(language, storeSlug, result.data.id));
          }
        } catch (failure) {
          setError(
            failure instanceof Error
              ? failure.message
              : ru
                ? "Не удалось открыть задачу."
                : "Could not open the task.",
          );
        }
      }}
    >
      <Field label={ru ? "Основание задачи" : "Task source"}>
        <Select value={mode} onValueChange={(value: TMode) => setMode(value)}>
          <SelectTrigger aria-label={ru ? "Основание задачи" : "Task source"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order">
              {ru ? "Существующий заказ" : "Existing order"}
            </SelectItem>
            <SelectItem value="ask">
              {ru
                ? "Консультация от своего имени"
                : "Consultation under my name"}
            </SelectItem>
            <SelectItem value="add">
              {ru
                ? "Заказ услуги от своего имени"
                : "Service order under my name"}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {mode === "order" ? (
        <Field label={ru ? "ID заказа" : "Order ID"}>
          <Input
            className={settingsFormStyles.field}
            required
            value={orderId}
            onChange={(event) => setOrderId(event.currentTarget.value)}
          />
        </Field>
      ) : (
        <>
          <Field label={ru ? "Товар или услуга" : "Product or service"}>
            <Select value={offerId} onValueChange={setOfferId}>
              <SelectTrigger
                aria-label={ru ? "Товар или услуга" : "Product or service"}
              >
                <SelectValue
                  placeholder={ru ? "Выберите предложение" : "Choose an offer"}
                />
              </SelectTrigger>
              <SelectContent>
                {eligible?.map(({ id, title }) => (
                  <SelectItem key={id} value={id}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {!eligible?.length && !offers.isPending && (
            <p className="text-sm text-muted-foreground">
              {ru ? "Нет доступных предложений." : "No offers are available."}
            </p>
          )}
        </>
      )}
      {canManageTasks && (
        <fieldset className="grid min-w-0 gap-2">
          <legend className="mb-2 text-sm font-medium">
            {ru ? "Участники чата задачи" : "Task chat participants"}
          </legend>
          {options.data?.participants.map((person) => (
            <label
              key={person.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <Checkbox
                checked={participantIds.includes(person.id)}
                onCheckedChange={(checked) =>
                  setParticipantIds((previous) =>
                    checked
                      ? [...previous, person.id]
                      : previous.filter((id) => id !== person.id),
                  )
                }
              />
              {person.name}
            </label>
          ))}
          {options.isError && (
            <p role="alert">
              {ru
                ? "Не удалось загрузить сотрудников."
                : "Could not load employees."}{" "}
              <Button
                type="button"
                variant="outline"
                onClick={() => void options.refetch()}
              >
                {ru ? "Повторить" : "Retry"}
              </Button>
            </p>
          )}
        </fieldset>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="justify-self-end"
        disabled={
          command.isPending || (mode === "order" ? !orderId.trim() : !offer)
        }
      >
        {command.isPending
          ? ru
            ? "Открываем…"
            : "Opening…"
          : ru
            ? "Сохранить задачу"
            : "Save task"}
      </Button>
    </form>
  );
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  language,
}: IStoreSectionContentProps) {
  const ru = language === "ru";
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="tasks"
      taskAccess
    >
      {(session) =>
        session.access ? (
          <section
            className={`${settingsFormStyles.panel} grid w-full min-w-0 gap-6`}
          >
            <h1 className={settingsFormStyles.title}>
              {ru ? "Новая задача" : "New task"}
            </h1>
            <Intake
              key={session.access.subjectId}
              subjectId={session.access.subjectId}
              storeId={ecommerceModuleStore.id}
              storeSlug={ecommerceModuleStore.slug}
              canManageTasks={session.access.store.canManageTasks === true}
              language={language}
            />
          </section>
        ) : (
          <StoreSectionStatus
            language={language}
            session={session}
            deniedMessage={
              ru
                ? "Нет доступа к задачам магазина."
                : "You do not have access to tasks in this store."
            }
          />
        )
      }
    </StoreSection>
  );
}
