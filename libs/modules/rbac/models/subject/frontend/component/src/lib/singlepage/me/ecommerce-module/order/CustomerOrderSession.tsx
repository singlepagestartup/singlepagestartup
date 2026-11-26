"use client";
import type { ReactNode } from "react";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type { UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@sps/shared-ui-shadcn";
import AuthenticationMe from "../../../authentication/me-default/client";
interface ISessionProps {
  language: string;
  skeleton?: ReactNode;
  children: (subjectId: string, authenticated: boolean) => ReactNode;
}
export function CustomerOrderSession({
  language,
  skeleton,
  children,
}: ISessionProps) {
  const ru = language === "ru";
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      waitForAuthenticationInit
      skeleton={skeleton}
      fallback={
        <p role="alert">
          {ru ? "Не удалось проверить вход." : "Could not verify your session."}{" "}
          <Link
            className="underline"
            href={`/${language}/rbac/subject/authentication/email-and-password`}
          >
            {ru ? "Войти" : "Sign in"}
          </Link>
        </p>
      }
    >
      {({ data, authenticated }) =>
        data ? children(data.id, authenticated) : null
      }
    </AuthenticationMe>
  );
}
function OrderSignIn({ language }: { language: string }) {
  return (
    <Link
      className="w-fit text-sm font-medium underline underline-offset-4"
      href={`/${language}/rbac/subject/authentication/email-and-password`}
    >
      {language === "ru" ? "Войти в аккаунт" : "Sign in to your account"}
    </Link>
  );
}
type OrderList = IResult["IEcommerceModuleOrderListResult"];
interface IQueryProps {
  language: string;
  authenticated: boolean;
  query: UseQueryResult<OrderList>;
  children: (orders: OrderList) => ReactNode;
}
export function OrderQueryResult({
  language,
  authenticated,
  query,
  children,
}: IQueryProps) {
  const ru = language === "ru";
  if (query.isPending)
    return <p role="status">{ru ? "Загружаем заказы…" : "Loading orders…"}</p>;
  const status =
    query.error && "status" in query.error ? query.error.status : undefined;
  if (status === 401 || status === 403 || status === 404)
    return (
      <div className="grid gap-3">
        <p role="status">{ru ? "Заказ недоступен." : "Order unavailable."}</p>
        {(!authenticated || status === 401) && (
          <OrderSignIn language={language} />
        )}
      </div>
    );
  if (query.data)
    return (
      <>
        {children(query.data)}
        {!authenticated && !query.data.length && (
          <OrderSignIn language={language} />
        )}
      </>
    );
  return (
    <div className="grid justify-items-start gap-3" role="alert">
      <p>{ru ? "Не удалось загрузить заказы." : "Could not load orders."}</p>
      <Button variant="outline" onClick={() => void query.refetch()}>
        {ru ? "Повторить" : "Try again"}
      </Button>
    </div>
  );
}
