"use client";
import type { MouseEvent, ReactNode } from "react";

interface ISectionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}
export function SectionLink({ href, children, className }: ISectionLinkProps) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = event.currentTarget.ownerDocument.getElementById(
      href.slice(1),
    );
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: "start" });
    target.focus({ preventScroll: true });
  };
  return (
    <a href={href} target="_self" onClick={navigate} className={className}>
      {children}
    </a>
  );
}
