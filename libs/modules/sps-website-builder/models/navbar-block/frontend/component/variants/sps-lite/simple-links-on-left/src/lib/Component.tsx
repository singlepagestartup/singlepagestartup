"use client";

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/20/solid";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Component as Logotype } from "@sps/sps-website-builder-models-logotype-frontend-component";
import { IComponentPropsExtended } from "./interface";
import { Button } from "@sps/shadcn";
import { Component as NavbarsToButtons } from "@sps/sps-website-builder-relations-navbar-blocks-to-buttons-frontend-component";

export function Component(props: IComponentPropsExtended) {
  return (
    <Disclosure
      data-module="sps-website-builder"
      data-model="page-blocks.navbar-block"
      data-variant={props.variant}
      as="div"
      className="w-full"
    >
      {(disclosure) => {
        return <DisclosureInner disclosure={disclosure} props={props} />;
      }}
    </Disclosure>
  );
}

function DisclosureInner({
  disclosure,
  props,
}: {
  disclosure: any;
  props: IComponentPropsExtended;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (disclosure?.close) {
      disclosure.close();
    }
  }, [pathname, searchParams, disclosure.close]);

  return (
    <>
      <div className="mx-auto flex flex-row w-full">
        <div className="flex w-full h-16 justify-between">
          <div className="flex w-full px-2 lg:px-0 justify-between">
            <div className="flex items-center">
              <div className="py-4 items-center justify-center">
                <p className="text-3xl font-bold">Single Page Startup</p>
              </div>
              {/* {props.data.logotype ? (
                <Logotype
                  isServer={false}
                  data={props.data.logotype}
                  variant="default"
                />
              ) : null} */}
              <div className="hidden lg:ml-6 lg:flex lg:space-x-2 items-center">
                {props.data.SPSWBNavbarBlocksToButtons.map(
                  (navbarBlockToButton, index) => {
                    if (navbarBlockToButton.place !== "default") {
                      return;
                    }

                    return (
                      <NavbarsToButtons
                        key={index}
                        variant="default"
                        data={navbarBlockToButton}
                        isServer={false}
                      />
                    );
                  },
                )}
              </div>
            </div>
            <div className="hidden lg:flex lg:space-x-2 items-center">
              {props.data.SPSWBNavbarBlocksToButtons.map(
                (navbarBlockToButton, index) => {
                  if (navbarBlockToButton.place !== "additional") {
                    return;
                  }

                  return (
                    <NavbarsToButtons
                      key={index}
                      variant="default"
                      data={navbarBlockToButton}
                      isServer={false}
                    />
                  );
                },
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center lg:hidden pr-2">
          <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
            <span className="sr-only">Open main menu</span>
            {disclosure.open ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </Disclosure.Button>
        </div>
      </div>

      <Disclosure.Panel className="lg:hidden py-2">
        <div className="flex flex-col gap-3 px-2 ">
          <Button variant="link">Main page</Button>
          <Button variant="link">About page</Button>
          {/* {props.data.buttons?.map((button, index) => {
            return (
              <Button
                isServer={false}
                key={index}
                variant={button.variant}
                data={button}
              />
            );
          })}
          {props.data.additionalButtons?.map((button, index) => {
            return (
              <Button
                isServer={false}
                key={index}
                variant={button.variant}
                data={button}
              />
            );
          })} */}
        </div>
      </Disclosure.Panel>
    </>
  );
}
