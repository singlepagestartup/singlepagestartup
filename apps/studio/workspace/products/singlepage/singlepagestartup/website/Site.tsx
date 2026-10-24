import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { IWorkspacePageProps } from "../../../../utils/pages";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";
import {
  websiteAssets,
  parseCodeFrameworkWebsite,
  type ICodeFrameworkWebsiteContent,
} from "./content";
import siteText from "./page.md?raw";
import "../../../../styles/singlepage.css";

export const siteStyles = {
  focus:
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-foreground)]",
  display:
    "[font-family:var(--workspace-brand-font-display)] font-semibold tracking-normal",
  muted: "text-[var(--workspace-brand-muted)]",
};

interface IPreviewLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  resolveLink?: IWorkspacePageProps["resolveLink"];
}

/** Product navigation resolves only declared pages; external resources retain their URLs. */
export function PreviewLink({
  href,
  resolveLink,
  children,
  ...props
}: IPreviewLinkProps) {
  const destination = resolveLink?.(href) ?? href;
  return (
    <a
      {...props}
      {...(typeof destination === "string"
        ? { href: destination }
        : destination)}
    >
      {children}
    </a>
  );
}

interface ISiteShellProps {
  children: ReactNode;
  content?: ICodeFrameworkWebsiteContent;
  resolveLink?: IWorkspacePageProps["resolveLink"];
  active?: "framework" | "modules" | "blog" | "tokens";
}

export function SiteShell({
  children,
  resolveLink,
  active,
  content: suppliedContent,
}: ISiteShellProps) {
  const content = suppliedContent ?? parseCodeFrameworkWebsite(siteText);
  const labels = content.labels;
  const groups = [
    {
      title: labels["footer-build"],
      links: content.footer.links.filter(
        ({ href }) => href.startsWith("/framework") || href.includes("#readme"),
      ),
    },
    {
      title: labels["footer-prepare"],
      links: content.footer.links.filter(
        ({ href }) =>
          href === "/" ||
          href === "/ecommerce" ||
          href.includes("/authentication/"),
      ),
    },
    {
      title: labels["footer-learn"],
      links: content.footer.links.filter(
        ({ href }) =>
          !href.startsWith("/framework") &&
          !href.includes("#readme") &&
          href !== "/" &&
          href !== "/ecommerce" &&
          !href.includes("/authentication/"),
      ),
    },
  ];
  const navigation = [
    {
      id: "framework",
      text: labels["navigation-framework"],
      href: "/framework",
    },
    {
      id: "modules",
      text: labels["navigation-foundation"],
      href: "/framework/modules",
    },
    { id: "blog", text: labels["navigation-blog"], href: "/blog" },
    { id: "tokens", text: labels["navigation-tokens"], href: "/ecommerce" },
  ];
  return (
    <div
      data-workspace-projection="singlepage"
      data-framework-site
      className="@container min-w-0 bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased [font-family:var(--workspace-brand-font-body)]"
    >
      <header className="border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 @3xl:px-8">
          <PreviewLink
            href="/framework"
            resolveLink={resolveLink}
            aria-label="SinglePageStartup — Code Framework"
            className={`inline-flex min-h-11 items-center ${siteStyles.focus}`}
          >
            <img
              src={websiteAssets.logo.src}
              alt="SinglePageStartup"
              width={192}
              height={42}
              className="h-auto w-44 max-w-full"
            />
          </PreviewLink>
          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          >
            {navigation.map((item) => (
              <PreviewLink
                key={item.id}
                href={item.href}
                resolveLink={resolveLink}
                aria-current={active === item.id ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md py-2 ${active === item.id ? "font-semibold" : siteStyles.muted} hover:text-[var(--workspace-brand-foreground)] ${siteStyles.focus}`}
              >
                {item.text}
              </PreviewLink>
            ))}
            <PreviewLink
              href="/"
              resolveLink={resolveLink}
              className={`${kit.secondary} gap-2`}
            >
              <Icon name="chat-circle" size={20} />
              {labels["navigation-chat"]}
            </PreviewLink>
            <a
              href={content.hero.links[0].href}
              target="_blank"
              rel="noreferrer"
              className={`${kit.button} gap-2`}
            >
              <Icon name="github-logo" size={20} />
              {labels["navigation-code"]}
              <span className="sr-only"> (opens GitHub in a new tab)</span>
            </a>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 @xl:grid-cols-2 @3xl:grid-cols-[1.5fr_1fr_1fr_1fr] @3xl:px-8">
          <div>
            <PreviewLink
              href="/framework"
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center ${siteStyles.focus}`}
            >
              <img
                src={websiteAssets.logo.src}
                alt="SinglePageStartup"
                width={176}
                height={38}
                className="h-auto w-44"
              />
            </PreviewLink>
            <p className={`mt-3 text-xs ${siteStyles.muted}`}>
              {content.footer.title}
            </p>
            <p
              className={`mt-3 max-w-xs text-sm leading-6 ${siteStyles.muted}`}
            >
              {content.footer.paragraphs[0]}
            </p>
            <p className={`mt-4 text-xs ${siteStyles.muted}`}>
              {content.footer.paragraphs[1]}
            </p>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-semibold">{group.title}</p>
              <ul className="mt-3 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <PreviewLink
                      href={link.href}
                      resolveLink={resolveLink}
                      {...(link.href.startsWith("https:")
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className={`inline-flex min-h-11 items-center rounded-md text-sm ${siteStyles.muted} hover:text-[var(--workspace-brand-foreground)] ${siteStyles.focus}`}
                    >
                      {link.text}
                      {link.href.startsWith("https:") ? (
                        <span className="sr-only"> (opens in a new tab)</span>
                      ) : null}
                    </PreviewLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </footer>
    </div>
  );
}
