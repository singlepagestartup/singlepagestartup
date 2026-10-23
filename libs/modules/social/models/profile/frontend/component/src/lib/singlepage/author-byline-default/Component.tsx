import Link from "next/link";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { cn } from "@sps/shared-frontend-client-utils";
import { getLocalizedPlainText } from "../plain-text";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const name =
    props.data.title?.[props.language] ||
    props.data.title?.en ||
    (ru ? "Автор" : "Author");
  const subtitle = getLocalizedPlainText(props.data.subtitle, props.language);
  const avatar = props.data.avatar;
  const src = avatar?.file
    ? /^https?:\/\//.test(avatar.file)
      ? avatar.file
      : `${NEXT_PUBLIC_API_SERVICE_URL}/public${avatar.file}`
    : null;
  return (
    <Link
      href={`/${props.language}/authors/${props.data.id}`}
      data-module="social"
      data-model="profile"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4",
        props.className,
        props.inverse && "text-default-foreground",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground",
            props.size === "xs" ? "size-6 text-xs" : "size-11 text-sm",
          )}
        >
          {src ? (
            <img src={src} alt="" className="size-full object-cover" />
          ) : (
            name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
          )}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "break-words font-semibold",
              props.size === "xs" ? "text-xs" : "text-base",
            )}
          >
            {name}
          </p>
          {subtitle && props.size !== "xs" ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
