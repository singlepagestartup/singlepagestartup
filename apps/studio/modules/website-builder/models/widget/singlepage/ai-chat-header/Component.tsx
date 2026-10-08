"use client";
import { Component as Header } from "./index";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/Component";
export function Component() {
  return (
    <div className="@container font-sps">
      <Header
        page="chat"
        projectNavigation={(props) => <ProjectSelect {...props} />}
      />
    </div>
  );
}
