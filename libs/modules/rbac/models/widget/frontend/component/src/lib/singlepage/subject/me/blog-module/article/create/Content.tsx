"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
export function Component(props: { language: string }) {
  return (
    <Subject
      isServer={false}
      variant="me-blog-module-article-create-default"
      language={props.language}
    />
  );
}
