import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IStoreProductOffer,
  IStoreProductRelations,
  IStoreProductUpdate,
} from "@sps/rbac/models/subject/sdk/model";
import {
  settingsFormStyles,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { useCallback, useId, useRef, useState, type FormEvent } from "react";
import { hasStatus } from "../../../../../../../subject-me-crm-module-store-workspace/view-model";
import { localizedText } from "../../view-model";
import { Attributes } from "./Attributes";
import { Images } from "./Images";

type TAction = NonNullable<IStoreProductUpdate["relation"]>;
type TRemoveAction = Extract<
  TAction,
  { kind: "remove-image" | "remove-category" | "remove-attribute" }
>;

interface IProps {
  offers: IStoreProductOffer[];
  selectedOfferId?: string;
  onOfferChange: (id: string) => void;
  offerLocked: boolean;
  subjectId: string;
  storeId: string;
  productId: string;
  language: string;
  editable: boolean;
  relations: IStoreProductRelations;
  onRefresh: () => Promise<boolean>;
  onPendingChange: (pending: boolean) => void;
}

export function ProductRelations({
  offers,
  selectedOfferId,
  onOfferChange,
  offerLocked,
  subjectId,
  storeId,
  productId,
  language,
  editable,
  relations,
  onRefresh,
  onPendingChange,
}: IProps) {
  const ru = language === "ru";
  const update = api.storeProducts.useUpdate();
  const upload = api.storeProducts.useUploadImage();
  const busy = useRef(false);
  const [pendingKey, setPendingKey] = useState<string>();
  const [refreshRevision, setRefreshRevision] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [remove, setRemove] = useState<TRemoveAction>();
  const removalOffer =
    remove?.kind === "remove-attribute"
      ? offers.find(({ id }) => id === remove.offerId)
      : undefined;
  const removeTrigger = useRef<HTMLElement | null>(null);
  const relationPanel = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<{
    error?: string;
    conflict?: boolean;
    saved?: boolean;
  }>();
  const categoriesId = useId();
  const widgetsId = useId();
  const availableCategories = relations.categoryOptions.filter(
    ({ id }) =>
      !relations.categories.some(({ categoryId }) => categoryId === id),
  );
  const categoryLabels = (
    category: IStoreProductRelations["categoryOptions"][number],
  ) =>
    localizedText(category.title, language) ||
    category.adminTitle ||
    category.slug;

  const write = useCallback(
    async (key: string, operation: () => Promise<unknown>) => {
      if (busy.current) return false;
      busy.current = true;
      onPendingChange(true);
      setPendingKey(key);
      setFeedback(undefined);
      try {
        await operation();
        setFeedback({ saved: true });
        return true;
      } catch (error) {
        const conflict = hasStatus(error, 409, 404);
        let message = ru
          ? "Не удалось сохранить связь."
          : "Could not save the link.";
        if (conflict) {
          message = ru
            ? "Связи изменились. Загрузите актуальные данные."
            : "The links changed. Reload current data.";
        } else if (key === "upload") {
          message = ru
            ? "Изображение не удалось загрузить."
            : "Could not upload the image.";
        }
        setFeedback({ error: message, conflict });
        return false;
      } finally {
        busy.current = false;
        onPendingChange(false);
        setPendingKey(undefined);
      }
    },
    [onPendingChange, ru],
  );

  const mutate = update.mutateAsync;
  const uploadImage = upload.mutateAsync;
  const onAction = useCallback(
    (relation: TAction) =>
      write("id" in relation ? relation.id : relation.kind, () =>
        mutate({ id: subjectId, storeId, productId, data: { relation } }),
      ),
    [mutate, productId, storeId, subjectId, write],
  );
  const onUpload = useCallback(
    (file: File) =>
      write("upload", () =>
        uploadImage({ id: subjectId, storeId, productId, file }),
      ),
    [productId, storeId, subjectId, uploadImage, write],
  );
  const confirmRemoval = useCallback((action: TRemoveAction) => {
    const active = document.activeElement;
    removeTrigger.current = active instanceof HTMLElement ? active : null;
    setRemove(action);
  }, []);
  const removeImage = useCallback(
    (id: string) => confirmRemoval({ kind: "remove-image", id }),
    [confirmRemoval],
  );
  const removeAttribute = useCallback(
    (id: string, offerId: string) =>
      confirmRemoval({ kind: "remove-attribute", id, offerId }),
    [confirmRemoval],
  );

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (categoryId && (await onAction({ kind: "add-category", categoryId })))
      setCategoryId("");
  }

  return (
    <div ref={relationPanel} tabIndex={-1} className="grid min-w-0 gap-4">
      {feedback?.error && (
        <div className="grid gap-2 rounded-lg border border-destructive/40 p-3">
          <p role="alert" className="text-sm text-destructive">
            {feedback.error}
          </p>
          {feedback.conflict && (
            <Button
              type="button"
              variant="outline"
              className={`${settingsFormStyles.secondary} w-fit`}
              onClick={() =>
                void onRefresh().then((ok) => {
                  if (ok) {
                    setRefreshRevision((current) => current + 1);
                    setFeedback(undefined);
                  }
                })
              }
            >
              {ru ? "Загрузить актуальные данные" : "Reload current data"}
            </Button>
          )}
        </div>
      )}
      {feedback?.saved && (
        <p role="status" className="text-sm">
          {ru ? "Связи обновлены." : "Links updated."}
        </p>
      )}
      <fieldset
        disabled={pendingKey !== undefined}
        className="grid min-w-0 gap-4"
      >
        <Images
          images={relations.images}
          language={language}
          editable={editable}
          pendingKey={pendingKey}
          onUpload={onUpload}
          onAction={onAction}
          onRemove={removeImage}
        />
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Attributes
            key={selectedOfferId}
            subjectId={subjectId}
            storeId={storeId}
            offers={offers}
            selectedOfferId={selectedOfferId}
            onOfferChange={onOfferChange}
            offerLocked={offerLocked}
            attributes={relations.attributes}
            options={relations.attributeOptions}
            language={language}
            pendingKey={pendingKey}
            refreshRevision={refreshRevision}
            onAction={onAction}
            onRemove={removeAttribute}
          />
          <div className="grid min-w-0 gap-4">
            <section
              className={`${settingsFormStyles.panel} grid gap-5`}
              aria-labelledby={categoriesId}
            >
              <h2 id={categoriesId} className={settingsFormStyles.title}>
                {ru ? "Категории" : "Categories"}
              </h2>
              {relations.categories.length ? (
                <ul className="grid min-w-0 gap-2">
                  {relations.categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                      aria-busy={pendingKey === category.id}
                    >
                      <span className="min-w-0 break-words text-sm">
                        {categoryLabels(category)}
                      </span>
                      {editable && (
                        <Button
                          className={`${settingsFormStyles.button} w-fit border-transparent`}
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`${ru ? "Убрать категорию" : "Remove category"} · ${categoryLabels(category)}`}
                          onClick={() =>
                            confirmRemoval({
                              kind: "remove-category",
                              id: category.id,
                            })
                          }
                        >
                          {ru ? "Убрать" : "Remove"}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {ru ? "Категории не выбраны." : "No categories selected."}
                </p>
              )}
              {editable && !!availableCategories.length && (
                <form onSubmit={addCategory} className="grid min-w-0 gap-2">
                  <Select
                    className={settingsFormStyles.field}
                    ui="shadcn"
                    aria-label={ru ? "Новая категория" : "New category"}
                    value={
                      availableCategories.some(({ id }) => id === categoryId)
                        ? categoryId
                        : ""
                    }
                    placeholder={ru ? "Выбрать категорию" : "Choose a category"}
                    onValueChange={setCategoryId}
                    options={availableCategories.map((category) => ({
                      value: category.id,
                      label: categoryLabels(category),
                    }))}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!categoryId}
                    className={`${settingsFormStyles.secondary} w-fit`}
                  >
                    {ru ? "Добавить категорию" : "Add category"}
                  </Button>
                </form>
              )}
            </section>
            <section
              className={`${settingsFormStyles.panel} grid gap-5`}
              aria-labelledby={widgetsId}
            >
              <h2 id={widgetsId} className={settingsFormStyles.title}>
                {ru ? "Виджеты" : "Widgets"}
              </h2>
              {relations.widgets.length ? (
                <ul className="grid min-w-0 gap-2">
                  {relations.widgets.map((widget) => (
                    <li
                      key={widget.id}
                      className="grid min-w-0 gap-1 break-words text-sm"
                    >
                      <span>{widget.title || widget.widgetId}</span>
                      <span className="text-muted-foreground">
                        {widget.kind === "presentation"
                          ? ru
                            ? "Виджет сайта"
                            : "Website widget"
                          : ru
                            ? "Виджет каталога"
                            : "Catalogue widget"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {ru ? "Связанных виджетов нет." : "No linked widgets."}
                </p>
              )}
            </section>
          </div>
        </div>
      </fieldset>
      <AlertDialog
        open={Boolean(remove)}
        onOpenChange={(open) => {
          if (!open) setRemove(undefined);
        }}
      >
        <AlertDialogContent
          className={`${settingsFormStyles.panel} w-[calc(100%-2rem)] sm:rounded-2xl`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const focused = removeTrigger.current;
            (focused?.isConnected && !focused.matches(":disabled")
              ? focused
              : relationPanel.current
            )?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={settingsFormStyles.title}>
              {removalOffer
                ? ru
                  ? "Убрать характеристику предложения?"
                  : "Remove this offer attribute?"
                : ru
                  ? "Удалить связь с товаром?"
                  : "Remove this product link?"}
            </AlertDialogTitle>
            <AlertDialogDescription className={settingsFormStyles.description}>
              {removalOffer
                ? ru
                  ? `Характеристика будет убрана из предложения ${removalOffer.sku}.`
                  : `The attribute will be removed from offer ${removalOffer.sku}.`
                : ru
                  ? "Эта связь исчезнет из карточки товара."
                  : "This link will disappear from the product."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:space-x-0">
            <AlertDialogCancel
              className={`${settingsFormStyles.secondary} mt-0 sm:w-fit`}
            >
              {ru ? "Отмена" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className={`${settingsFormStyles.button} border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-fit`}
              onClick={() => {
                if (remove) void onAction(remove);
              }}
            >
              {ru ? "Удалить связь" : "Remove link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
