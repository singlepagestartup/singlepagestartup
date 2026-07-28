"use client";

import type { ProfileSidebarProfileUpdateValues } from "../hooks/use-profile-sidebar";
import {
  LocalizedTextFields,
  normalizeLocalizedTextFields,
} from "../../../../title";
import { normalizeLocalizedPlainTextFields } from "@sps/social/models/profile/frontend/component/src/lib/singlepage/plain-text";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@sps/shared-ui-shadcn";
import { ImageIcon, Save } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

interface ProfileEditDialogProps {
  isOpen: boolean;
  isSaving?: boolean;
  language: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ProfileSidebarProfileUpdateValues) => void;
  profile: ISocialModuleProfile | null;
}

function getLanguageValue(value: LocalizedTextFields, language: string) {
  return value[language] || "";
}

export function ProfileEditDialog(props: ProfileEditDialogProps) {
  const titleValues = useMemo(() => {
    return normalizeLocalizedTextFields(props.profile?.title);
  }, [props.profile?.title]);
  const subtitleValues = useMemo(() => {
    return normalizeLocalizedTextFields(props.profile?.subtitle);
  }, [props.profile?.subtitle]);
  const descriptionValues = useMemo(() => {
    return normalizeLocalizedPlainTextFields(props.profile?.description);
  }, [props.profile?.description]);
  const [adminTitle, setAdminTitle] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!props.isOpen || !props.profile) {
      return;
    }

    setAvatarFile(null);
    setAdminTitle(props.profile.adminTitle || "");
    setTitle(getLanguageValue(titleValues, props.language));
    setSubtitle(getLanguageValue(subtitleValues, props.language));
    setDescription(getLanguageValue(descriptionValues, props.language));
  }, [
    descriptionValues,
    props.isOpen,
    props.language,
    props.profile,
    subtitleValues,
    titleValues,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!props.profile) {
      return;
    }

    props.onSave({
      adminTitle: adminTitle.trim(),
      title: {
        ...titleValues,
        [props.language]: title.trim(),
      },
      subtitle: {
        ...subtitleValues,
        [props.language]: subtitle.trim(),
      },
      description: {
        ...descriptionValues,
        [props.language]: description.trim(),
      },
      avatarFile,
    });
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent className="z-[70] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update this chat-local AI profile.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="profile-avatar">Photo</Label>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <Input
                id="profile-avatar"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setAvatarFile(event.currentTarget.files?.[0] || null);
                }}
              />
            </div>
            {avatarFile ? (
              <p className="truncate text-xs text-slate-500">
                {avatarFile.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-admin-title">Admin title</Label>
            <Input
              id="profile-admin-title"
              value={adminTitle}
              onChange={(event) => {
                setAdminTitle(event.currentTarget.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-title">Title</Label>
            <Input
              id="profile-title"
              value={title}
              onChange={(event) => {
                setTitle(event.currentTarget.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-subtitle">Subtitle</Label>
            <Input
              id="profile-subtitle"
              value={subtitle}
              onChange={(event) => {
                setSubtitle(event.currentTarget.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-description">Description</Label>
            <Textarea
              id="profile-description"
              className="min-h-40 resize-y"
              value={description}
              onChange={(event) => {
                setDescription(event.currentTarget.value);
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={props.isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
