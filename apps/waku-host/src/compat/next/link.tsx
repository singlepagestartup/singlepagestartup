"use client";

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
} from "react";
import { useRouter_UNSTABLE as useWakuRouter } from "waku/router/client";
import { toWakuPath } from "../../lib/routing";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children?: ReactNode;
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function shouldLetBrowserHandleNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  target?: string,
  download?: AnchorHTMLAttributes<HTMLAnchorElement>["download"],
) {
  return (
    event.button !== 0 ||
    isModifiedEvent(event) ||
    !!download ||
    (!!target && target !== "_self")
  );
}

function getInternalHref(href: string) {
  const url = new URL(href, window.location.href);

  if (url.origin !== window.location.origin) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    children,
    download,
    onClick,
    onMouseEnter,
    prefetch = true,
    replace,
    scroll,
    target,
    ...rest
  },
  ref,
) {
  const router = useWakuRouter();

  const prefetchHref = useCallback(() => {
    const internalHref = getInternalHref(href);

    if (!prefetch || !internalHref) {
      return;
    }

    router.prefetch(toWakuPath(internalHref));
  }, [href, prefetch, router]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) {
        return;
      }

      if (shouldLetBrowserHandleNavigation(event, target, download)) {
        return;
      }

      const internalHref = getInternalHref(href);

      if (!internalHref) {
        return;
      }

      event.preventDefault();

      if (replace) {
        router.replace(toWakuPath(internalHref), { scroll });
        return;
      }

      router.push(toWakuPath(internalHref), { scroll });
    },
    [download, href, onClick, replace, router, scroll, target],
  );

  const handleMouseEnter = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onMouseEnter?.(event);

      if (event.defaultPrevented) {
        return;
      }

      prefetchHref();
    },
    [onMouseEnter, prefetchHref],
  );

  return (
    <a
      {...rest}
      download={download}
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      ref={ref}
      target={target}
    >
      {children}
    </a>
  );
});

export default Link;
