import type {
  IComponentProps,
  IAIChatSkill,
  IComponentVariantProps,
} from "./interface";
export type { IAIChatSkill, IComponentVariantProps } from "./interface";
import { twMerge as twMerge } from "tailwind-merge";
import Markdown from "markdown-to-jsx";
function MarkdownDocument({
  children,
  hideTitle = false,
  baseUrl,
  resolveLink,
  externalLinksNewTab = false,
  disableRawHTML = false,
  className,
}: {
  children: string;
  hideTitle?: boolean;
  baseUrl?: string;
  resolveLink?: (url: string) =>
    | string
    | {
        href: string;
        target: "_top";
      };
  externalLinksNewTab?: boolean;
  disableRawHTML?: boolean;
  className?: string;
}) {
  const assetUrl = (value: string = "") => {
    if (!baseUrl || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return value;
    const url = new URL(value, `https://studio.invalid${baseUrl}`);
    return url.pathname + url.search + url.hash;
  };
  return (
    <div
      className={twMerge(
        "min-w-0 max-w-none break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-muted [&_pre]:p-5 [&_pre_code]:whitespace-pre [&_pre_code]:break-normal text-base leading-7 text-muted-foreground [&_a]:text-muted-foreground [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <Markdown
        options={{
          disableParsingRawHTML: disableRawHTML,
          ...(baseUrl || externalLinksNewTab
            ? {
                overrides: {
                  img: {
                    component: ({
                      src,
                      alt,
                      ...props
                    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
                      <img {...props} src={assetUrl(src)} alt={alt ?? ""} />
                    ),
                  },
                  a: {
                    component: ({
                      href,
                      ...props
                    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                      const resolved =
                        resolveLink?.(assetUrl(href)) ?? assetUrl(href);
                      return (
                        <a
                          {...props}
                          {...(typeof resolved === "string"
                            ? { href: resolved }
                            : resolved)}
                          {...(externalLinksNewTab &&
                          /^https?:\/\//i.test(href ?? "")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        />
                      );
                    },
                  },
                },
              }
            : {}),
        }}
      >
        {hideTitle ? children.replace(/^# [^\n]+\n/, "") : children}
      </Markdown>
    </div>
  );
}

export function Component({
  variant = "id-ai-chat",
  data = businessAnalystSkill,
}: IComponentProps = {}) {
  return (
    <section
      data-ds-block="social.skill.id-ai-chat"
      data-id={data.id}
      data-module="social"
      data-model="skill"
      data-variant={variant}
    >
      <h3 className="mb-3 font-semibold">{data.title}</h3>
      <MarkdownDocument>{data.description}</MarkdownDocument>
    </section>
  );
}
// One Social Profile links to professional specialization Skills through
// social.profiles-to-skills: account-manager, brand-designer, business-analyst,
// communication-strategist, market-researcher, strategist and web-designer.
// Client role definitions live in apps/studio/workspace/products/singlepage/ai-chat/
// content/agent-roles/*.md; their canonical methods live in .agents/roles/*.md.
// This fixture copies only the Business Analyst mission for Products.md.
// Transfer updated role text into this owned fixture; Modules and Workspace stay independent.
// A Skill holds its specialization instructions; all Skills share one Profile.
export const businessAnalystSkill: IAIChatSkill = {
  id: "business-analyst",
  slug: "business-analyst",
  title: "Business Analyst",
  adminTitle: "Business Analyst",
  variant: "id-ai-chat",
  description:
    "Own the Products.md inventory and each selected product's document and Sales intake after Brief scope confirmation and before strategic selection; maintain models and related processes through later changes. There is no standalone Business document. Never present invented facts, prices, capacity, authority or processes as client inputs; later process designs remain explicit proposals. Read the confirmed Brief, the client conversation and materials and the existing Product customer, offer and economic sections. External Research can test a model assumption but never supplies an operator-controlled fact. Edit one owning source at a time and route conflicts to its owner.",
};
