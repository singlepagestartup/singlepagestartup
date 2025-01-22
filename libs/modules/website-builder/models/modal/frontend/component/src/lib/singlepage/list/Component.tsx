"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IComponentPropsExtended } from "./interface";
import { Component as Modal } from "../default";

export function Component(props: IComponentPropsExtended) {
  const query = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const openedModal = query?.get("opened_modal");
  const [isOpen, setIsOpen] = useState(false);
  const [modal, setModal] = useState<
    IComponentPropsExtended["data"][number] | undefined
  >();

  useEffect(() => {
    for (const modal of props.data) {
      // if (openedModal === modal?.uid) {
      //   setModal(modal);
      // }
    }
  }, [openedModal]);

  useEffect(() => {
    if (openedModal && !isOpen) {
      setIsOpen(true);
    }

    if (!openedModal && isOpen) {
      setIsOpen(false);
    }
  }, [openedModal]);

  function closeModal() {
    setIsOpen(false);

    if (typeof router?.replace === "function") {
      router.replace(pathname, { scroll: false });
    }
  }

  return (
    <div
      data-module="website-builder"
      data-model="modal"
      data-variant={props.variant}
      className=""
    >
      {/* {modal ? (
        <Modal
          isOpen={isOpen}
          close={() => {
            closeModal();
          }}
          isServer={false}
          
          data={modal}
          variant="default"
        />
      ) : null} */}
    </div>
  );
}
