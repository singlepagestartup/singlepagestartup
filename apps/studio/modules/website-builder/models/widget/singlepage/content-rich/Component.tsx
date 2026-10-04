/**
 * website-builder.widget.content-rich
 *
 * Renders a rich-text HTML body with the shared prose styling. Part of the
 * website-builder content family (model: widget). Display components compose
 * this via import to render article/page body content.
 */
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export const defaultContentRichProps = {
  content: `
<p>Choosing the right subscription plan can feel overwhelming when every tier offers a different mix of features. This guide breaks down our approach to pricing and helps you make an informed decision.</p>

<h2>Understanding your needs</h2>
<p>Before comparing plans, take a step back and assess what your team actually needs. Consider the number of active projects, the modules you'll rely on most, and your expected growth over the next 12 months.</p>

<blockquote>The best plan isn't always the most expensive one — it's the one that grows with you without paying for features you'll never use.</blockquote>

<h2>Comparing feature sets</h2>
<p>Our three tiers — <strong>Free</strong>, <strong>Startup</strong>, and <strong>Enterprise</strong> — are designed for different stages of product maturity. The Free tier gives you access to 3 modules and 1 project, perfect for prototyping and personal use.</p>

<p>The Startup plan unlocks all 15 modules, 5 projects, custom domains, and API access. For most growing teams, this is the sweet spot — you get everything you need without the overhead of enterprise-grade compliance features.</p>

<h2>When to upgrade</h2>
<p>There are a few clear signals that it's time to move up:</p>
<ul>
<li>You're hitting project or storage limits regularly</li>
<li>You need SSO or advanced RBAC controls</li>
<li>Your team has grown beyond 10 active contributors</li>
<li>You require an SLA guarantee for production workloads</li>
</ul>

<h3>Cost optimization tips</h3>
<p>Annual billing saves 20% across all paid tiers. If you're committing to a year, it's almost always worth it. You can also start with Startup and upgrade individual features through add-ons before jumping to the full Enterprise plan.</p>

<p>We also offer a 14-day free trial on all paid plans, so you can test everything before making a commitment.</p>
  `,
};

export type ContentRichProps = typeof defaultContentRichProps;

export function ContentRich(props?: Partial<ContentRichProps>) {
  const { content } = { ...defaultContentRichProps, ...props };
  const editor = useEditor(
    {
      editable: false,
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Link.configure({
          autolink: false,
          openOnClick: false,
        }),
      ],
      content,
      editorProps: {
        attributes: {
          class: "max-w-none outline-none",
        },
      },
    },
    [content],
  );

  return (
    <article
      data-ds-block="website-builder.widget.content-rich"
      data-ds-layer="singlepage"
      className="min-w-0 max-w-none text-base leading-7 text-[var(--workspace-brand-foreground)]
        [&_.ProseMirror_p]:mb-6 [&_.ProseMirror_p]:text-base [&_.ProseMirror_p]:leading-7 [&_.ProseMirror_p]:text-[var(--workspace-brand-foreground)]
        [&_.ProseMirror_h1]:mb-6 [&_.ProseMirror_h1]:mt-12 [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:leading-tight
        [&_.ProseMirror_h2]:mb-5 [&_.ProseMirror_h2]:mt-12 [&_.ProseMirror_h2]:text-[2rem] [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:leading-tight [&_.ProseMirror_h2]:tracking-normal
        [&_.ProseMirror_h3]:mb-4 [&_.ProseMirror_h3]:mt-8 [&_.ProseMirror_h3]:text-2xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:leading-8
        [&_.ProseMirror_blockquote]:my-8 [&_.ProseMirror_blockquote]:rounded-2xl [&_.ProseMirror_blockquote]:bg-[var(--workspace-brand-primary)] [&_.ProseMirror_blockquote]:p-6 [&_.ProseMirror_blockquote]:text-white [&_.ProseMirror_blockquote]:not-italic sm:[&_.ProseMirror_blockquote]:p-8
        [&_.ProseMirror_blockquote_p]:mb-0 [&_.ProseMirror_blockquote_p]:text-lg [&_.ProseMirror_blockquote_p]:leading-8 [&_.ProseMirror_blockquote_p]:text-white [&_.ProseMirror_blockquote_strong]:text-white
        [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_strong]:text-[var(--workspace-brand-foreground)]
        [&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-[var(--workspace-brand-foreground)] [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4 [&_.ProseMirror_a]:decoration-[var(--workspace-brand-muted)] [&_.ProseMirror_a]:focus-visible:outline-2 [&_.ProseMirror_a]:focus-visible:outline-offset-2 [&_.ProseMirror_a]:focus-visible:outline-[var(--workspace-brand-focus)]
        [&_.ProseMirror_ul]:mb-6 [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:space-y-3 [&_.ProseMirror_ol]:mb-6 [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:space-y-3 [&_.ProseMirror_li]:pl-1 [&_.ProseMirror_li]:text-base [&_.ProseMirror_li]:leading-7 [&_.ProseMirror_li_p]:mb-0
        [&_.ProseMirror_code]:rounded-md [&_.ProseMirror_code]:bg-[var(--workspace-brand-background)] [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-sm
        [&_.ProseMirror_pre]:my-8 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-2xl [&_.ProseMirror_pre]:bg-[var(--workspace-brand-primary)] [&_.ProseMirror_pre]:p-6
        [&_.ProseMirror_pre_code]:border-0 [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_pre_code]:text-sm [&_.ProseMirror_pre_code]:text-[var(--workspace-brand-muted-on-primary)]
        [&_.ProseMirror_hr]:my-10 [&_.ProseMirror_hr]:border-[var(--workspace-brand-line)]"
    >
      <EditorContent editor={editor} />
    </article>
  );
}
