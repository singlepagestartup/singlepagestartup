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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@sps/shared-ui-shadcn";
import { Pencil, Plus } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const skillCreateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["draft", "active", "archived"]),
});

type SkillCreateFormValues = z.infer<typeof skillCreateFormSchema>;

function toSkillSlug(value: string) {
  return value
    .toLowerCase()
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

function getDefaultValues(): SkillCreateFormValues {
  return {
    title: "",
    slug: "",
    description: "",
    status: "active",
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
    status:
      skill.status === "draft" ||
      skill.status === "active" ||
      skill.status === "archived"
        ? skill.status
        : "active",
  };
}

export function Component(props: IClientComponentProps) {
  const isEditing = props.mode === "edit" && Boolean(props.data);
  const form = useForm<SkillCreateFormValues>({
    resolver: zodResolver(skillCreateFormSchema),
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
      status: data.status,
    };

    if (isEditing && props.data) {
      await props.onUpdate?.(props.data, values);
    } else {
      await props.onCreate(values, {
        orderIndex: props.orderIndex,
        profileId: props.profileId,
      });
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
        className="z-[70] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Skill" : "Create Skill"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update instructions for this profile skill."
              : "Add instructions and link them to the current profile."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="skill-title">Title</Label>
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
                <Label htmlFor="skill-slug">Slug</Label>
                <Input
                  id="skill-slug"
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
                {form.formState.errors.slug?.message ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skill-description">Description</Label>
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
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => {
                  return (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">draft</SelectItem>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="archived">archived</SelectItem>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="w-auto"
                disabled={props.isSubmitting}
              >
                {isEditing ? (
                  <Pencil className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Save skill" : "Create skill"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
