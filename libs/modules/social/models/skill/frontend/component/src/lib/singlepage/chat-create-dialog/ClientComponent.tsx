"use client";

import { IChatSkillCreateValues, IClientComponentProps } from "./interface";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  SettingsDialogContent,
  SettingsDialogHeader,
  settingsFormStyles,
  Form,
  Input,
  Label,
  Textarea,
} from "@sps/shared-ui-shadcn";
import { Icon } from "@sps/ui-adapter";
import { useEffect, useId, useMemo } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
import { z } from "zod";

function toSkillSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/\p{Script=Cyrillic}+/gu, (word) =>
      slugify(word, { locale: "ru", strict: true }),
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeSkillSlug(value: string) {
  const slug = toSkillSlug(value);

  for (let unitLength = 1; unitLength <= slug.length / 2; unitLength += 1) {
    if (slug.length % unitLength !== 0) {
      continue;
    }

    const unit = slug.slice(0, unitLength);

    if (unit.includes("-") && unit.repeat(slug.length / unitLength) === slug) {
      return unit;
    }
  }

  return slug;
}

function skillCreateFormSchema(ru: boolean) {
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, ru ? "Введите название." : "Title is required"),
      slug: z.string().trim(),
      description: z
        .string()
        .refine(
          (value) => value.trim(),
          ru ? "Введите инструкцию." : "Description is required",
        ),
    })
    .refine(
      ({ title, slug }) => !title || Boolean(normalizeSkillSlug(slug || title)),
      {
        path: ["slug"],
        message: ru
          ? "Введите команду латиницей или цифрами."
          : "Enter a slug using letters or numbers.",
      },
    );
}

type SkillCreateFormValues = z.infer<ReturnType<typeof skillCreateFormSchema>>;

function getDefaultValues(): SkillCreateFormValues {
  return {
    title: "",
    slug: "",
    description: "",
  };
}

function getSkillFormValues(
  skill?: IClientComponentProps["data"],
): SkillCreateFormValues {
  if (!skill) {
    return getDefaultValues();
  }

  return {
    title: skill.title || skill.adminTitle || skill.slug,
    slug: skill.slug,
    description: skill.description || "",
  };
}

export function Component(props: IClientComponentProps) {
  const ru = props.language === "ru";
  const isEditing = props.mode === "edit" && Boolean(props.data);
  const id = useId();
  const schema = useMemo(() => skillCreateFormSchema(ru), [ru]);
  const form = useForm<SkillCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getSkillFormValues(props.data),
  });
  const titleInput = form.register("title");
  const slugInput = form.register("slug");
  const isSaving = props.isSubmitting || form.formState.isSubmitting;

  useEffect(() => {
    if (!props.open) {
      return;
    }

    form.reset(getSkillFormValues(props.data));
  }, [form, props.data?.id, props.open]);

  async function onSubmit(data: SkillCreateFormValues) {
    const title = data.title.trim();
    const values: IChatSkillCreateValues = {
      title,
      slug: normalizeSkillSlug(data.slug || title),
      description: data.description,
    };

    form.clearErrors("root");
    try {
      if (isEditing && props.data) {
        await props.onUpdate?.(props.data, values);
      } else {
        await props.onCreate(values, {
          orderIndex: props.orderIndex,
          profileId: props.profileId,
        });
      }
    } catch {
      form.setError("root", {
        message: ru
          ? "Навык не сохранился. Повторите попытку."
          : "Could not save the skill. Try again.",
      });
      return;
    }

    form.reset(getDefaultValues());
    props.onOpenChange(false);
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        props.onOpenChange(open);

        if (!open) {
          form.clearErrors();
        }
      }}
    >
      <SettingsDialogContent
        data-module="social"
        data-model="skill"
        data-variant="chat-create-dialog"
        closeLabel={ru ? "Закрыть" : "Close"}
      >
        <SettingsDialogHeader
          title={
            isEditing
              ? ru
                ? "Редактировать навык"
                : "Edit Skill"
              : ru
                ? "Новый навык"
                : "Create Skill"
          }
          description={
            ru
              ? "Опишите, что сотрудник должен сделать по команде в чате."
              : "Describe what the assistant should do when someone uses this command in chat."
          }
        />
        <Form {...form}>
          <form className="min-w-0" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid items-start gap-5 sm:grid-cols-2">
              <div className="grid min-w-0 gap-3">
                <Label
                  className={settingsFormStyles.label}
                  htmlFor={`${id}-title`}
                >
                  {ru ? "Название" : "Title"}
                </Label>
                <Input
                  id={`${id}-title`}
                  aria-invalid={Boolean(form.formState.errors.title)}
                  aria-describedby={
                    form.formState.errors.title
                      ? `${id}-title-error`
                      : undefined
                  }
                  className={settingsFormStyles.field}
                  {...titleInput}
                  onBlur={(event) => {
                    void titleInput.onBlur(event);

                    if (!form.getValues("slug")) {
                      form.setValue(
                        "slug",
                        normalizeSkillSlug(event.currentTarget.value),
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                    }
                  }}
                />
                {form.formState.errors.title?.message ? (
                  <p
                    id={`${id}-title-error`}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {form.formState.errors.title.message}
                  </p>
                ) : null}
              </div>
              <div className="grid min-w-0 gap-3">
                <Label
                  className={settingsFormStyles.label}
                  htmlFor={`${id}-slug`}
                >
                  {ru ? "Команда в чате" : "Slug"}
                </Label>
                <Input
                  id={`${id}-slug`}
                  aria-invalid={Boolean(form.formState.errors.slug)}
                  className={settingsFormStyles.field}
                  aria-describedby={[
                    `${id}-slug-hint`,
                    form.formState.errors.slug && `${id}-slug-error`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  {...slugInput}
                  onBlur={(event) => {
                    void slugInput.onBlur(event);

                    const normalizedSlug = normalizeSkillSlug(
                      event.currentTarget.value,
                    );

                    if (normalizedSlug !== event.currentTarget.value) {
                      form.setValue("slug", normalizedSlug, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                <p
                  id={`${id}-slug-hint`}
                  className="text-xs text-muted-foreground"
                >
                  {ru
                    ? "Например, /opisanie-tovara. Оставьте поле пустым, чтобы создать команду из названия навыка."
                    : "For example, /product-description. Leave this field blank to generate the command from the title."}
                </p>
                {form.formState.errors.slug?.message ? (
                  <p
                    id={`${id}-slug-error`}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {form.formState.errors.slug.message}
                  </p>
                ) : null}
              </div>
              <div className="grid min-w-0 gap-3 sm:col-span-2">
                <Label
                  className={settingsFormStyles.label}
                  htmlFor={`${id}-description`}
                >
                  {ru ? "Инструкция" : "Description"}
                </Label>
                <Textarea
                  id={`${id}-description`}
                  aria-invalid={Boolean(form.formState.errors.description)}
                  aria-describedby={
                    form.formState.errors.description
                      ? `${id}-description-error`
                      : undefined
                  }
                  rows={6}
                  className={settingsFormStyles.textarea}
                  {...form.register("description")}
                />
                {form.formState.errors.description?.message ? (
                  <p
                    id={`${id}-description-error`}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>
              {form.formState.errors.root?.message && (
                <p
                  role="alert"
                  className="text-sm text-destructive sm:col-span-2"
                >
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>
            <div className={settingsFormStyles.actions}>
              <Button
                type="submit"
                variant="primary"
                className={settingsFormStyles.primary}
                aria-busy={isSaving}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Icon
                    name="spinner-gap"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <Icon name={isEditing ? "floppy-disk" : "plus"} />
                )}
                {isEditing
                  ? ru
                    ? "Сохранить навык"
                    : "Save skill"
                  : ru
                    ? "Создать навык"
                    : "Create skill"}
              </Button>
            </div>
          </form>
        </Form>
      </SettingsDialogContent>
    </Dialog>
  );
}
