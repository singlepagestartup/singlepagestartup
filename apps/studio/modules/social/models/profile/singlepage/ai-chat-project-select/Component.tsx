"use client";
import { useState } from "react";
import { Component as View } from "./index";
import type { IProjectProfileOption } from "./View";

export interface IProfileSelectStoryProps {
  initialProfiles?: IProjectProfileOption[];
  onNavigate?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}

export function Component({
  initialProfiles = [
    { id: "pottery", title: "Pottery workshops" },
    { id: "photography", title: "Portrait photography" },
  ],
  onNavigate,
  onCloseAutoFocus,
}: IProfileSelectStoryProps = {}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selected, setSelected] = useState(initialProfiles[0]?.id ?? "");
  return (
    <View
      data={profiles}
      value={selected}
      onChange={(id) => {
        setSelected(id);
        onNavigate?.();
      }}
      onCreate={() => {
        const id = `profile-${profiles.length + 1}`;
        setProfiles((current) => [...current, { id, title: "New project" }]);
        setSelected(id);
        onNavigate?.();
      }}
      onCloseAutoFocus={onCloseAutoFocus}
    />
  );
}
