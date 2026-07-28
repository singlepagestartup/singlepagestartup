import { Tag } from "lucide-react";

import { TagButtonDefault } from "../../../tag/singlepage/button-default/Component";

interface TagFindButtonItem {
  label: string;
  href?: string;
}

export interface TagFindButtonProps {
  title: string;
  tags: TagFindButtonItem[];
}

export const defaultTagFindButtonProps: TagFindButtonProps = {
  title: "Popular Tags",
  tags: [
    { label: "pricing", href: "/blog/tags/pricing" },
    { label: "plans", href: "/blog/tags/plans" },
    { label: "getting-started", href: "/blog/tags/getting-started" },
    { label: "release", href: "/blog/tags/release" },
    { label: "features", href: "/blog/tags/features" },
    { label: "ai", href: "/blog/tags/ai" },
    { label: "case-study", href: "/blog/tags/case-study" },
    { label: "scaling", href: "/blog/tags/scaling" },
    { label: "ecommerce", href: "/blog/tags/ecommerce" },
    { label: "tutorial", href: "/blog/tags/tutorial" },
    { label: "admin", href: "/blog/tags/admin" },
    { label: "security", href: "/blog/tags/security" },
    { label: "rbac", href: "/blog/tags/rbac" },
    { label: "enterprise", href: "/blog/tags/enterprise" },
    { label: "api", href: "/blog/tags/api" },
    { label: "webhooks", href: "/blog/tags/webhooks" },
  ],
};

export function TagFindButton(props?: Partial<TagFindButtonProps>) {
  const { title, tags } = { ...defaultTagFindButtonProps, ...props };

  return (
    <div
      className="w-full pb-10"
      data-ds-block="blog.widget.tag-find-button"
      data-ds-imports="blog.tag.button-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-700">{title}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagButtonDefault
                key={tag.label}
                label={tag.label}
                href={tag.href}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
