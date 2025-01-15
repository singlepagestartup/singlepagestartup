"use client";

import React, { Fragment } from "react";
/**
 * Not implemented React 19
 */
// import { Dialog, Transition } from "@headlessui/react";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  // return (
  //   <Transition show={props.isOpen} as={Fragment}>
  //     <Dialog
  //       onClose={() => {
  //         props.close();
  //       }}
  //       data-module="website-builder"
  //       data-model="modal"
  //       data-id={props.data?.id || ""}
  //       data-variant={props.variant}
  //       as="div"
  //       className=""
  //     >
  //       <Transition.Child
  //         as={Fragment}
  //         enter="ease-out duration-300"
  //         enterFrom="opacity-0"
  //         enterTo="opacity-100"
  //         leave="ease-out duration-300"
  //         leaveFrom="opacity-100"
  //         leaveTo="opacity-0"
  //       >
  //         <div className="backdrop" aria-hidden="true" />
  //       </Transition.Child>

  //       <Transition.Child
  //         as={Fragment}
  //         enter="ease-out duration-300"
  //         enterFrom="opacity-0 scale-95"
  //         enterTo="opacity-100 scale-100"
  //         leave="ease-out duration-300"
  //         leaveFrom="opacity-100 scale-100"
  //         leaveTo="opacity-0 scale-95"
  //       ></Transition.Child>
  //     </Dialog>
  //   </Transition>
  // );
  return <></>;
}
