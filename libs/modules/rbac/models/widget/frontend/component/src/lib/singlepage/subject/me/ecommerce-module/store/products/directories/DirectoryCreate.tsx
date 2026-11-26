"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IStoreCatalogDirectoryItem,
  TStoreCatalogDirectoryKind,
  IStoreCatalogDirectoryCreate,
  IStoreCatalogDirectoryUpdate,
  IStoreCatalogDirectoryDetail,
} from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn/button";
import { Input } from "@sps/shared-ui-shadcn/input";
import {
  Dialog,
  DialogTrigger,
  SettingsDialogContent,
  SettingsDialogHeader,
} from "@sps/shared-ui-shadcn/dialog";
import { settingsFormStyles } from "@sps/shared-ui-shadcn/form/styles";
import { Select } from "@sps/ui-adapter";
import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { hasStatus } from "../../../../../../subject-me-crm-module-store-workspace/view-model";
import { directoryKeyTitle } from "./labels";
import { DirectoryPicker } from "./DirectoryPicker";

interface ICreateProps {
  subjectId: string;
  storeId: string;
  kind: TStoreCatalogDirectoryKind;
  language: string;
}
const titles = {
  categories: { ru: "Создать категорию", en: "Create category" },
  "attribute-keys": { ru: "Создать ключ атрибута", en: "Create attribute key" },
  attributes: { ru: "Создать атрибут", en: "Create attribute" },
};

export function DirectoryCreate(props: ICreateProps) {
  const [open, setOpen] = useState(false);
  const save = api.storeCatalogDirectories.useCreate({
    id: props.subjectId,
    storeId: props.storeId,
    kind: props.kind,
  });
  const title = titles[props.kind][props.language === "ru" ? "ru" : "en"];
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!save.isPending) {
          setOpen(next);
          save.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" className={settingsFormStyles.primary}>
          <Plus aria-hidden="true" className="size-4" />
          {title}
        </Button>
      </DialogTrigger>
      <SettingsDialogContent
        aria-describedby={undefined}
        closeLabel={props.language === "ru" ? "Закрыть" : "Close"}
      >
        <SettingsDialogHeader title={title} />
        {open && (
          <DirectoryForm
            {...props}
            saveCreate={save.mutateAsync}
            pending={save.isPending}
            error={save.error}
            onSaved={() => setOpen(false)}
          />
        )}
      </SettingsDialogContent>
    </Dialog>
  );
}

export function DirectoryForm({
  kind,
  language,
  subjectId,
  storeId,
  item,
  saveCreate,
  saveUpdate,
  pending,
  error,
  onSaved,
}: ICreateProps & {
  item?: IStoreCatalogDirectoryDetail;
  saveCreate?: (value: IStoreCatalogDirectoryCreate) => Promise<unknown>;
  saveUpdate?: (value: IStoreCatalogDirectoryUpdate) => Promise<unknown>;
  pending: boolean;
  error: unknown;
  onSaved: () => void;
}) {
  const ru = language === "ru";
  const [initial] = useState(item);
  const editable = !item || item.canEdit;
  const [title, setTitle] = useState(
    item?.title?.[language] || item?.adminTitle || "",
  );
  const [slug, setSlug] = useState(item?.slug || "");
  const [value, setValue] = useState(
    typeof item?.value === "string"
      ? item.value
      : item?.value?.[language] || "",
  );
  const [field, setField] = useState<"string" | "number">(
    item?.field === "number" ? "number" : "string",
  );
  const [key, setKey] = useState<IStoreCatalogDirectoryItem>();
  const [newKey, setNewKey] = useState(false);
  const isAttribute = kind === "attributes";
  const numeric =
    isAttribute &&
    (item ? item.field : newKey ? field : key?.field) === "number";
  const valid =
    (!isAttribute || (value.trim() && (item || newKey || key))) &&
    ((isAttribute && !newKey) || title.trim());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || pending || !editable) return;
    if (initial && saveUpdate) {
      const fields = { language, expectedUpdatedAt: initial.updatedAt };
      const changedSlug = slug !== initial.slug ? { slug: slug.trim() } : {};
      let data: IStoreCatalogDirectoryUpdate;
      if (kind === "attributes") {
        data = {
          ...fields,
          kind,
          value: numeric ? value.trim().replace(",", ".") : value.trim(),
        };
      } else if (kind === "attribute-keys") {
        data = { ...fields, ...changedSlug, kind, title: title.trim(), field };
      } else {
        data = { ...fields, ...changedSlug, kind, title: title.trim() };
      }
      try {
        await saveUpdate(data);
        onSaved();
      } catch {
        // Preserve the draft after a failed save.
      }
      return;
    }
    if (!saveCreate) return;
    let data: IStoreCatalogDirectoryCreate;
    if (kind === "attributes") {
      const keyInput = newKey
        ? { newKey: { title: title.trim(), field } }
        : { keyId: key?.id };
      data = {
        kind,
        language,
        ...keyInput,
        value: numeric ? value.trim().replace(",", ".") : value.trim(),
      };
    } else if (kind === "attribute-keys") {
      data = { kind, language, title: title.trim(), field };
    } else {
      data = { kind, language, title: title.trim() };
    }
    try {
      await saveCreate(data);
      onSaved();
    } catch {
      /* The form displays the mutation error and keeps the draft. */
    }
  }
  return (
    <form className="grid min-w-0 gap-5" onSubmit={submit}>
      {item && !editable && (
        <p className="text-sm text-muted-foreground">
          {ru ? "Только просмотр" : "Read only"}
        </p>
      )}
      {isAttribute && item && (
        <div className={settingsFormStyles.label}>
          <span>{ru ? "Ключ" : "Key"}</span>
          <span className="font-normal">
            {directoryKeyTitle(item, language)}
          </span>
        </div>
      )}
      {isAttribute && !item && (
        <div className="grid gap-2">
          {!newKey && (
            <div className={settingsFormStyles.label}>
              <span>{ru ? "Ключ атрибута" : "Attribute key"}</span>
              <DirectoryPicker
                {...{ subjectId, storeId, language }}
                kind="attribute-keys"
                label={ru ? "Выбрать ключ" : "Choose key"}
                value={key}
                onSelect={setKey}
              />
            </div>
          )}
          <Button
            type="button"
            className={settingsFormStyles.primary}
            onClick={() => setNewKey(!newKey)}
          >
            {newKey
              ? ru
                ? "Выбрать существующий ключ"
                : "Choose an existing key"
              : ru
                ? "Создать новый ключ"
                : "Create a new key"}
          </Button>
        </div>
      )}
      {(!isAttribute || newKey) && (
        <label className={settingsFormStyles.label}>
          {kind === "categories"
            ? ru
              ? "Название категории"
              : "Category name"
            : ru
              ? "Название ключа"
              : "Key name"}
          <Input
            className={settingsFormStyles.field}
            readOnly={!editable}
            required
            maxLength={180}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
      )}
      {item && !isAttribute && (
        <label className={settingsFormStyles.label}>
          {ru ? "Адрес" : "Slug"}
          <Input
            className={settingsFormStyles.field}
            value={slug}
            maxLength={180}
            required
            readOnly={
              !editable || (kind === "attribute-keys" && !item.canChangeField)
            }
            onChange={(event) => setSlug(event.target.value)}
          />
        </label>
      )}
      {(kind === "attribute-keys" || newKey) && (
        <div className={settingsFormStyles.label}>
          <span>{ru ? "Тип значения" : "Value type"}</span>
          <Select
            ui="shadcn"
            aria-label={ru ? "Тип значения" : "Value type"}
            contentClassName="z-[80]"
            disabled={!editable || Boolean(item && !item.canChangeField)}
            value={field}
            options={[
              { value: "string", label: ru ? "Текст" : "Text" },
              { value: "number", label: ru ? "Число" : "Number" },
            ]}
            onValueChange={(v) =>
              setField(v === "number" ? "number" : "string")
            }
          />
        </div>
      )}
      {isAttribute && (
        <label className={settingsFormStyles.label}>
          {ru ? "Значение" : "Value"}
          <Input
            className={settingsFormStyles.field}
            readOnly={!editable}
            required
            maxLength={numeric ? 110 : 10000}
            inputMode={numeric ? "decimal" : "text"}
            pattern={numeric ? "-?[0-9]{1,100}([.,][0-9]{1,8})?" : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
      )}
      {Boolean(error) && (
        <p role="alert" className="text-sm text-destructive">
          {hasStatus(error, 403)
            ? ru
              ? "У вас нет прав на сохранение записи."
              : "You do not have permission to save this entry."
            : hasStatus(error, 409)
              ? item
                ? ru
                  ? "Не удалось применить изменения. Проверьте адрес и откройте запись снова."
                  : "Could not apply changes. Check the slug and reopen the record."
                : ru
                  ? "Такая запись уже есть."
                  : "This entry already exists."
              : ru
                ? "Не удалось сохранить запись. Проверьте поля и попробуйте ещё раз."
                : "Could not save. Check the fields and try again."}
        </p>
      )}
      {editable && (
        <div className="flex justify-end">
          <Button
            type="submit"
            className={settingsFormStyles.primary}
            disabled={!valid || pending}
          >
            {pending
              ? ru
                ? "Сохраняем…"
                : "Saving…"
              : ru
                ? "Сохранить"
                : "Save"}
          </Button>
        </div>
      )}
    </form>
  );
}
