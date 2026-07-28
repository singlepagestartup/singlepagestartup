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

<h2>Understanding Your Needs</h2>
<p>Before comparing plans, take a step back and assess what your team actually needs. Consider the number of active projects, the modules you'll rely on most, and your expected growth over the next 12 months.</p>

<blockquote>The best plan isn't always the most expensive one — it's the one that grows with you without paying for features you'll never use.</blockquote>

<h2>Comparing Feature Sets</h2>
<p>Our three tiers — <strong>Free</strong>, <strong>Startup</strong>, and <strong>Enterprise</strong> — are designed for different stages of product maturity. The Free tier gives you access to 3 modules and 1 project, perfect for prototyping and personal use.</p>

<p>The Startup plan unlocks all 15 modules, 5 projects, custom domains, and API access. For most growing teams, this is the sweet spot — you get everything you need without the overhead of enterprise-grade compliance features.</p>

<h2>When to Upgrade</h2>
<p>There are a few clear signals that it's time to move up:</p>
<ul>
<li>You're hitting project or storage limits regularly</li>
<li>You need SSO or advanced RBAC controls</li>
<li>Your team has grown beyond 10 active contributors</li>
<li>You require an SLA guarantee for production workloads</li>
</ul>

<h3>Cost Optimization Tips</h3>
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
      className="max-w-none
        [&_.ProseMirror_blockquote]:my-6 [&_.ProseMirror_blockquote]:rounded-lg [&_.ProseMirror_blockquote]:border [&_.ProseMirror_blockquote]:border-slate-200 [&_.ProseMirror_blockquote]:bg-slate-50 [&_.ProseMirror_blockquote]:px-5 [&_.ProseMirror_blockquote]:py-4 [&_.ProseMirror_blockquote]:text-sm [&_.ProseMirror_blockquote]:text-slate-600 [&_.ProseMirror_blockquote]:not-italic
        [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:border [&_.ProseMirror_code]:border-slate-200 [&_.ProseMirror_code]:bg-slate-50 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-xs [&_.ProseMirror_code]:text-slate-700
        [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:text-slate-900
        [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:text-slate-900
        [&_.ProseMirror_li]:text-sm [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:text-sm [&_.ProseMirror_p]:text-slate-600
        [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-slate-200 [&_.ProseMirror_pre]:bg-slate-900 [&_.ProseMirror_pre]:px-5 [&_.ProseMirror_pre]:py-4
        [&_.ProseMirror_pre_code]:border-0 [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:text-xs [&_.ProseMirror_pre_code]:text-slate-300
        [&_.ProseMirror_strong]:text-slate-900
        [&_.ProseMirror_ul]:mb-4 [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:space-y-1 [&_.ProseMirror_ul]:text-sm [&_.ProseMirror_ul]:text-slate-600"
    >
      <EditorContent editor={editor} />
    </article>
  );
}
