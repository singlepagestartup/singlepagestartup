"use client";

import { useState } from "react";
import { IComponentPropsExtended } from "./interface";
import { useSearchParams } from "next/navigation";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { AdminComponent as Telegram } from "@sps/telegram/frontend/component";
import { AdminComponent as Agent } from "@sps/agent/frontend/component";
import { AdminComponent as Host } from "@sps/host/frontend/component";
import { AdminComponent as WebsiteBuilder } from "@sps/website-builder/frontend/component";
import { AdminComponent as Billing } from "@sps/billing/frontend/component";
import { AdminComponent as Broadcast } from "@sps/broadcast/frontend/component";
import { AdminComponent as Crm } from "@sps/crm/frontend/component";
import { AdminComponent as Ecommerce } from "@sps/ecommerce/frontend/component";
import { AdminComponent as Blog } from "@sps/blog/frontend/component";
import { AdminComponent as FileStorage } from "@sps/file-storage/frontend/component";
import { AdminComponent as Notification } from "@sps/notification/frontend/component";
import { AdminComponent as Rbac } from "@sps/rbac/frontend/component";
import { AdminComponent as Startup } from "@sps/startup/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const params = useSearchParams();
  const adminQueryParams = params.get("admin");

  const [widget, setWidget] = useState<string>("host");

  if (!adminQueryParams) {
    return null;
  }

  return (
    <RbacSubject
      variant="authentication-is-authorized-wrapper-default"
      isServer={false}
      apiProps={{
        params: {
          action: {
            route: "*",
            method: "*",
            type: "HTTP",
          },
        },
      }}
    >
      <section data-module="frontend" className="w-full py-2 lg:py-10 bg-input">
        <div className="w-full mx-auto max-w-7xl px-2">
          <div className="p-5">
            <div className="flex flex-col lg:flex-row lg:gap-3 w-full lg:w-fit rounded-t-xl lg:rounded-t-none overflow-hidden">
              <Button
                title="host"
                onClick={() => {
                  setWidget("host");
                }}
                active={widget === "host"}
              />
              <Button
                title="broradcast"
                onClick={() => {
                  setWidget("sps-broradcast");
                }}
                active={widget === "sps-broradcast"}
              />
              <Button
                title="website-builder"
                onClick={() => {
                  setWidget("website-builder");
                }}
                active={widget === "website-builder"}
              />
              <Button
                title="file-storage"
                onClick={() => {
                  setWidget("file-storage");
                }}
                active={widget === "file-storage"}
              />
              <Button
                title="rbac"
                onClick={() => {
                  setWidget("rbac");
                }}
                active={widget === "rbac"}
              />
              <Button
                title="notification"
                onClick={() => {
                  setWidget("notification");
                }}
                active={widget === "notification"}
              />
              <Button
                title="billing"
                onClick={() => {
                  setWidget("billing");
                }}
                active={widget === "billing"}
              />
              <Button
                title="startup"
                onClick={() => {
                  setWidget("startup");
                }}
                active={widget === "startup"}
              />
              <Button
                title="crm"
                onClick={() => {
                  setWidget("crm");
                }}
                active={widget === "crm"}
              />
              <Button
                title="ecommerce"
                onClick={() => {
                  setWidget("ecommerce");
                }}
                active={widget === "ecommerce"}
              />
              <Button
                title="blog"
                onClick={() => {
                  setWidget("blog");
                }}
                active={widget === "blog"}
              />
              <Button
                title="telegram"
                onClick={() => {
                  setWidget("telegram");
                }}
                active={widget === "telegram"}
              />
              <Button
                title="agent"
                onClick={() => {
                  setWidget("agent");
                }}
                active={widget === "agent"}
              />
            </div>
            <div className="bg-white rounded-b-lg">
              {widget === "host" ? (
                <Host {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "sps-broradcast" ? (
                <Broadcast {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "website-builder" ? (
                <WebsiteBuilder {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "file-storage" ? (
                <FileStorage {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "startup" ? (
                <Startup {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "blog" ? (
                <Blog {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "rbac" ? (
                <Rbac {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "notification" ? (
                <Notification {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "billing" ? (
                <Billing {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "crm" ? (
                <Crm {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "ecommerce" ? (
                <Ecommerce {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "telegram" ? (
                <Telegram {...props} isServer={false} variant="default" />
              ) : null}
              {widget === "agent" ? (
                <Agent {...props} isServer={false} variant="default" />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </RbacSubject>
  );
}

function Button(props: {
  title: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={() => {
        props.onClick();
      }}
      data-active={props.active}
      className="w-full lg:w-fit bg-white lg:rounded-t-md overflow-hidden font-bold text-xl whitespace-nowrap leading-none -tracking-[.08em] group"
    >
      <p className="group-data-[active=true]:text-primary group-data-[active=false]:text-input group-hover:opacity-100 transition duration-300">
        {props.title}
      </p>
    </button>
  );
}
