"use client";

import { IChatSkillCreateValues, IClientComponentProps } from "./interface";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
  Input,
  Label,
  Textarea,
} from "@sps/shared-ui-shadcn";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
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
  const schema = useMemo(() => skillCreateFormSchema(ru), [ru]);
  const form = useForm<SkillCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getSkillFormValues(props.data),
  });
  const titleInput = form.register("title");
  const slugInput = form.register("slug");

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
      <DialogContent
        data-module="social"
        data-model="skill"
        data-variant="chat-create-dialog"
        closeLabel={ru ? "Закрыть" : "Close"}
        className="z-[70] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? ru
                ? "Редактировать навык"
                : "Edit Skill"
              : ru
                ? "Новый навык"
                : "Create Skill"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? ru
                ? "Измените инструкцию навыка."
                : "Update instructions for this profile skill."
              : ru
                ? "Опишите, как сотрудник должен выполнять этот навык."
                : "Add instructions and link them to the current profile."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="skill-title">{ru ? "Название" : "Title"}</Label>
                <Input
                  id="skill-title"
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
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="skill-slug">
                  {ru ? "Команда в чате" : "Slug"}
                </Label>
                <Input
                  id="skill-slug"
                  aria-describedby={ru ? "skill-slug-hint" : undefined}
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
                {ru && (
                  <p
                    id="skill-slug-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Например, /opisanie-tovara. Команда создаётся из названия,
                    если оставить поле пустым.
                  </p>
                )}
                {form.formState.errors.slug?.message ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skill-description">
                {ru ? "Инструкция" : "Description"}
              </Label>
              <Textarea
                id="skill-description"
                rows={8}
                className="min-h-40 resize-y"
                {...form.register("description")}
              />
              {form.formState.errors.description?.message ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>
            {form.formState.errors.root?.message && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="w-auto"
                disabled={props.isSubmitting || form.formState.isSubmitting}
              >
                {isEditing ? (
                  <Pencil className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
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
      </DialogContent>
    </Dialog>
  );
}
